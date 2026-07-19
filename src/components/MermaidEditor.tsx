import { useEffect, useRef } from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { yamlLanguage } from '@codemirror/lang-yaml';
import { keymap } from '@codemirror/view';
import { indentMore, indentLess } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';
import type { ThemeMode } from '../types';
import { indentUnit } from '@codemirror/language';

interface MermaidEditorProps {
  value: string;
  onChange: (value: string) => void;
  parseError: string | null;
  theme: ThemeMode;
  wordWrap: boolean;
  summary: string;
  onSummaryChange: (value: string) => void;
}

export function MermaidEditor({ value, onChange, parseError, theme, wordWrap, summary, onSummaryChange }: MermaidEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!editorRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const currentValue = update.state.doc.toString();
        onChangeRef.current(currentValue);
      }
    });

    const extensions = [
      basicSetup,
      yamlLanguage,
      keymap.of([
        { key: 'Tab', run: indentMore, preventDefault: true },
        { key: 'Shift-Tab', run: indentLess, preventDefault: true }
      ]),
      updateListener,
      wordWrap ? EditorView.lineWrapping : [],
      EditorView.theme({
        '&': { height: '100%' },
        '.cm-scroller': { overflow: 'auto' },
      }),
      indentUnit.of("    ")
    ];

    if (theme === 'dark') {
      extensions.push(oneDark);
    }

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only initialize once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update editor content when value changes externally
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
      });
    }
  }, [value]);

  // Update theme and word wrap dynamically by recompiling state
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentText = view.state.doc.toString();
    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const cv = update.state.doc.toString();
        onChangeRef.current(cv);
      }
    });
    const customTheme = EditorView.theme({
      '&': { height: '100%' },
      '.cm-scroller': { overflow: 'auto' },
    });
    const base = [
      basicSetup,
      yamlLanguage,
      keymap.of([
        { key: 'Tab', run: indentMore, preventDefault: true },
        { key: 'Shift-Tab', run: indentLess, preventDefault: true }
      ]),
      updateListener,
      wordWrap ? EditorView.lineWrapping : [],
      customTheme,
      indentUnit.of("    ")
    ];
    const newExtensions = theme === 'dark' ? [...base, oneDark] : base;
    const newState = EditorState.create({
      doc: currentText,
      extensions: newExtensions,
    });
    view.setState(newState);
  }, [theme, wordWrap]);

  return (
    <div className="h-100 d-flex flex-column">
      <div className="editor-header border-bottom px-3 py-1 d-flex justify-content-between align-items-center">
        <span className="small fw-semibold editor-header-text">Mermaid Editor</span>
        {parseError && (
          <span className="small text-danger" title={parseError}>
            ⚠ Parse Error
          </span>
        )}
      </div>
      <Group orientation="vertical" className="flex-grow-1" style={{ minHeight: 0 }}>
        <Panel defaultSize={70} minSize={20}>
          <div
            ref={editorRef}
            className="h-100"
            style={{ overflow: 'hidden' }}
          />
        </Panel>
        <Separator className="bg-secondary" style={{ height: '4px', cursor: 'row-resize' }} />
        <Panel defaultSize={30} minSize={10}>
          <div className="h-100 d-flex flex-column">
            <div className="summary-header border-bottom px-3 py-1">
              <span className="small fw-semibold summary-header-text">Text Summary</span>
            </div>
            <textarea
              className="form-control border-0 rounded-0 flex-grow-1 font-monospace small"
              style={{
                resize: 'none',
                whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
                overflowWrap: wordWrap ? 'break-word' : 'normal',
                overflowX: wordWrap ? 'hidden' : 'auto',
              }}
              value={summary}
              onChange={(e) => onSummaryChange(e.target.value)}
              placeholder="Text summary of the diagram will appear here. You can also edit it manually."
            />
          </div>
        </Panel>
      </Group>
      {parseError && (
        <div className="bg-danger bg-opacity-10 border-top border-danger px-3 py-1">
          <small className="text-danger">{parseError}</small>
        </div>
      )}
    </div>
  );
}