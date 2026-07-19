import { useState, useCallback, useRef, useEffect } from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { ToastContainer } from 'react-bootstrap';
import { Toolbar } from './components/Toolbar';
import { DiagramView } from './components/DiagramView';
import { MermaidEditor } from './components/MermaidEditor';
import { PromptBar } from './components/PromptBar';
import { SettingsDialog } from './components/SettingsDialog';
import { useMermaid } from './hooks/useMermaid';
import { useLLM } from './hooks/useLLM';
import { useToasts } from './hooks/useToasts';
import { useTheme } from './hooks/useTheme';
import { useDiagramType } from './hooks/useDiagramType';
import { loadLlmConfig, saveLlmConfig } from './services/storage';
import { setMermaidTheme } from './services/mermaid';
import type { LlmConfig, DiagramType } from './types';

export default function App() {
  const [isSplitView, setIsSplitView] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [llmConfig, setLlmConfig] = useState<LlmConfig>(() => loadLlmConfig());
  const [includeSummary, setIncludeSummary] = useState(true);
  const [generateSummary, setGenerateSummary] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);

  const { toasts, addToast, removeToast } = useToasts();
  const { theme, toggleTheme, isDark } = useTheme();
  const { diagramType, changeDiagramType, detectDiagramType } = useDiagramType();

  const {
    currentMermaid,
    editorMermaid,
    summary,
    parseError,
    setEditorMermaid,
    setSummary,
    updateFromEditor,
    updateFromLlm,
    updateFromLlmWithSummary,
    importMermaid,
    importDocument,
    setMermaidDirectly,
  } = useMermaid();

  const { isLoading, error: llmError, generate, clearError } = useLLM();

  // Sync mermaid theme with app theme
  useEffect(() => {
    setMermaidTheme(theme);
  }, [theme]);

  const handleToggleSplitView = useCallback(() => {
    setIsSplitView((prev) => !prev);
  }, []);

  const handleToggleWordWrap = useCallback(() => {
    setWordWrap((prev) => !prev);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const handleSaveSettings = useCallback(
    (config: LlmConfig) => {
      setLlmConfig(config);
      saveLlmConfig(config);
      setIsSettingsOpen(false);
      addToast('Settings saved.', 'success');
    },
    [addToast]
  );

  const handleCancelSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const handleNewDiagram = useCallback(
    (type: DiagramType) => {
      const template = changeDiagramType(type);
      setMermaidDirectly(template);
      setSummary('');
      detectDiagramType(template);
      addToast(`New ${type} diagram created.`, 'info');
    },
    [changeDiagramType, setMermaidDirectly, setSummary, detectDiagramType, addToast]
  );

  const handleExportMermaid = useCallback(() => {
    const blob = new Blob([currentMermaid], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.mmd';
    a.click();
    URL.revokeObjectURL(url);
  }, [currentMermaid]);

  const handleExportProject = useCallback(() => {
    const project = JSON.stringify({ mermaid: currentMermaid, summary }, null, 2);
    const blob = new Blob([project], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.dsmith.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [currentMermaid, summary]);

  const handleCopyMermaid = useCallback(() => {
    navigator.clipboard.writeText(currentMermaid).then(
      () => addToast('Mermaid code copied to clipboard.', 'success'),
      () => addToast('Failed to copy to clipboard.', 'danger')
    );
  }, [currentMermaid, addToast]);

  const handleImportProject = useCallback(async (content: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed.mermaid !== 'string') {
        addToast('Invalid project file: missing mermaid field.', 'danger');
        return false;
      }
      const newSummary = typeof parsed.summary === 'string' ? parsed.summary : '';
      const success = await importDocument(parsed.mermaid, newSummary);
      if (success) {
        detectDiagramType(parsed.mermaid);
        addToast('Project imported successfully.', 'success');
      } else {
        addToast('Invalid Mermaid diagram in project file.', 'danger');
      }
      return success;
    } catch {
      addToast('Invalid project file format.', 'danger');
      return false;
    }
  }, [importDocument, detectDiagramType, addToast]);

  const handlePromptSubmit = useCallback(
    async (instruction: string) => {
      if (!llmConfig.apiKey) {
        addToast('Please configure your API key in Settings first.', 'danger');
        return;
      }
      clearError();

      const effectiveIncludeSummary = includeSummary && summary.length > 0;
      const effectiveGenerateSummary = generateSummary;

      const result = await generate(currentMermaid, instruction, llmConfig, {
        includeSummary: effectiveIncludeSummary,
        generateSummary: effectiveGenerateSummary,
        currentSummary: summary,
      });

      if (result === null) return;

      if (effectiveGenerateSummary) {
        // LLM returned both mermaid and summary
        const valid = await updateFromLlmWithSummary(result.mermaid, result.summary || '');
        if (valid) {
          detectDiagramType(result.mermaid);
          addToast('Diagram and summary updated successfully.', 'success');
        } else {
          addToast('LLM returned invalid Mermaid. Your diagram was not modified.', 'danger');
        }
      } else {
        // LLM returned only mermaid
        const valid = await updateFromLlm(result.mermaid);
        if (valid) {
          detectDiagramType(result.mermaid);
          addToast('Diagram updated successfully.', 'success');
        } else {
          addToast('LLM returned invalid Mermaid. Your diagram was not modified.', 'danger');
        }
      }
    },
    [currentMermaid, llmConfig, includeSummary, generateSummary, summary, generate, clearError, updateFromLlm, updateFromLlmWithSummary, addToast, detectDiagramType]
  );

  // Show LLM errors as toasts
  useEffect(() => {
    if (llmError) {
      addToast(llmError, 'danger');
      clearError();
    }
  }, [llmError, addToast, clearError]);

  // Debounced editor updates
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleEditorChange = useCallback(
    (value: string) => {
      setEditorMermaid(value);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        updateFromEditor(value);
        detectDiagramType(value);
      }, 400);
    },
    [setEditorMermaid, updateFromEditor, detectDiagramType]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  return (
    <div className="d-flex flex-column vh-100">
      <Toolbar
        isSplitView={isSplitView}
        isDark={isDark}
        diagramType={diagramType}
        onToggleSplitView={handleToggleSplitView}
        onOpenSettings={handleOpenSettings}
        onNewDiagram={handleNewDiagram}
        onExportMermaid={handleExportMermaid}
        onExportProject={handleExportProject}
        onCopyMermaid={handleCopyMermaid}
        onImportMermaid={importMermaid}
        wordWrap={wordWrap}
        onToggleWordWrap={handleToggleWordWrap}
        onImportProject={handleImportProject}
        onToggleTheme={toggleTheme}
      />

      <div className="flex-grow-1 position-relative" style={{ minHeight: 0, backgroundColor: 'var(--app-bg)' }}>
        {isSplitView ? (
          <Group orientation="horizontal" className="h-100">
            <Panel defaultSize={50} minSize={20}>
              <MermaidEditor
                value={editorMermaid}
                onChange={handleEditorChange}
                parseError={parseError}
                theme={theme}
                wordWrap={wordWrap}
                summary={summary}
                onSummaryChange={setSummary}
              />
            </Panel>
            <Separator className="bg-secondary" style={{ width: '4px', cursor: 'col-resize' }} />
            <Panel defaultSize={50} minSize={20}>
              <DiagramView mermaidCode={currentMermaid} isLoading={isLoading} />
            </Panel>
          </Group>
        ) : (
          <DiagramView mermaidCode={currentMermaid} isLoading={isLoading} />
        )}
      </div>

      <PromptBar
        onSubmit={handlePromptSubmit}
        isLoading={isLoading}
        includeSummary={includeSummary}
        generateSummary={generateSummary}
        onIncludeSummaryChange={setIncludeSummary}
        onGenerateSummaryChange={setGenerateSummary}
      />
      <SettingsDialog show={isSettingsOpen} config={llmConfig} onSave={handleSaveSettings} onCancel={handleCancelSettings} />

      <ToastContainer position="top-end" className="p-3">
        {toasts.map((t) => (
          <div key={t.id} className={`toast show align-items-center text-bg-${t.variant} border-0`} role="alert">
            <div className="d-flex">
              <div className="toast-body">{t.text}</div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => removeToast(t.id)} />
            </div>
          </div>
        ))}
      </ToastContainer>
    </div>
  );
}