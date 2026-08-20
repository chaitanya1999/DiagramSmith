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
  updateFromEditor: (value: string) => Promise<boolean>;
  updateFromLlm: (value: string) => Promise<boolean>;
  updateFromLlmWithSummary: (mermaid: string, summary: string | null) => Promise<boolean>;
  resetToDefault: () => void;
  importMermaid: (value: string) => Promise<boolean>;
  importDocument: (mermaid: string, summary: string) => Promise<boolean>;
  setMermaidDirectly: (value: string) => void;
}

export function useMermaid(onStorageError?: (message: string) => void): UseMermaidReturn {
  const [currentMermaid, setCurrentMermaid] = useState<string>(() => loadMermaid());
  const [editorMermaid, setEditorMermaid] = useState<string>(() => loadMermaid());
  const [summary, setSummary] = useState<string>(() => loadSummary());
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDiagramValid, setIsDiagramValid] = useState<boolean>(true);
  const lastValidRef = useRef<string>(loadMermaid());

  const onStorageErrorRef = useRef(onStorageError);
  onStorageErrorRef.current = onStorageError;

  // A full quota fails on every keystroke, so warn once per episode rather than per save.
  const quotaWarnedRef = useRef(false);
  const reportSave = useCallback((ok: boolean, message: string) => {
    if (ok) {
      quotaWarnedRef.current = false;
      return;
    }
    if (!quotaWarnedRef.current) {
      quotaWarnedRef.current = true;
      onStorageErrorRef.current?.(message);
    }
  }, []);

  // Persist whenever currentMermaid changes
  useEffect(() => {
    reportSave(saveMermaid(currentMermaid), 'Could not save your diagram — browser storage is full.');
  }, [currentMermaid, reportSave]);

  // Persist whenever summary changes
  useEffect(() => {
    reportSave(saveSummary(summary), 'Could not save your summary — browser storage is full.');
  }, [summary, reportSave]);

  const updateFromEditor = useCallback(async (value: string): Promise<boolean> => {
    setEditorMermaid(value);
    const result = await validate(value);
    if (result.valid) {
      setCurrentMermaid(value);
      lastValidRef.current = value;
      setParseError(null);
      setIsDiagramValid(true);
      return true;
    }
    setParseError(result.error);
    setIsDiagramValid(false);
    return false;
  }, []);

  const updateFromLlm = useCallback(async (value: string): Promise<boolean> => {
    const result = await validate(value);
    // Always consume the LLM output into the editor so it is never lost,
    // even when it is invalid (the parse error is displayed in the editor footer).
    setEditorMermaid(value);
    if (result.valid) {
      setCurrentMermaid(value);
      lastValidRef.current = value;
      setParseError(null);
      setIsDiagramValid(true);
      return true;
    }
    setParseError(result.error);
    setIsDiagramValid(false);
    return false;
  }, []);

  const updateFromLlmWithSummary = useCallback(async (mermaid: string, newSummary: string | null): Promise<boolean> => {
    const result = await validate(mermaid);
    // Always consume the LLM output into the editor so it is never lost,
    // even when it is invalid (the parse error is displayed in the editor footer).
    setEditorMermaid(mermaid);
    if (result.valid) {
      setCurrentMermaid(mermaid);
      // Only replace the summary when the response actually carried one. An empty
      // or absent summary means the model omitted the delimiter or was cut short —
      // never let that overwrite the summary the user wrote.
      if (newSummary) setSummary(newSummary);
      lastValidRef.current = mermaid;
      setParseError(null);
      setIsDiagramValid(true);
      return true;
    }
    setParseError(result.error);
    setIsDiagramValid(false);
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