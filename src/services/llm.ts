import type { LlmConfig } from '../types';
import {
  buildSystemPrompt,
  buildAskSystemPrompt,
  getDiagramType,
  SUMMARY_DELIMITER,
} from '../utils/constants';

export type LlmErrorCode = 'invalid_key' | 'timeout' | 'malformed_response' | 'network_error' | 'unsupported_model';

export class LlmError extends Error {
  public readonly code: LlmErrorCode;

  constructor(message: string, code: LlmErrorCode) {
    super(message);
    this.name = 'LlmError';
    this.code = code;
  }
}

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
  choices: {
    message: {
      content: string;
    };
  }[];
}

export interface EditDiagramResult {
  mermaid: string;
  summary: string | null;
  rawContent: string;
}

export interface AskDiagramResult {
  answer: string;
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
  // Compose system prompt dynamically (single source of truth)
  const systemPrompt = buildSystemPrompt({
    includeSummary: options?.includeSummary,
    generateSummary: options?.generateSummary,
    includeSyntaxGuide: options?.includeSyntaxGuide,
    diagramType: getDiagramType(currentMermaid),
  });

  // Build user message
  let userMessage = `Current Mermaid diagram:\n\`\`\`\n${currentMermaid}\n\`\`\`\n`;
  if (options?.includeSummary && options?.currentSummary) {
    userMessage += `\nCurrent text summary of the diagram:\n${options.currentSummary}\n`;
  }
  userMessage += `\nUser instruction: ${instruction}`;

  try {
    const requestBody: ChatCompletionRequest = {
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: config.temperature,
    };

    const response = await fetch(`${config.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: options?.signal,
    });

    if (response.status === 401) {
      throw new LlmError('Invalid API key. Please check your settings.', 'invalid_key');
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new LlmError(
        `API error (${response.status}): ${errorText}`,
        'network_error'
      );
    }

    const data: ChatCompletionResponse = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new LlmError('LLM returned an empty response.', 'malformed_response');
    }

    // If generating summary, parse the two-part response
    if (options?.generateSummary) {
      return parseDualOutput(content);
    }

    // Otherwise, just clean the Mermaid syntax
    const cleaned = cleanMermaidCode(content);

    if (!cleaned) {
      throw new LlmError('LLM returned an empty response after cleaning.', 'malformed_response');
    }

    return { mermaid: cleaned, summary: null, rawContent: content };
  } catch (e: unknown) {
    if (e instanceof LlmError) throw e;
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new LlmError('Request cancelled.', 'timeout');
    }
    if (e instanceof TypeError && e.message.includes('fetch')) {
      throw new LlmError(
        'Network error. Please check your Base URL and ensure the API is reachable.',
        'network_error'
      );
    }
    throw new LlmError(
      `Unexpected error: ${e instanceof Error ? e.message : 'Unknown error'}`,
      'network_error'
    );
  }
}

function parseDualOutput(content: string): EditDiagramResult {
  // Strip any accidental markdown code fences from the entire response first
  const cleaned = content
    .replace(/^```(?:mermaid)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  const delimiterIndex = cleaned.indexOf(SUMMARY_DELIMITER);

  if (delimiterIndex === -1) {
    // No delimiter found — treat the entire response as Mermaid code
    const mermaid = cleanMermaidCode(cleaned);
    if (!mermaid) {
      throw new LlmError('LLM returned an empty response after cleaning.', 'malformed_response');
    }
    return { mermaid, summary: '', rawContent: content };
  }

  const mermaidPart = cleaned.substring(0, delimiterIndex).trim();
  const summaryPart = cleaned.substring(delimiterIndex + SUMMARY_DELIMITER.length).trim();

  const mermaid = cleanMermaidCode(mermaidPart);
  if (!mermaid) {
    throw new LlmError('LLM returned an empty Mermaid code.', 'malformed_response');
  }

  return { mermaid, summary: summaryPart || '', rawContent: content };
}

function cleanMermaidCode(code: string): string {
  return code
    .replace(/^```(?:mermaid)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
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
  // Compose ASK-mode system prompt
  const systemPrompt = buildAskSystemPrompt({
    includeSummary: options?.includeSummary,
    includeSyntaxGuide: options?.includeSyntaxGuide,
    diagramType: getDiagramType(currentMermaid),
  });

  // Build user message
  let userMessage = `Current Mermaid diagram:\n\`\`\`\n${currentMermaid}\n\`\`\`\n`;
  if (options?.includeSummary && options?.currentSummary) {
    userMessage += `\nCurrent text summary of the diagram:\n${options.currentSummary}\n`;
  }
  userMessage += `\nUser question: ${question}`;

  try {
    const requestBody: ChatCompletionRequest = {
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: config.temperature,
    };

    const response = await fetch(`${config.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: options?.signal,
    });

    if (response.status === 401) {
      throw new LlmError('Invalid API key. Please check your settings.', 'invalid_key');
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new LlmError(
        `API error (${response.status}): ${errorText}`,
        'network_error'
      );
    }

    const data: ChatCompletionResponse = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new LlmError('LLM returned an empty response.', 'malformed_response');
    }

    return { answer: content };
  } catch (e: unknown) {
    if (e instanceof LlmError) throw e;
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new LlmError('Request cancelled.', 'timeout');
    }
    if (e instanceof TypeError && e.message.includes('fetch')) {
      throw new LlmError(
        'Network error. Please check your Base URL and ensure the API is reachable.',
        'network_error'
      );
    }
    throw new LlmError(
      `Unexpected error: ${e instanceof Error ? e.message : 'Unknown error'}`,
      'network_error'
    );
  }
}
