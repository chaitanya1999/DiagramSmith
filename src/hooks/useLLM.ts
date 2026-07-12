import { useState, useCallback } from 'react';
import { editDiagram, LlmError } from '../services/llm';
import type { LlmConfig } from '../types';

interface UseLLMReturn {
  isLoading: boolean;
  error: string | null;
  generate: (currentMermaid: string, instruction: string, config: LlmConfig) => Promise<string | null>;
  clearError: () => void;
}

export function useLLM(): UseLLMReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (currentMermaid: string, instruction: string, config: LlmConfig): Promise<string | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await editDiagram(currentMermaid, instruction, config);
        return result;
      } catch (e) {
        if (e instanceof LlmError) {
          setError(e.message);
        } else {
          setError('Unexpected error occurred.');
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return { isLoading, error, generate, clearError };
}