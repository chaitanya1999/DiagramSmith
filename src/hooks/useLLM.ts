import { useState, useCallback, useRef } from 'react';
import { editDiagram, askDiagram, LlmError } from '../services/llm';
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
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const generate = useCallback(
    async (
      currentMermaid: string,
      instruction: string,
      config: LlmConfig,
      options?: {
        includeSummary?: boolean;
        generateSummary?: boolean;
        currentSummary?: string;
        includeSyntaxGuide?: boolean;
      }
    ): Promise<EditDiagramResult | null> => {
      // Abort any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      timeoutIdRef.current = timeoutId;

      setIsLoading(true);
      setError(null);
      try {
        const result = await editDiagram(currentMermaid, instruction, config, {
          ...options,
          signal: controller.signal,
        });
        return result;
      } catch (e) {
        if (e instanceof LlmError) {
          setError(e.message);
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

  const ask = useCallback(
    async (
      currentMermaid: string,
      question: string,
      config: LlmConfig,
      options?: {
        includeSummary?: boolean;
        currentSummary?: string;
        includeSyntaxGuide?: boolean;
      }
    ): Promise<AskDiagramResult | null> => {
      // Abort any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      timeoutIdRef.current = timeoutId;

      setIsLoading(true);
      setError(null);
      try {
        const result = await askDiagram(currentMermaid, question, config, {
          ...options,
          signal: controller.signal,
        });
        return result;
      } catch (e) {
        if (e instanceof LlmError) {
          setError(e.message);
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

  const clearError = useCallback(() => setError(null), []);

  return { isLoading, error, generate, ask, clearError, abort };
}