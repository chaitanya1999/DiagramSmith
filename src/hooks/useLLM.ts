import { useState, useCallback, useRef } from 'react';
import {
  editDiagram,
  askDiagram,
  LlmError,
  ABORT_REASON_USER,
  ABORT_REASON_TIMEOUT,
} from '../services/llm';
import type { LlmConfig } from '../types';
import type { EditDiagramResult, AskDiagramResult } from '../services/llm';
import { REQUEST_TIMEOUT_MS } from '../utils/constants';

interface UseLLMReturn {
  isLoading: boolean;
  error: string | null;
  generate: (
    currentMermaid: string,
    instruction: string,
    config: LlmConfig,
    options?: {
      includeSummary?: boolean;
      generateSummary?: boolean;
      currentSummary?: string;
      includeSyntaxGuide?: boolean;
    }
  ) => Promise<EditDiagramResult | null>;
  ask: (
    currentMermaid: string,
    question: string,
    config: LlmConfig,
    options?: {
      includeSummary?: boolean;
      currentSummary?: string;
      includeSyntaxGuide?: boolean;
    }
  ) => Promise<AskDiagramResult | null>;
  clearError: () => void;
  abort: () => void;
}

export function useLLM(): UseLLMReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(ABORT_REASON_USER);
      abortControllerRef.current = null;
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    setIsLoading(false);
  }, []);

  /** Shared lifecycle for both modes: abort wiring, timeout, loading and error state. */
  const runRequest = useCallback(
    async <T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T | null> => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort(ABORT_REASON_USER);
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const timeoutId = setTimeout(() => controller.abort(ABORT_REASON_TIMEOUT), REQUEST_TIMEOUT_MS);
      timeoutIdRef.current = timeoutId;

      setIsLoading(true);
      setError(null);
      try {
        return await fn(controller.signal);
      } catch (e) {
        if (e instanceof LlmError) {
          // Cancelling is something the user did on purpose — not an error to report.
          if (e.code !== 'cancelled') setError(e.message);
        } else {
          setError('Unexpected error occurred.');
        }
        return null;
      } finally {
        clearTimeout(timeoutId);
        timeoutIdRef.current = null;
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        setIsLoading(false);
      }
    },
    []
  );

  const generate = useCallback(
    (
      currentMermaid: string,
      instruction: string,
      config: LlmConfig,
      options?: {
        includeSummary?: boolean;
        generateSummary?: boolean;
        currentSummary?: string;
        includeSyntaxGuide?: boolean;
      }
    ): Promise<EditDiagramResult | null> =>
      runRequest((signal) => editDiagram(currentMermaid, instruction, config, { ...options, signal })),
    [runRequest]
  );

  const ask = useCallback(
    (
      currentMermaid: string,
      question: string,
      config: LlmConfig,
      options?: {
        includeSummary?: boolean;
        currentSummary?: string;
        includeSyntaxGuide?: boolean;
      }
    ): Promise<AskDiagramResult | null> =>
      runRequest((signal) => askDiagram(currentMermaid, question, config, { ...options, signal })),
    [runRequest]
  );

  const clearError = useCallback(() => setError(null), []);

  return { isLoading, error, generate, ask, clearError, abort };
}
