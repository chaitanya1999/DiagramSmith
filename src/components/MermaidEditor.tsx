import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { yaml } from '@codemirror/lang-yaml';
import { keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';
import type { ThemeMode } from '../types';

interface MermaidEditorProps {
  value: string;
  onChange: (value: string) => void;
  parseError: string | null;
  theme: ThemeMode;
}

export function MermaidEditor({ value, onChange, parseError, theme }: MermaidEditorProps) {
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
      yaml(),
      keymap.of(defaultKeymap),
      updateListener,
      EditorView.theme({
        '&': { height: '100%' },
        '.cm-scroller': { overflow: 'auto' },
      }),
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

  // Update theme dynamically by recompiling state
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
    const base = [basicSetup, yaml(), keymap.of(defaultKeymap), updateListener, customTheme];
    const newExtensions = theme === 'dark' ? [...base, oneDark] : base;
    const newState = EditorState.create({
      doc: currentText,
      extensions: newExtensions,
    });
    view.setState(newState);
  }, [theme]);

  return (
    <div className="h-100 d-flex flex-column">
      <div className="border-bottom px-3 py-1 d-flex justify-content-between align-items-center">
        <span className="small fw-semibold text-muted">Mermaid Editor</span>
        {parseError && (
          <span className="small text-danger" title={parseError}>
            ⚠ Parse Error
          </span>
        )}
      </div>
      <div
        ref={editorRef}
        className="flex-grow-1"
        style={{ overflow: 'hidden' }}
      />
      {parseError && (
        <div className="bg-danger bg-opacity-10 border-top border-danger px-3 py-1">
          <small className="text-danger">{parseError}</small>
        </div>
      )}
    </div>
  );
}