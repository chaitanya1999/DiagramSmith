import type { LlmConfig } from '../types';
import {
  buildSystemPrompt,
  buildAskSystemPrompt,
  tryGetDiagramType,
  SUMMARY_DELIMITER,
} from '../utils/constants';

export type LlmErrorCode =
  | 'invalid_key'
  | 'forbidden'
  | 'billing'
  | 'rate_limited'
  | 'server_error'
  | 'timeout'
  | 'cancelled'
  | 'malformed_response'
  | 'network_error'
  | 'unsupported_model';

export class LlmError extends Error {
  public readonly code: LlmErrorCode;

  constructor(message: string, code: LlmErrorCode) {
    super(message);
    this.name = 'LlmError';
    this.code = code;
  }
}

/**
 * Abort reasons, passed to `AbortController.abort()` so the catch block can tell a
 * deliberate user cancellation apart from the request timeout. Without this both
 * arrive as an indistinguishable AbortError and cancelling shows a false error.
 */
export const ABORT_REASON_USER = 'diagramsmith:user-cancel';
export const ABORT_REASON_TIMEOUT = 'diagramsmith:timeout';

interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatCompletionMessage[];
  temperature: number;
}

interface ChatCompletionResponse {
  choices?: {
    message?: { content?: string };
    finish_reason?: string | null;
  }[];
  error?: { message?: string } | string;
}

interface ChatCompletionResult {
  content: string;
  /** True when the provider cut the response short (token cap or content filter). */
  truncated: boolean;
}

export interface EditDiagramResult {
  mermaid: string;
  /** `null` means the response carried no summary — the caller must keep the existing one. */
  summary: string | null;
  rawContent: string;
  truncated: boolean;
}

export interface AskDiagramResult {
  answer: string;
  truncated: boolean;
}

/** Provider error bodies can be kilobytes of JSON or a whole HTML page; toasts cannot. */
const MAX_ERROR_DETAIL_CHARS = 200;

function truncateForDisplay(text: string): string {
  const collapsed = text.replace(/\s+/g, ' ').trim();
  return collapsed.length > MAX_ERROR_DETAIL_CHARS
    ? `${collapsed.slice(0, MAX_ERROR_DETAIL_CHARS)}…`
    : collapsed;
}

/** Pulls the human-readable message out of a provider error body, JSON or not. */
function extractProviderMessage(body: string): string {
  try {
    const parsed = JSON.parse(body);
    const message = parsed?.error?.message ?? parsed?.error ?? parsed?.message;
    if (typeof message === 'string' && message.trim()) {
      return truncateForDisplay(message);
    }
  } catch {
    // Not JSON — fall through and use the raw body.
  }
  return truncateForDisplay(body) || 'Unknown error';
}

function buildHttpError(status: number, body: string): LlmError {
  const detail = extractProviderMessage(body);

  if (status === 401) {
    return new LlmError('Invalid API key. Please check your settings.', 'invalid_key');
  }
  // Reasoning models (o1/o3-series and friends) accept only the default temperature.
  if (status === 400 && /temperature/i.test(body)) {
    return new LlmError(
      `This model does not accept the configured temperature. Try setting Temperature to 1 in Settings. (${detail})`,
      'unsupported_model'
    );
  }
  if (status === 402) {
    return new LlmError(`Billing issue — check your account credits. (${detail})`, 'billing');
  }
  if (status === 403) {
    return new LlmError(
      `Access denied — your API key may not have access to this model. (${detail})`,
      'forbidden'
    );
  }
  if (status === 404) {
    return new LlmError(
      `Not found (404) — check the Base URL and the model name. (${detail})`,
      'network_error'
    );
  }
  if (status === 429) {
    return new LlmError(
      `Rate limited — wait a moment and try again. (${detail})`,
      'rate_limited'
    );
  }
  if (status >= 500) {
    return new LlmError(
      `The provider returned an error (${status}). This is not your configuration — try again shortly. (${detail})`,
      'server_error'
    );
  }
  return new LlmError(`API error (${status}): ${detail}`, 'network_error');
}

function buildHeaders(config: LlmConfig): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.sendAuthorization !== false && config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }
  return headers;
}

function apiUrl(config: LlmConfig, path: string): string {
  return `${config.baseUrl.replace(/\/+$/, '')}${path}`;
}

/**
 * Normalises anything thrown during a request into an LlmError. Shared so the
 * connection test reports failures in exactly the same words as a real request.
 */
