import { useEffect, useRef } from 'react';
import { EditorView } from '@codemirror/view';
import { Compartment } from '@codemirror/state';
import { mermaidLanguage } from 'codemirror-lang-mermaid';
import { oneDark } from '@codemirror/theme-one-dark';
import { MergeView } from '@codemirror/merge';
import type { ThemeMode } from '../types';

interface MermaidDiffViewProps {
  original: string;
  modified: string;
  theme: ThemeMode;
}

/** Override @codemirror/merge's default underline styling with full-line background colors like Monaco. */
const diffHighlightTheme = EditorView.baseTheme({
  // Side A (original) — deletions: full red line background
  '&.cm-merge-a .cm-changedLine': {
    backgroundColor: 'rgba(255, 0, 0, 0.12) !important',
  },
  '&.cm-merge-a .cm-changedText': {
    background: 'none !important',
  },
  // Side B (modified) — insertions: full green line background
  '&.cm-merge-b .cm-changedLine': {
    backgroundColor: 'rgba(0, 200, 0, 0.12) !important',
  },
  '&.cm-merge-b .cm-changedText': {
    background: 'none !important',
  },
  // Deleted chunk widget (shown on side B for lines removed from A)
  '.cm-deletedChunk': {
    backgroundColor: 'rgba(255, 0, 0, 0.08) !important',
  },
  '.cm-deletedText': {
    background: 'rgba(255, 0, 0, 0.15) !important',
  },
  // Gutter markers
  '&.cm-merge-a .cm-changedLineGutter': {
    background: '#e43 !important',
  },
  '&.cm-merge-b .cm-changedLineGutter': {
    background: '#2b2 !important',
  },
  // Dark mode overrides
  '&dark.cm-merge-a .cm-changedLine': {
    backgroundColor: 'rgba(255, 80, 80, 0.18) !important',
  },
  '&dark.cm-merge-b .cm-changedLine': {
    backgroundColor: 'rgba(80, 255, 80, 0.18) !important',
  },
  '&dark.cm-merge-a .cm-changedLineGutter': {
    background: '#fa9 !important',
  },
  '&dark.cm-merge-b .cm-changedLineGutter': {
    background: '#8f8 !important',
  },
});

function makeBaseExtensions() {
  return [
    mermaidLanguage,
    EditorView.editable.of(false),
    EditorView.theme({
      '&': { height: '100%' },
      '.cm-scroller': { overflow: 'auto', fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" },
      '.cm-gutters': { display: 'none' },
    }),
    diffHighlightTheme,
  ];
}

export function MermaidDiffView({ original, modified, theme }: MermaidDiffViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mergeViewRef = useRef<MergeView | null>(null);
  const themeCompartment = useRef(new Compartment());

  useEffect(() => {
    if (!containerRef.current) return;

    const mergeView = new MergeView({
      a: {
        doc: original,
        extensions: [
          ...makeBaseExtensions(),
          themeCompartment.current.of(theme === 'dark' ? oneDark : []),
        ],
      },
      b: {
        doc: modified,
        extensions: [
          ...makeBaseExtensions(),
          themeCompartment.current.of(theme === 'dark' ? oneDark : []),
        ],
      },
      parent: containerRef.current,
    });

    mergeViewRef.current = mergeView;

    return () => {
      mergeView.destroy();
      mergeViewRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update content when props change
  useEffect(() => {
    const mv = mergeViewRef.current;
    if (!mv) return;
    try {
      const aDoc = mv.a.state.doc.toString();
      const bDoc = mv.b.state.doc.toString();
      if (aDoc !== original) {
        mv.a.dispatch({
          changes: { from: 0, to: aDoc.length || 0, insert: original },
        });
      }
      if (bDoc !== modified) {
        mv.b.dispatch({
          changes: { from: 0, to: bDoc.length || 0, insert: modified },
        });
      }
    } catch {
      // Ignore errors during update
    }
  }, [original, modified]);

  // Update theme when changed — only swap the theme compartment, preserving merge extensions
  useEffect(() => {
    const mv = mergeViewRef.current;
    if (!mv) return;

    try {
      mv.a.dispatch({
        effects: themeCompartment.current.reconfigure(theme === 'dark' ? oneDark : []),
      });
      mv.b.dispatch({
        effects: themeCompartment.current.reconfigure(theme === 'dark' ? oneDark : []),
      });
    } catch {
      // Ignore
    }
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className="mermaid-diff-view"
      style={{
        border: '1px solid var(--surface-border)',
        borderRadius: '6px',
        overflow: 'hidden',
        minHeight: '120px',
      }}
    />
  );
}