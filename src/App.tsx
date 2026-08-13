import { useState, useCallback, useRef, useEffect } from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { ToastContainer } from 'react-bootstrap';
import { Toolbar } from './components/Toolbar';
import { DiagramView } from './components/DiagramView';
import { MermaidEditor } from './components/MermaidEditor';
import { PromptBar } from './components/PromptBar';
import { SettingsDialog } from './components/SettingsDialog';
import { PromptHistoryDialog } from './components/PromptHistoryDialog';
import { VersionHistoryDialog } from './components/VersionHistoryDialog';
import { useMermaid } from './hooks/useMermaid';
import { useLLM } from './hooks/useLLM';
import { useToasts } from './hooks/useToasts';
import { useTheme } from './hooks/useTheme';
import { useDiagramType } from './hooks/useDiagramType';
import { useVersionHistory } from './hooks/useVersionHistory';
import { loadLlmConfig, saveLlmConfig } from './services/storage';
import type { LlmConfig, DiagramType, LlmMode, LlmInteraction } from './types';

export default function App() {
  const [isSplitView, setIsSplitView] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [llmConfig, setLlmConfig] = useState<LlmConfig>(() => loadLlmConfig());
  const [includeSummary, setIncludeSummary] = useState(true);
  const [generateSummary, setGenerateSummary] = useState(true);
  const [includeSyntaxGuide, setIncludeSyntaxGuide] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);
  const [llmMode, setLlmMode] = useState<LlmMode>('action');
  const [lastInteraction, setLastInteraction] = useState<LlmInteraction | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const lastPromptRef = useRef('');
  const llmBusyCounterRef = useRef(0);
  const restoringRef = useRef(false);

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

  const { isLoading, error: llmError, generate, ask, clearError, abort } = useLLM();

  const versionHistory = useVersionHistory();
  const {
    snapshots,
    activeIndex,
    handleManualEdit,
    handleLlmGenerate,
    restoreToIndex,
    clearHistoryKeepCurrent,
  } = versionHistory;

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
      if (llmConfig.sendAuthorization !== false && !llmConfig.apiKey) {
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
        includeSyntaxGuide,
      });

      if (result === null) return;

      // Record the interaction for the history popup
      setLastInteraction({
        mode: 'action',
        prompt: instruction,
        response: result.rawContent,
        timestamp: Date.now(),
      });
      lastPromptRef.current = instruction;

      // The LLM output is always consumed into the editor (valid or not),
      // so detect its diagram type regardless of validity to keep the toolbar in sync.
      detectDiagramType(result.mermaid);

      // Increment the LLM busy counter so the currentMermaid effect doesn't
      // record a manual snapshot while the LLM update is in flight.
      llmBusyCounterRef.current++;

      try {
        if (effectiveGenerateSummary) {
          // LLM returned both mermaid and summary
          const valid = await updateFromLlmWithSummary(result.mermaid, result.summary || '');
          if (valid) {
            // Record LLM snapshot in version history
            handleLlmGenerate(result.mermaid, result.summary || '', instruction);
            addToast('Diagram and summary updated successfully.', 'success');
          } else {
            addToast('LLM returned invalid Mermaid. The output was loaded into the editor — check the parse error and fix it.', 'danger');
          }
        } else {
          // LLM returned only mermaid
          const valid = await updateFromLlm(result.mermaid);
          if (valid) {
            // Record LLM snapshot in version history
            handleLlmGenerate(result.mermaid, summary, instruction);
            addToast('Diagram updated successfully.', 'success');
          } else {
            addToast('LLM returned invalid Mermaid. The output was loaded into the editor — check the parse error and fix it.', 'danger');
          }
        }
      } finally {
        llmBusyCounterRef.current--;
      }
    },
    [currentMermaid, llmConfig, includeSummary, generateSummary, includeSyntaxGuide, summary, generate, clearError, updateFromLlm, updateFromLlmWithSummary, addToast, detectDiagramType, handleLlmGenerate]
  );

  const handleAskSubmit = useCallback(
    async (question: string) => {
      if (llmConfig.sendAuthorization !== false && !llmConfig.apiKey) {
        addToast('Please configure your API key in Settings first.', 'danger');
        return;
      }
      clearError();

      const effectiveIncludeSummary = includeSummary && summary.length > 0;

      const result = await ask(currentMermaid, question, llmConfig, {
        includeSummary: effectiveIncludeSummary,
        currentSummary: summary,
        includeSyntaxGuide,
      });

      if (result === null) return;

      // Record the interaction and auto-open the history popup to show the answer
      setLastInteraction({
        mode: 'ask',
        prompt: question,
        response: result.answer,
        timestamp: Date.now(),
      });
      setIsHistoryOpen(true);
    },
    [currentMermaid, llmConfig, includeSummary, includeSyntaxGuide, summary, ask, clearError, addToast]
  );

  const handleOpenHistory = useCallback(() => {
    setIsHistoryOpen(true);
  }, []);

  const handleCloseHistory = useCallback(() => {
    setIsHistoryOpen(false);
  }, []);

  const handleOpenVersionHistory = useCallback(() => {
    setIsVersionHistoryOpen(true);
  }, []);

  const handleCloseVersionHistory = useCallback(() => {
    setIsVersionHistoryOpen(false);
  }, []);

  const handleRestoreSnapshot = useCallback((index: number) => {
    const snapshot = restoreToIndex(index);
    if (snapshot) {
      restoringRef.current = true;
      setMermaidDirectly(snapshot.mermaid);
      setSummary(snapshot.summary);
      detectDiagramType(snapshot.mermaid);
      addToast(`Restored to version #${index + 1}.`, 'info');
    }
  }, [restoreToIndex, setMermaidDirectly, setSummary, detectDiagramType, addToast]);

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

  // Track when manual edit is validated and record snapshot.
  // We skip snapshot recording when:
  //  - restoringRef is true (during restore, handleRestoreSnapshot sets it)
  //  - llmBusyCounterRef > 0 (during LLM update, handleLlmGenerate is called explicitly)
  const prevCurrentMermaidRef = useRef(currentMermaid);
  const pendingEditRef = useRef(false);
  useEffect(() => {
    if (prevCurrentMermaidRef.current !== currentMermaid) {
      prevCurrentMermaidRef.current = currentMermaid;
      if (!restoringRef.current && llmBusyCounterRef.current === 0) {
        // If we are in a restored state (activeIndex < last index), prompt user before discarding future snapshots
        if (activeIndex < snapshots.length - 1 && !pendingEditRef.current) {
          pendingEditRef.current = true;
          const confirmed = window.confirm(
            'You are editing a past snapshot. This will discard all future snapshots. Continue?'
          );
          pendingEditRef.current = false;
          if (!confirmed) {
            // User canceled - restore back to the latest snapshot
            const latestSnapshot = snapshots[snapshots.length - 1];
            if (latestSnapshot) {
              restoringRef.current = true;
              setMermaidDirectly(latestSnapshot.mermaid);
              setSummary(latestSnapshot.summary);
              // Also restore the activeIndex back
              restoreToIndex(snapshots.length - 1);
            }
            return;
          }
        }
        handleManualEdit(currentMermaid, summary);
      }
      restoringRef.current = false;
    }
  }, [currentMermaid, summary, handleManualEdit, activeIndex, snapshots, setMermaidDirectly, setSummary, restoreToIndex]);

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
        onOpenHistory={handleOpenHistory}
        onOpenVersionHistory={handleOpenVersionHistory}
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
              <DiagramView mermaidCode={currentMermaid} isLoading={isLoading} isAskMode={llmMode === 'ask'} theme={theme} onAbort={abort} />
            </Panel>
          </Group>
        ) : (
          <DiagramView mermaidCode={currentMermaid} isLoading={isLoading} isAskMode={llmMode === 'ask'} theme={theme} onAbort={abort} />
        )}
      </div>

      <PromptBar
        mode={llmMode}
        onModeChange={setLlmMode}
        onSubmit={llmMode === 'ask' ? handleAskSubmit : handlePromptSubmit}
        isLoading={isLoading}
        includeSummary={includeSummary}
        generateSummary={generateSummary}
        includeSyntaxGuide={includeSyntaxGuide}
        onIncludeSummaryChange={setIncludeSummary}
        onGenerateSummaryChange={setGenerateSummary}
        onIncludeSyntaxGuideChange={setIncludeSyntaxGuide}
        onAbort={abort}
      />
      <SettingsDialog show={isSettingsOpen} config={llmConfig} onSave={handleSaveSettings} onCancel={handleCancelSettings} />
      <PromptHistoryDialog show={isHistoryOpen} interaction={lastInteraction} onClose={handleCloseHistory} />
      <VersionHistoryDialog
        show={isVersionHistoryOpen}
        snapshots={snapshots}
        activeIndex={activeIndex}
        onRestore={handleRestoreSnapshot}
        onClose={handleCloseVersionHistory}
        onClearHistory={clearHistoryKeepCurrent}
        theme={theme}
      />

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