function toLlmError(e: unknown, signal?: AbortSignal): LlmError {
  if (e instanceof LlmError) return e;

  // Check the signal rather than the rejection value: `abort(reason)` rejects
  // with the reason itself, which is not a DOMException when a reason is given.
  if (signal?.aborted) {
    if (signal.reason === ABORT_REASON_TIMEOUT) {
      return new LlmError('Request timed out. The model took too long to respond.', 'timeout');
    }
    return new LlmError('Request cancelled.', 'cancelled');
  }

  // Chrome: "Failed to fetch" · Firefox: "NetworkError when attempting to fetch
  // resource." · Safari: "Load failed". Matching on the message misses Safari,
  // so treat any TypeError out of fetch as a network failure.
  if (e instanceof TypeError) {
    return new LlmError(
      'Network error. Please check your Base URL and ensure the API is reachable.',
      'network_error'
    );
  }

  return new LlmError(
    `Unexpected error: ${e instanceof Error ? e.message : 'Unknown error'}`,
    'network_error'
  );
}

/**
 * Single transport for both Action and Ask modes. Everything below the prompt
 * construction is identical between them, so it lives here once.
 */
async function callChatCompletion(
  messages: ChatCompletionMessage[],
  config: LlmConfig,
  signal?: AbortSignal
): Promise<ChatCompletionResult> {
  try {
    const requestBody: ChatCompletionRequest = {
      model: config.model,
      messages,
      temperature: config.temperature,
    };

    const response = await fetch(apiUrl(config, '/chat/completions'), {
      method: 'POST',
      headers: buildHeaders(config),
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw buildHttpError(response.status, errorText);
    }

    let data: ChatCompletionResponse;
    try {
      data = await response.json();
    } catch {
      throw new LlmError(
        'The endpoint returned a response that is not valid JSON. Check that the Base URL points to an OpenAI-compatible API.',
        'malformed_response'
      );
    }

    // Some OpenAI-compatible endpoints (Ollama, LM Studio, proxies) answer with
    // HTTP 200 and an error payload instead of a non-2xx status. Surface the real
    // reason rather than the misleading "empty response".
    if (!data.choices?.length) {
      const providerMessage = typeof data.error === 'string' ? data.error : data.error?.message;
      if (providerMessage) {
        throw new LlmError(`API error: ${truncateForDisplay(providerMessage)}`, 'network_error');
      }
      throw new LlmError('LLM returned an empty response.', 'malformed_response');
    }

    const choice = data.choices[0];
    const content = choice?.message?.content?.trim();

    if (!content) {
      throw new LlmError('LLM returned an empty response.', 'malformed_response');
    }

    const finishReason = choice?.finish_reason ?? null;
    return {
      content,
      truncated: finishReason === 'length' || finishReason === 'content_filter',
    };
  } catch (e: unknown) {
    throw toLlmError(e, signal);
  }
}

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
  /** Model ids the endpoint advertises, when it implements GET /models. */
  models?: string[];
}

/** Returns null when the endpoint simply does not implement GET /models. */
async function listModels(config: LlmConfig, signal?: AbortSignal): Promise<string[] | null> {
  const response = await fetch(apiUrl(config, '/models'), {
    method: 'GET',
    headers: buildHeaders(config),
    signal,
  });

  // Plenty of OpenAI-compatible proxies only implement /chat/completions.
  if (response.status === 404 || response.status === 405 || response.status === 501) return null;

  if (!response.ok) {
    throw buildHttpError(response.status, await response.text().catch(() => ''));
  }

  const data = await response.json().catch(() => null);
  const entries = (data as { data?: unknown } | null)?.data;
  if (!Array.isArray(entries)) return null;

  return entries
    .map((entry) => (entry as { id?: unknown })?.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);
}

/**
 * Verifies the configured endpoint before the user spends a real request on it.
 *
 * Tries GET /models first — free, instant, and it proves URL, CORS, credentials and
 * model availability in one call. Falls back to a minimal completion for endpoints
 * that don't implement it, which tests the exact path the app actually uses.
 */
export async function testConnection(
  config: LlmConfig,
  signal?: AbortSignal
): Promise<ConnectionTestResult> {
  if (!config.baseUrl.trim()) {
    return { ok: false, message: 'Enter a Base URL first.' };
  }
  if (!config.model.trim()) {
    return { ok: false, message: 'Enter a model name first.' };
  }

  try {
    const models = await listModels(config, signal);

    if (models && models.length > 0) {
      const available = models.includes(config.model);
      return {
        ok: true,
        models,
        message: available
          ? `Connected. Model "${config.model}" is available.`
          : `Connected, but "${config.model}" is not among the ${models.length} models this endpoint lists.`,
      };
    }

    await callChatCompletion([{ role: 'user', content: 'Reply with OK.' }], config, signal);
    return { ok: true, message: `Connected. Model "${config.model}" responded.` };
  } catch (e) {
    return { ok: false, message: toLlmError(e, signal).message };
  }
}

