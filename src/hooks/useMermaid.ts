import { useState, useCallback, useEffect, useRef } from 'react';
import { validate } from '../services/mermaid';
import { loadMermaid, saveMermaid, loadSummary, saveSummary } from '../services/storage';
import { DEFAULT_TEMPLATES, DEFAULT_DIAGRAM_TYPE } from '../utils/constants';

interface UseMermaidReturn {
  currentMermaid: string;
  editorMermaid: string;
  summary: string;
  parseError: string | null;
  isDiagramValid: boolean;
  setEditorMermaid: (value: string) => void;
  setSummary: (value: string) => void;
  updateFromEditor: (value: string) => Promise<void>;
  updateFromLlm: (value: string) => Promise<boolean>;
  updateFromLlmWithSummary: (mermaid: string, summary: string) => Promise<boolean>;
  resetToDefault: () => void;
  importMermaid: (value: string) => Promise<boolean>;
  importDocument: (mermaid: string, summary: string) => Promise<boolean>;
  setMermaidDirectly: (value: string) => void;
}

export function useMermaid(): UseMermaidReturn {
  const [currentMermaid, setCurrentMermaid] = useState<string>(() => loadMermaid());
  const [editorMermaid, setEditorMermaid] = useState<string>(() => loadMermaid());
  const [summary, setSummary] = useState<string>(() => loadSummary());
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDiagramValid, setIsDiagramValid] = useState<boolean>(true);
  const lastValidRef = useRef<string>(loadMermaid());

  // Persist whenever currentMermaid changes
  useEffect(() => {
    saveMermaid(currentMermaid);
  }, [currentMermaid]);

  // Persist whenever summary changes
  useEffect(() => {
    saveSummary(summary);
  }, [summary]);

  const updateFromEditor = useCallback(async (value: string) => {
    setEditorMermaid(value);
    const result = await validate(value);
    if (result.valid) {
      setCurrentMermaid(value);
      lastValidRef.current = value;
      setParseError(null);
      setIsDiagramValid(true);
    } else {
      setParseError(result.error);
      setIsDiagramValid(false);
    }
  }, []);

  const updateFromLlm = useCallback(async (value: string): Promise<boolean> => {
    const result = await validate(value);
    if (result.valid) {
      setCurrentMermaid(value);
      setEditorMermaid(value);
      lastValidRef.current = value;
      setParseError(null);
      setIsDiagramValid(true);
      return true;
    }
    return false;
  }, []);

  const updateFromLlmWithSummary = useCallback(async (mermaid: string, newSummary: string): Promise<boolean> => {
    const result = await validate(mermaid);
    if (result.valid) {
      setCurrentMermaid(mermaid);
      setEditorMermaid(mermaid);
      setSummary(newSummary);
      lastValidRef.current = mermaid;
      setParseError(null);
      setIsDiagramValid(true);
      return true;
    }
    return false;
  }, []);

  const resetToDefault = useCallback(() => {
    const defaultCode = DEFAULT_TEMPLATES[DEFAULT_DIAGRAM_TYPE];
    setCurrentMermaid(defaultCode);
    setEditorMermaid(defaultCode);
    setSummary('');
    lastValidRef.current = defaultCode;
    setParseError(null);
    setIsDiagramValid(true);
  }, []);

  const importMermaid = useCallback(async (value: string): Promise<boolean> => {
    const result = await validate(value);
    if (result.valid) {
      setCurrentMermaid(value);
      setEditorMermaid(value);
      lastValidRef.current = value;
      setParseError(null);
      setIsDiagramValid(true);
      return true;
    }
    setParseError(result.error);
    return false;
  }, []);

  const importDocument = useCallback(async (mermaid: string, newSummary: string): Promise<boolean> => {
    const result = await validate(mermaid);
    if (result.valid) {
      setCurrentMermaid(mermaid);
      setEditorMermaid(mermaid);
      setSummary(newSummary);
      lastValidRef.current = mermaid;
      setParseError(null);
      setIsDiagramValid(true);
      return true;
    }
    setParseError(result.error);
    return false;
  }, []);

  const setMermaidDirectly = useCallback((value: string) => {
    setCurrentMermaid(value);
    setEditorMermaid(value);
    lastValidRef.current = value;
    setParseError(null);
    setIsDiagramValid(true);
  }, []);

  return {
    currentMermaid,
    editorMermaid,
    summary,
    parseError,
    isDiagramValid,
    setEditorMermaid,
    setSummary,
    updateFromEditor,
    updateFromLlm,
    updateFromLlmWithSummary,
    resetToDefault,
    importMermaid,
    importDocument,
    setMermaidDirectly,
  };
}