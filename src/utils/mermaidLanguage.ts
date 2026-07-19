import { StreamLanguage } from '@codemirror/language';

/**
 * Custom CodeMirror StreamLanguage parser for Mermaid.js syntax.
 * Provides comprehensive syntax highlighting with distinct colors for:
 * - Diagram type keywords (bold blue)
 * - Node IDs (teal)
 * - Node labels in brackets (green)
 * - Arrows/connectors (orange)
 * - Edge labels |text| (purple)
 * - Comments %% (gray italic)
 * - Numbers/dates (light blue)
 * - Punctuation/brackets (gray)
 */

interface MermaidState {
  afterArrow: boolean;
  afterColon: boolean;
}

const DIAGRAM_KEYWORDS = [
  'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram-v2',
  'erDiagram', 'gantt', 'pie', 'gitGraph', 'journey', 'mindmap',
  'timeline', 'sankey-beta', 'sankey',
];

const META_KEYWORDS = [
  'section', 'direction', 'title', 'accDescr', 'accDescrPlain',
  'link', 'links', 'click', 'callback', 'subgraph', 'end',
  'participant', 'actor', 'note', 'loop', 'alt', 'opt', 'par',
  'rect', 'critical', 'break', 'autonumber', 'activate', 'deactivate',
  'destroy', 'state', 'class', 'namespace',
];

const ARROW_PATTERNS = [
  // Bidirectional
  '<==>', '<-->', '<<->>', '<<==>>',
  // Thick arrows
  '==>', '===', '==',
  // Double-headed arrows
  '-->>', '->>',
  // Basic arrows
  '-->', '->', '--',
  // Dotted arrows
  '-.->', '-.>>', '.->', '.>>',
  // Cross arrows
  'x-->', 'x->', 'x--',
  // Circle arrows
  'o--o', 'o-->', 'o->', '--o', '--x', 'o--', 'x--',
  // Class diagram relationships
  '<|--', '--|>', '|--', '|>', '..|>', '..|',
  // Simple connectors
  '<=>', '<=', '=>',
  // Compound
  '-----', '----', '---',
];

// Build a single regex from patterns, longest first to avoid partial matches
const ARROW_RE = new RegExp(
  '^(?:' + ARROW_PATTERNS.sort((a, b) => b.length - a.length).join('|') + ')'
);

export const mermaidLanguage = StreamLanguage.define<MermaidState>({
  startState: (): MermaidState => ({
    afterArrow: false,
    afterColon: false,
  }),

  token(stream, state) {
    // Reset state at start of each line
    if (stream.sol()) {
      state.afterArrow = false;
      state.afterColon = false;
    }

    // Skip whitespace (spaces, tabs, newlines)
    if (stream.eatSpace()) {
      return null;
    }

    // Comments: %% ...
    if (stream.match(/%%/)) {
      stream.skipToEnd();
      return 'comment';
    }

    // Diagram type keywords at start of line
    if (stream.sol()) {
      for (const kw of DIAGRAM_KEYWORDS) {
        if (stream.match(new RegExp(`${kw}\\b`, 'i'))) {
          return 'keyword';
        }
      }
    }

    // Meta keywords (section, direction, title, etc.)
    for (const kw of META_KEYWORDS) {
      if (stream.match(new RegExp(`${kw}\\b`, 'i'))) {
        return 'attributeName';
      }
    }

    // Arrows and connectors (check before edge labels to handle |-- etc.)
    if (stream.match(ARROW_RE)) {
      state.afterArrow = true;
      state.afterColon = false;
      return 'operator';
    }

    // Edge labels: |text|
    if (stream.match(/^\|[^|]*\|/)) {
      state.afterArrow = false;
      return 'attributeValue';
    }

    // Node brackets with content: [text], {text}, (text)
    if (stream.match(/^\[[^\]]*\]/)) {
      state.afterArrow = false;
      return 'string';
    }
    if (stream.match(/^\{[^}]*\}/)) {
      state.afterArrow = false;
      return 'string';
    }
    if (stream.match(/^\([^)]*\)/)) {
      state.afterArrow = false;
      return 'string';
    }

    // Double-quoted strings
    if (stream.match(/^"[^"]*"/)) {
      return 'string';
    }

    // Numbers (including decimals) — must check before dates
    if (stream.match(/^\d+(?:\.\d+)?/)) {
      return 'number';
    }

    // Dates (YYYY-MM-DD)
    if (stream.match(/^\d{4}-\d{2}-\d{2}/)) {
      return 'number';
    }

    // Colons (important in Mermaid for sequence diagrams, gantt, etc.)
    if (stream.match(/^:/)) {
      state.afterColon = true;
      state.afterArrow = false;
      return 'punctuation';
    }

    // Single punctuation characters: brackets, parentheses, etc.
    if (stream.match(/^[;,()\[\]{}>]/)) {
      state.afterArrow = false;
      return 'punctuation';
    }

    // Pipe character (edge label boundary or standalone)
    if (stream.match(/^\|/)) {
      state.afterArrow = false;
      return 'punctuation';
    }

    // Node IDs / identifiers (alphanumeric with underscores)
    if (stream.match(/^[A-Za-z_][A-Za-z0-9_]*/)) {
      // After colon, identifiers are plain text (message body in sequence diagrams)
      if (state.afterColon) {
        return null;
      }
      state.afterArrow = false;
      return 'definitionKeyword';
    }

    // Consume any remaining character as plain text and advance the stream.
    // This is the mandatory catch-all: every call to token() MUST advance
    // the stream, otherwise CodeMirror throws "Stream parser failed to advance stream".
    stream.next();
    return null;
  },
});