function buildUserMessage(
  currentMermaid: string,
  trailer: string,
  options?: { includeSummary?: boolean; currentSummary?: string }
): string {
  let userMessage = `Current Mermaid diagram:\n\`\`\`\n${currentMermaid}\n\`\`\`\n`;
  if (options?.includeSummary && options?.currentSummary) {
    userMessage += `\nCurrent text summary of the diagram:\n${options.currentSummary}\n`;
  }
  return userMessage + trailer;
}

/**
 * Sends the current Mermaid diagram + optional summary + user instruction to an OpenAI-compatible LLM
 * and returns the updated Mermaid syntax and optionally a text summary.
 */
export async function editDiagram(
  currentMermaid: string,
  instruction: string,
  config: LlmConfig,
  options?: {
    includeSummary?: boolean;
    generateSummary?: boolean;
    currentSummary?: string;
    includeSyntaxGuide?: boolean;
    signal?: AbortSignal;
  }
): Promise<EditDiagramResult> {
  const systemPrompt = buildSystemPrompt({
    includeSummary: options?.includeSummary,
    generateSummary: options?.generateSummary,
    includeSyntaxGuide: options?.includeSyntaxGuide,
    diagramType: tryGetDiagramType(currentMermaid),
  });

  const { content, truncated } = await callChatCompletion(
    [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: buildUserMessage(currentMermaid, `\nUser instruction: ${instruction}`, options),
      },
    ],
    config,
    options?.signal
  );

  if (options?.generateSummary) {
    return parseDualOutput(content, truncated);
  }

  const cleaned = stripCodeFences(content);
  if (!cleaned) {
    throw new LlmError('LLM returned an empty response after cleaning.', 'malformed_response');
  }

  return { mermaid: cleaned, summary: null, rawContent: content, truncated };
}

/**
 * Sends the current Mermaid diagram + optional summary + user question to an OpenAI-compatible LLM
 * and returns a plain-text answer. The diagram is never modified in ASK mode.
 */
export async function askDiagram(
  currentMermaid: string,
  question: string,
  config: LlmConfig,
  options?: {
    includeSummary?: boolean;
    currentSummary?: string;
    includeSyntaxGuide?: boolean;
    signal?: AbortSignal;
  }
): Promise<AskDiagramResult> {
  const systemPrompt = buildAskSystemPrompt({
    includeSummary: options?.includeSummary,
    includeSyntaxGuide: options?.includeSyntaxGuide,
    diagramType: tryGetDiagramType(currentMermaid),
  });

  const { content, truncated } = await callChatCompletion(
    [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: buildUserMessage(currentMermaid, `\nUser question: ${question}`, options),
      },
    ],
    config,
    options?.signal
  );

  return { answer: content, truncated };
}

/**
 * A forgiving matcher for SUMMARY_DELIMITER, derived from the constant so the two
 * cannot drift apart. Models routinely emit the boundary token with the decoration
 * slightly wrong — fewer dashes, added spaces, lowercased, wrapped in markdown
 * emphasis — and an exact `indexOf` treats all of those as "no summary at all".
 */
const DELIMITER_PATTERN = new RegExp(
  '[ \\t]*[-=*_~#]*[ \\t]*' +
    SUMMARY_DELIMITER.replace(/[^A-Za-z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .join('[\\s_-]*') +
    '[ \\t]*[-=*_~#]*[ \\t]*',
  'i'
);

export function parseDualOutput(content: string, truncated = false): EditDiagramResult {
  const match = content.match(DELIMITER_PATTERN);

  if (!match || match.index === undefined) {
    // No boundary anywhere: the model omitted it, mangled it beyond recognition,
    // or the response was cut short. Treat the whole reply as Mermaid and report
    // `summary: null` so the caller keeps the summary the user already has.
    const mermaid = stripCodeFences(content);
    if (!mermaid) {
      throw new LlmError('LLM returned an empty response after cleaning.', 'malformed_response');
    }
    return { mermaid, summary: null, rawContent: content, truncated };
  }

  // Strip fences per half rather than across the whole reply: a model that fences
  // each section separately would otherwise leave stray backticks in the summary.
  const mermaid = stripCodeFences(content.slice(0, match.index));
  const summary = stripCodeFences(content.slice(match.index + match[0].length));

  if (!mermaid) {
    throw new LlmError('LLM returned an empty Mermaid code.', 'malformed_response');
  }

  return { mermaid, summary: summary || null, rawContent: content, truncated };
}

export function stripCodeFences(text: string): string {
  return text
    .trim()
    .replace(/^```[^\n]*\r?\n?/, '')
    .replace(/\r?\n?```$/, '')
    .trim();
}
