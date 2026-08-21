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
import { DIAGRAM_DISPLAY_NAMES } from './types';
import { buildProjectFile, parseProjectFile } from './utils/projectFile';
import {
  canCopyImages,
  copyPngToClipboard,
  downloadBlob,
  getThemeBackground,
  svgToBlob,
  svgToPngBlob,
} from './utils/imageExport';

/** Shown when the provider cut the response short (token cap or content filter). */
const TRUNCATED_RESPONSE_MESSAGE =
  "The model's response was cut short by the provider. Try a smaller change.";

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

  const { toasts, addToast, removeToast } = useToasts();
  const { theme, toggleTheme, isDark } = useTheme();
  const { diagramType, changeDiagramType, detectDiagramType } = useDiagramType();

  const handleStorageError = useCallback((message: string) => addToast(message, 'danger'), [addToast]);

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
  } = useMermaid(handleStorageError);

  const { isLoading, error: llmError, generate, ask, clearError, abort } = useLLM();

  const {
    snapshots,
    activeIndex,
    maxSnapshots,
    handleManualEdit,
    handleLlmGenerate,
    handleReplaceDocument,
    restoreToIndex,
    setMaxSnapshots,
    resetHistory,
    replaceHistory,
    clearHistoryKeepCurrent,
  } = useVersionHistory(handleStorageError);

  /** The rendered SVG, lifted out of DiagramView so the toolbar can export it. */
  const [renderedSvg, setRenderedSvg] = useState<string | null>(null);

  // Latest values for the debounced callbacks, so they don't need to be recreated
  // (and their pending timers invalidated) on every keystroke.
  const summaryRef = useRef(summary);
  summaryRef.current = summary;
  const currentMermaidRef = useRef(currentMermaid);
  currentMermaidRef.current = currentMermaid;
  const snapshotsRef = useRef(snapshots);
  snapshotsRef.current = snapshots;
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  /** Set once the user has agreed to discard snapshots ahead of the restored one. */
  const discardFutureConfirmedRef = useRef(false);

  /**
   * Asked *before* the edit is applied. The old implementation prompted from an
   * effect, which runs after the change has already been written to localStorage —
   * so "Cancel" could only undo the edit, never prevent it.
   */
  const confirmDiscardFuture = useCallback((): boolean => {
    const viewingPast = activeIndexRef.current >= 0 && activeIndexRef.current < snapshotsRef.current.length - 1;
    if (!viewingPast || discardFutureConfirmedRef.current) return true;

    const confirmed = window.confirm(
      'You are editing a past snapshot. This will discard all future snapshots. Continue?'
    );
    if (confirmed) discardFutureConfirmedRef.current = true;
    return confirmed;
  }, []);

  // Snapshots are recorded by whoever caused the change, because only the caller
  // knows *why* the diagram changed. Watching state instead meant guessing the cause
  // from mutable refs, which is how every LLM generation ended up also recording a
  // redundant "manual" snapshot.
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const summaryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Commits any pending debounced edit immediately, before the document is replaced. */
  const flushPendingEdits = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (summaryTimerRef.current) {
      clearTimeout(summaryTimerRef.current);
      summaryTimerRef.current = null;
    }
    if (snapshotsRef.current.length > 0) {
      handleManualEdit(currentMermaidRef.current, summaryRef.current);
    }
  }, [handleManualEdit]);

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
      const name = DIAGRAM_DISPLAY_NAMES[type];
      // This replaces the whole document and blanks the summary — too destructive
      // to happen from a single dropdown click without asking.
      if (
        !window.confirm(
          `Start a new ${name} diagram?\n\nThe current diagram and summary will be replaced. Your current work is kept in Version History.`
        )
      ) {
        return;
      }

      // Commit whatever is still sitting in the debounce before replacing it.
      flushPendingEdits();

      const template = changeDiagramType(type);
      setMermaidDirectly(template);
      setSummary('');
      detectDiagramType(template);
      discardFutureConfirmedRef.current = false;
      handleReplaceDocument(template, '', `New ${name} diagram`);
      addToast(`New ${name} diagram created.`, 'info');
    },
    [changeDiagramType, setMermaidDirectly, setSummary, detectDiagramType, addToast, flushPendingEdits, handleReplaceDocument]
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
    // Carries the full working state — code, summary, type and version history — so a
    // project file is a complete backup you can resume from, not just the diagram.
    const project = buildProjectFile(currentMermaid, summary, diagramType, { snapshots, activeIndex });
    downloadBlob(new Blob([project], { type: 'application/json' }), 'diagram.dsmith.json');
  }, [currentMermaid, summary, diagramType, snapshots, activeIndex]);

  const handleExportSvg = useCallback(() => {
    if (!renderedSvg) {
      addToast('Nothing to export — the diagram has not rendered yet.', 'danger');
      return;
    }
    try {
      downloadBlob(svgToBlob(renderedSvg, null), 'diagram.svg');
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Could not export the SVG.', 'danger');
    }
  }, [renderedSvg, addToast]);

  const handleExportPng = useCallback(
    async (withBackground: boolean) => {
      if (!renderedSvg) {
        addToast('Nothing to export — the diagram has not rendered yet.', 'danger');
        return;
      }
      try {
        const blob = await svgToPngBlob(renderedSvg, withBackground ? getThemeBackground() : null);
        downloadBlob(blob, 'diagram.png');
      } catch (e) {
        addToast(e instanceof Error ? e.message : 'Could not export the PNG.', 'danger');
      }
    },
    [renderedSvg, addToast]
  );

  const handleCopyImage = useCallback(async () => {
    if (!renderedSvg) {
      addToast('Nothing to copy — the diagram has not rendered yet.', 'danger');
      return;
    }
    try {
      // Pasting a transparent PNG into a dark document looks broken, so the
      // clipboard copy always carries the theme background.
      const blob = await svgToPngBlob(renderedSvg, getThemeBackground());
      await copyPngToClipboard(blob);
      addToast('Diagram image copied to clipboard.', 'success');
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Could not copy the image.', 'danger');
    }
  }, [renderedSvg, addToast]);

  const handleCopyMermaid = useCallback(() => {
    navigator.clipboard.writeText(currentMermaid).then(
      () => addToast('Mermaid code copied to clipboard.', 'success'),
      () => addToast('Failed to copy to clipboard.', 'danger')
    );
  }, [currentMermaid, addToast]);

  const handleImportProject = useCallback(async (content: string): Promise<boolean> => {
    // Accepts both the current schema and the original { mermaid, summary } files.
    const parsed = parseProjectFile(content);
    if (!parsed) {
      addToast('Invalid project file: could not read a diagram from it.', 'danger');
      return false;
    }

    // Adopting the file's history discards the one in this browser, so ask first.
    let adoptHistory = false;
    if (parsed.versionHistory) {
      adoptHistory = window.confirm(
        `This project file contains ${parsed.versionHistory.snapshots.length} saved version(s).\n\n` +
          'Import them? This replaces the version history currently in this browser.\n\n' +
          'Cancel imports the diagram and summary only, keeping your existing history.'
      );
    }

    flushPendingEdits();
    const success = await importDocument(parsed.mermaid, parsed.summary);
    if (!success) {
      addToast('Invalid Mermaid diagram in project file.', 'danger');
      return false;
    }

    detectDiagramType(parsed.mermaid);
    discardFutureConfirmedRef.current = false;

    if (adoptHistory && parsed.versionHistory) {
      replaceHistory(parsed.versionHistory);
      addToast('Project and version history imported.', 'success');
    } else {
      handleReplaceDocument(parsed.mermaid, parsed.summary, 'Imported project');
      addToast('Project imported successfully.', 'success');
    }
    return true;
  }, [importDocument, detectDiagramType, addToast, flushPendingEdits, handleReplaceDocument, replaceHistory]);

  /** `.mmd` import — replaces the diagram but leaves the summary alone. */
  const handleImportMermaid = useCallback(async (content: string): Promise<boolean> => {
    flushPendingEdits();
    const success = await importMermaid(content);
    if (success) {
      detectDiagramType(content);
      discardFutureConfirmedRef.current = false;
      handleReplaceDocument(content, summaryRef.current, 'Imported .mmd');
    }
    return success;
  }, [importMermaid, detectDiagramType, flushPendingEdits, handleReplaceDocument]);

  const handlePromptSubmit = useCallback(
    async (instruction: string) => {
      if (llmConfig.sendAuthorization !== false && !llmConfig.apiKey) {
        addToast('Please configure your API key in Settings first.', 'danger');
        return;
      }
      // Generating from a restored snapshot discards the ones after it, same as typing.
      if (!confirmDiscardFuture()) return;
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

      // Surface truncation up front — it explains anything odd downstream (a
      // half-finished diagram, or a summary that was left untouched).
      if (result.truncated) {
        addToast(TRUNCATED_RESPONSE_MESSAGE, 'warning');
      }

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

      if (effectiveGenerateSummary) {
        // LLM returned mermaid, and a summary only if `result.summary` is non-null.
        const valid = await updateFromLlmWithSummary(result.mermaid, result.summary);
        if (valid) {
          // Record LLM snapshot in version history. When no summary came back,
          // the existing one was retained, so that is what the snapshot carries.
          handleLlmGenerate(result.mermaid, result.summary || summary, instruction);
          if (!result.truncated) {
            addToast(
              result.summary
                ? 'Diagram and summary updated successfully.'
                : 'Diagram updated successfully. Existing summary kept.',
              'success'
            );
          }
        } else {
          addToast('LLM returned invalid Mermaid. The output was loaded into the editor — check the parse error and fix it.', 'danger');
        }
      } else {
        // LLM returned only mermaid
        const valid = await updateFromLlm(result.mermaid);
        if (valid) {
          // Record LLM snapshot in version history
          handleLlmGenerate(result.mermaid, summary, instruction);
          if (!result.truncated) {
            addToast('Diagram updated successfully.', 'success');
          }
        } else {
          addToast('LLM returned invalid Mermaid. The output was loaded into the editor — check the parse error and fix it.', 'danger');
        }
      }
    },
    [currentMermaid, llmConfig, includeSummary, generateSummary, includeSyntaxGuide, summary, generate, clearError, updateFromLlm, updateFromLlmWithSummary, addToast, detectDiagramType, handleLlmGenerate, confirmDiscardFuture]
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

      if (result.truncated) {
        addToast(TRUNCATED_RESPONSE_MESSAGE, 'warning');
      }

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
      setMermaidDirectly(snapshot.mermaid);
      setSummary(snapshot.summary);
      detectDiagramType(snapshot.mermaid);
      // A fresh restore means the next edit must ask again before discarding.
      discardFutureConfirmedRef.current = false;
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

  const handleEditorChange = useCallback(
    (value: string) => {
      if (!confirmDiscardFuture()) {
        // Revert the editor to the snapshot being viewed.
        const active = snapshotsRef.current[activeIndexRef.current];
        if (active) setEditorMermaid(active.mermaid);
        return;
      }
      setEditorMermaid(value);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(async () => {
        const valid = await updateFromEditor(value);
        detectDiagramType(value);
        // Only snapshot what parses — an invalid draft is kept in the editor but is
        // not a version worth returning to.
        if (valid) handleManualEdit(value, summaryRef.current);
      }, 400);
    },
    [setEditorMermaid, updateFromEditor, detectDiagramType, handleManualEdit, confirmDiscardFuture]
  );

  const handleSummaryChange = useCallback(
    (value: string) => {
      if (!confirmDiscardFuture()) return;
      setSummary(value);
      if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current);
      summaryTimerRef.current = setTimeout(() => {
        handleManualEdit(currentMermaidRef.current, value);
      }, 400);
    },
    [setSummary, handleManualEdit, confirmDiscardFuture]
  );


  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current);
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
        onExportSvg={handleExportSvg}
        onExportPng={handleExportPng}
        onCopyImage={handleCopyImage}
        canCopyImage={canCopyImages()}
        hasRenderedDiagram={renderedSvg !== null}
        onCopyMermaid={handleCopyMermaid}
        onImportMermaid={handleImportMermaid}
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
                onSummaryChange={handleSummaryChange}
              />
            </Panel>
            <Separator className="bg-secondary" style={{ width: '4px', cursor: 'col-resize' }} />
            <Panel defaultSize={50} minSize={20}>
              <DiagramView mermaidCode={currentMermaid} isLoading={isLoading} isAskMode={llmMode === 'ask'} theme={theme} onAbort={abort} summary={summary} onSvgChange={setRenderedSvg} />
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
      <SettingsDialog
        show={isSettingsOpen}
        config={llmConfig}
        maxSnapshots={maxSnapshots}
        onSave={handleSaveSettings}
        onMaxSnapshotsChange={setMaxSnapshots}
        onCancel={handleCancelSettings}
      />
      <PromptHistoryDialog show={isHistoryOpen} interaction={lastInteraction} onClose={handleCloseHistory} />
      <VersionHistoryDialog
        show={isVersionHistoryOpen}
        snapshots={snapshots}
        activeIndex={activeIndex}
        onRestore={handleRestoreSnapshot}
        onClose={handleCloseVersionHistory}
        onClearHistory={clearHistoryKeepCurrent}
        onClearAllHistory={resetHistory}
        theme={theme}
      />

      <ToastContainer position="top-end" className="p-3">
        {toasts.map((t) => (
          <div key={t.id} className={`toast show align-items-center text-bg-${t.variant} border-0`} role="alert">
            <div className="d-flex">
              <div className="toast-body">{t.text}</div>
              {/* text-bg-warning is dark-on-yellow, so the white close icon would vanish. */}
              <button
                type="button"
                className={`btn-close me-2 m-auto ${t.variant === 'warning' ? '' : 'btn-close-white'}`}
                onClick={() => removeToast(t.id)}
              />
            </div>
          </div>
        ))}
      </ToastContainer>
    </div>
  );
}