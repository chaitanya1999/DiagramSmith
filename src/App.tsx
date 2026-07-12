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

  const { toasts, addToast, removeToast } = useToasts();
  const { theme, toggleTheme, isDark } = useTheme();
  const { diagramType, changeDiagramType, detectDiagramType } = useDiagramType();

  const {
    currentMermaid,
    editorMermaid,
    parseError,
    setEditorMermaid,
    updateFromEditor,
    updateFromLlm,
    importMermaid,
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
      detectDiagramType(template);
      addToast(`New ${type} diagram created.`, 'info');
    },
    [changeDiagramType, setMermaidDirectly, detectDiagramType, addToast]
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

  const handleCopyMermaid = useCallback(() => {
    navigator.clipboard.writeText(currentMermaid).then(
      () => addToast('Mermaid code copied to clipboard.', 'success'),
      () => addToast('Failed to copy to clipboard.', 'danger')
    );
  }, [currentMermaid, addToast]);

  const handlePromptSubmit = useCallback(
    async (instruction: string) => {
      if (!llmConfig.apiKey) {
        addToast('Please configure your API key in Settings first.', 'danger');
        return;
      }
      clearError();
      const result = await generate(currentMermaid, instruction, llmConfig);
      if (result === null) return;
      const valid = await updateFromLlm(result);
      if (valid) {
        detectDiagramType(result);
        addToast('Diagram updated successfully.', 'success');
      } else {
        addToast('LLM returned invalid Mermaid. Your diagram was not modified.', 'danger');
      }
    },
    [currentMermaid, llmConfig, generate, clearError, updateFromLlm, addToast, detectDiagramType]
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
        onCopyMermaid={handleCopyMermaid}
        onImportMermaid={importMermaid}
        onToggleTheme={toggleTheme}
      />

      <div className="flex-grow-1 position-relative" style={{ minHeight: 0 }}>
        {isSplitView ? (
          <Group orientation="horizontal" className="h-100">
            <Panel defaultSize={50} minSize={20}>
              <MermaidEditor
                value={editorMermaid}
                onChange={handleEditorChange}
                parseError={parseError}
                theme={theme}
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

      <PromptBar onSubmit={handlePromptSubmit} isLoading={isLoading} />
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