import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  parseDualOutput,
  stripCodeFences,
  editDiagram,
  askDiagram,
  LlmError,
  ABORT_REASON_USER,
  ABORT_REASON_TIMEOUT,
} from '../llm';
import { SUMMARY_DELIMITER, DEFAULT_LLM_CONFIG } from '../../utils/constants';

/** Minimal stand-in for the bits of Response that the client actually touches. */
function fakeResponse(status: number, body: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
    json: async () => JSON.parse(body),
  } as unknown as Response;
}

function completionBody(content: string, finishReason: string | null = 'stop'): string {
  return JSON.stringify({ choices: [{ message: { content }, finish_reason: finishReason }] });
}

function stubFetch(status: number, body: string) {
  vi.stubGlobal('fetch', vi.fn(async () => fakeResponse(status, body)));
}

/** Rejects the way fetch does once its signal has been aborted with a reason. */
function stubAbortedFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init: RequestInit) => {
      const signal = init.signal as AbortSignal | undefined;
      throw signal?.reason ?? new DOMException('Aborted', 'AbortError');
    })
  );
}

async function expectLlmError(promise: Promise<unknown>): Promise<LlmError> {
  try {
    await promise;
  } catch (e) {
    expect(e).toBeInstanceOf(LlmError);
    return e as LlmError;
  }
  throw new Error('expected the call to reject with an LlmError');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('stripCodeFences', () => {
  it('strips a mermaid-tagged fence', () => {
    expect(stripCodeFences('```mermaid\ngraph TD\n  A --> B\n```')).toBe('graph TD\n  A --> B');
  });

  it('strips a fence with any other language tag', () => {
    expect(stripCodeFences('```text\nA summary.\n```')).toBe('A summary.');
  });

  it('strips a bare fence', () => {
    expect(stripCodeFences('```\ngraph TD\n```')).toBe('graph TD');
  });

  it('leaves unfenced text untouched', () => {
    expect(stripCodeFences('graph TD\n  A --> B')).toBe('graph TD\n  A --> B');
  });
});

describe('parseDualOutput', () => {
  const mermaid = 'graph TD\n  A --> B';

  it('splits on the exact delimiter', () => {
    const result = parseDualOutput(`${mermaid}\n${SUMMARY_DELIMITER}\nA flow from A to B.`);
    expect(result.mermaid).toBe(mermaid);
    expect(result.summary).toBe('A flow from A to B.');
  });

  // The regression test for the summary-wipe bug: a missing boundary must never be
  // reported as "the model returned an empty summary".
  it('returns summary: null when the delimiter is absent', () => {
    const result = parseDualOutput(mermaid);
    expect(result.mermaid).toBe(mermaid);
    expect(result.summary).toBeNull();
  });

  it('returns summary: null when the section after the delimiter is empty', () => {
    const result = parseDualOutput(`${mermaid}\n${SUMMARY_DELIMITER}\n   \n`);
    expect(result.summary).toBeNull();
  });

  it.each([
    ['fewer dashes', '--==DIAGRAMSMITH_SUMMARY_BOUNDARY==--'],
    ['extra spaces', '---== DIAGRAMSMITH_SUMMARY_BOUNDARY ==---'],
    ['lowercased', '---==diagramsmith_summary_boundary==---'],
    ['markdown emphasis', '**---==DIAGRAMSMITH_SUMMARY_BOUNDARY==---**'],
    ['spaces for underscores', 'DIAGRAMSMITH SUMMARY BOUNDARY'],
    ['no decoration', 'DIAGRAMSMITH_SUMMARY_BOUNDARY'],
  ])('tolerates a near-miss delimiter (%s)', (_label, delimiter) => {
    const result = parseDualOutput(`${mermaid}\n${delimiter}\nA flow from A to B.`);
    expect(result.mermaid).toBe(mermaid);
    expect(result.summary).toBe('A flow from A to B.');
  });

  it('strips fences from each half independently', () => {
    const content = [
      '```mermaid',
      mermaid,
      '```',
      SUMMARY_DELIMITER,
      '```text',
      'A flow from A to B.',
      '```',
    ].join('\n');
    const result = parseDualOutput(content);
    expect(result.mermaid).toBe(mermaid);
    expect(result.summary).toBe('A flow from A to B.');
  });

  it('strips a single fence wrapping the whole reply', () => {
    const content = ['```', mermaid, SUMMARY_DELIMITER, 'A flow from A to B.', '```'].join('\n');
    const result = parseDualOutput(content);
    expect(result.mermaid).toBe(mermaid);
    expect(result.summary).toBe('A flow from A to B.');
  });

  it('preserves the raw content and the truncated flag', () => {
    const content = `${mermaid}\n${SUMMARY_DELIMITER}\nA summary.`;
    const result = parseDualOutput(content, true);
    expect(result.rawContent).toBe(content);
    expect(result.truncated).toBe(true);
  });

  it('rejects a reply whose Mermaid half is empty', async () => {
    const error = await expectLlmError(
      Promise.resolve().then(() => parseDualOutput(`${SUMMARY_DELIMITER}\nOnly a summary.`))
    );
    expect(error.code).toBe('malformed_response');
  });
});

describe('editDiagram — truncation', () => {
  it('flags finish_reason "length" without discarding the output', async () => {
    stubFetch(200, completionBody('graph TD\n  A --> B', 'length'));
    const result = await editDiagram('graph TD', 'add B', DEFAULT_LLM_CONFIG);
    expect(result.truncated).toBe(true);
    expect(result.mermaid).toBe('graph TD\n  A --> B');
  });

  it('flags finish_reason "content_filter"', async () => {
    stubFetch(200, completionBody('graph TD', 'content_filter'));
    const result = await editDiagram('graph TD', 'edit', DEFAULT_LLM_CONFIG);
    expect(result.truncated).toBe(true);
  });

  it('does not flag a normal completion', async () => {
    stubFetch(200, completionBody('graph TD', 'stop'));
    const result = await editDiagram('graph TD', 'edit', DEFAULT_LLM_CONFIG);
    expect(result.truncated).toBe(false);
  });

  it('keeps the summary null when a truncated reply lost its delimiter', async () => {
    stubFetch(200, completionBody('graph TD\n  A --> ', 'length'));
    const result = await editDiagram('graph TD', 'edit', DEFAULT_LLM_CONFIG, {
      generateSummary: true,
    });
    expect(result.truncated).toBe(true);
    expect(result.summary).toBeNull();
  });

  it('flags truncation in ask mode too', async () => {
    stubFetch(200, completionBody('The diagram shows', 'length'));
    const result = await askDiagram('graph TD', 'what is this?', DEFAULT_LLM_CONFIG);
    expect(result.truncated).toBe(true);
  });
});

describe('editDiagram — HTTP error mapping', () => {
  it.each([
    [401, '{}', 'invalid_key'],
    [402, '{"error":{"message":"Insufficient credits"}}', 'billing'],
    [403, '{"error":{"message":"No access to model"}}', 'forbidden'],
    [404, '{"error":{"message":"Unknown model"}}', 'network_error'],
    [429, '{"error":{"message":"Rate limit reached"}}', 'rate_limited'],
    [500, '{"error":{"message":"Internal error"}}', 'server_error'],
    [503, 'Service Unavailable', 'server_error'],
  ])('maps HTTP %i to %s', async (status, body, code) => {
    stubFetch(status, body);
    const error = await expectLlmError(editDiagram('graph TD', 'edit', DEFAULT_LLM_CONFIG));
    expect(error.code).toBe(code);
  });

  it('maps a temperature rejection to unsupported_model', async () => {
    stubFetch(
      400,
      '{"error":{"message":"Unsupported value: \'temperature\' does not support 0.3"}}'
    );
    const error = await expectLlmError(editDiagram('graph TD', 'edit', DEFAULT_LLM_CONFIG));
    expect(error.code).toBe('unsupported_model');
    expect(error.message).toMatch(/Temperature/i);
  });

  it('surfaces the provider message rather than the raw body', async () => {
    stubFetch(429, '{"error":{"message":"Rate limit reached for gpt-4o-mini"}}');
    const error = await expectLlmError(editDiagram('graph TD', 'edit', DEFAULT_LLM_CONFIG));
    expect(error.message).toContain('Rate limit reached for gpt-4o-mini');
  });

  it('truncates a very long error body before it reaches a toast', async () => {
    stubFetch(500, `<html>${'x'.repeat(5000)}</html>`);
    const error = await expectLlmError(editDiagram('graph TD', 'edit', DEFAULT_LLM_CONFIG));
    expect(error.message.length).toBeLessThan(400);
    expect(error.message).toContain('…');
  });
});

describe('editDiagram — malformed 200 responses', () => {
  it('surfaces an error payload returned with HTTP 200', async () => {
    stubFetch(200, '{"error":{"message":"model \'llama3\' not found"}}');
    const error = await expectLlmError(editDiagram('graph TD', 'edit', DEFAULT_LLM_CONFIG));
    expect(error.message).toContain("model 'llama3' not found");
  });

  it('surfaces a string error payload returned with HTTP 200', async () => {
    stubFetch(200, '{"error":"model not loaded"}');
    const error = await expectLlmError(editDiagram('graph TD', 'edit', DEFAULT_LLM_CONFIG));
    expect(error.message).toContain('model not loaded');
  });

  it('reports non-JSON bodies as malformed rather than crashing', async () => {
    stubFetch(200, '<html>not an API</html>');
    const error = await expectLlmError(editDiagram('graph TD', 'edit', DEFAULT_LLM_CONFIG));
    expect(error.code).toBe('malformed_response');
  });

  it('reports an empty choices array', async () => {
    stubFetch(200, '{"choices":[]}');
    const error = await expectLlmError(editDiagram('graph TD', 'edit', DEFAULT_LLM_CONFIG));
    expect(error.code).toBe('malformed_response');
  });
});

describe('editDiagram — abort handling', () => {
  it('reports a deliberate cancel as "cancelled"', async () => {
    stubAbortedFetch();
    const controller = new AbortController();
    controller.abort(ABORT_REASON_USER);
    const error = await expectLlmError(
      editDiagram('graph TD', 'edit', DEFAULT_LLM_CONFIG, { signal: controller.signal })
    );
    expect(error.code).toBe('cancelled');
  });

  it('reports the request timeout as "timeout"', async () => {
    stubAbortedFetch();
    const controller = new AbortController();
    controller.abort(ABORT_REASON_TIMEOUT);
    const error = await expectLlmError(
      editDiagram('graph TD', 'edit', DEFAULT_LLM_CONFIG, { signal: controller.signal })
    );
    expect(error.code).toBe('timeout');
    expect(error.message).toMatch(/timed out/i);
  });
});

describe('editDiagram — network failures', () => {
  // Safari throws "Load failed", which the old message-substring check missed.
  it.each([
    ['Chrome', 'Failed to fetch'],
    ['Firefox', 'NetworkError when attempting to fetch resource.'],
    ['Safari', 'Load failed'],
  ])('maps a %s fetch TypeError to network_error', async (_browser, message) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError(message);
      })
    );
    const error = await expectLlmError(editDiagram('graph TD', 'edit', DEFAULT_LLM_CONFIG));
    expect(error.code).toBe('network_error');
    expect(error.message).toMatch(/Base URL/);
  });
});
