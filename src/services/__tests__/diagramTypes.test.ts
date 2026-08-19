import { describe, it, expect, beforeAll } from 'vitest';
import mermaid from 'mermaid';
import {
  DEFAULT_TEMPLATES,
  ALL_DIAGRAM_TYPES,
  DIAGRAM_DIRECTIVES,
  getDiagramType,
  tryGetDiagramType,
  buildSystemPrompt,
} from '../../utils/constants';
import { DIAGRAM_SYNTAX_GUIDES, DIAGRAM_RULES } from '../../utils/diagramSyntax';
import type { DiagramType } from '../../types';

/**
 * Pulls the code block out of a syntax guide's "- Example:" section and removes
 * the common indentation the guide adds, yielding runnable Mermaid.
 */
function extractGuideExample(guide: string): string {
  const idx = guide.indexOf('- Example:');
  if (idx === -1) throw new Error('guide has no "- Example:" section');
  const lines = guide.slice(idx).split('\n').slice(1);
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length);
  const common = Math.min(...indents);
  return lines
    .map((l) => l.slice(common))
    .join('\n')
    .trim();
}

/** Diagram types whose syntax forbids quoting the primary text. */
const NEVER_QUOTE_TYPES: DiagramType[] = [
  'sankey',
  'ishikawa',
  'quadrantChart',
  'journey',
  'kanban',
  'timeline',
  'gantt',
  'eventmodeling',
  'wardley',
  'sequenceDiagram',
];

describe('Diagram type parser validation', () => {
  beforeAll(() => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
    });
  });

  it('ALL_DIAGRAM_TYPES matches the keys of DEFAULT_TEMPLATES', () => {
    const templateKeys = Object.keys(DEFAULT_TEMPLATES) as DiagramType[];
    expect([...ALL_DIAGRAM_TYPES].sort()).toEqual([...templateKeys].sort());
  });

  it.each(ALL_DIAGRAM_TYPES)('parses the default template for %s', async (type) => {
    const code = DEFAULT_TEMPLATES[type];
    const result = await mermaid.parse(code, { suppressErrors: true });
    expect(result).not.toBe(false);
  });

  it.each(ALL_DIAGRAM_TYPES)('detects the diagram type from its template (%s)', (type) => {
    const code = DEFAULT_TEMPLATES[type];
    expect(getDiagramType(code)).toBe(type);
  });
});

describe('Syntax guide examples', () => {
  beforeAll(() => {
    mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });
  });

  // The examples are shown to the LLM as the reference for each type, so an
  // example that does not parse actively teaches invalid syntax.
  it.each(ALL_DIAGRAM_TYPES)('the syntax guide example for %s parses', async (type) => {
    const example = extractGuideExample(DIAGRAM_SYNTAX_GUIDES[type]);
    const result = await mermaid.parse(example, { suppressErrors: true });
    expect(result).not.toBe(false);
  });

  it.each(ALL_DIAGRAM_TYPES)('the syntax guide example for %s declares that type', (type) => {
    const example = extractGuideExample(DIAGRAM_SYNTAX_GUIDES[type]);
    expect(tryGetDiagramType(example)).toBe(type);
  });
});

describe('Template hygiene', () => {
  // Whitespace-only lines are invisible in the editor but are sent verbatim to
  // the LLM, which may copy them back. Empty lines are fine; padded ones are not.
  it.each(ALL_DIAGRAM_TYPES)('the template for %s has no stray whitespace', (type) => {
    const offenders = DEFAULT_TEMPLATES[type]
      .split('\n')
      .map((line, i) => ({ line, i }))
      .filter(({ line }) => line !== line.trimEnd());
    expect(offenders).toEqual([]);
  });
});

describe('Per-type diagram rules', () => {
  it('every diagram type has a non-empty rules entry', () => {
    for (const type of ALL_DIAGRAM_TYPES) {
      expect(DIAGRAM_RULES[type]?.trim(), `missing rules for ${type}`).toBeTruthy();
    }
  });

  // Regression guard for the bug this feature exists to fix: a global "quote
  // everything" rule that contradicted types whose syntax forbids quotes.
  it.each(NEVER_QUOTE_TYPES)('the prompt for %s never demands quoted text', (type) => {
    const prompt = buildSystemPrompt({ diagramType: type, includeSyntaxGuide: true });
    expect(prompt).not.toMatch(/enclosed in double quotes/i);
    expect(prompt).not.toMatch(/MUST be double-quoted/i);
  });

  it('includes the per-type rules even when the syntax guide is off', () => {
    const prompt = buildSystemPrompt({ diagramType: 'sankey', includeSyntaxGuide: false });
    expect(prompt).toContain('SANKEY RULES:');
    expect(prompt).not.toContain('SANKEY DIAGRAM SYNTAX:');
  });

  it('omits all type-specific content when the type is unknown', () => {
    const prompt = buildSystemPrompt({ diagramType: null, includeSyntaxGuide: true });
    expect(prompt).not.toMatch(/RULES:/);
    expect(prompt).not.toMatch(/SYNTAX:/);
    expect(prompt).not.toMatch(/The diagram is of type/);
    expect(prompt).toContain('Rules:');
  });
});

describe('tryGetDiagramType', () => {
  it('no directive is a prefix of a later one', () => {
    // Matching returns the first hit, so a directive listed before one it
    // prefixes (e.g. stateDiagram before stateDiagram-v2) silently wins.
    const conflicts: string[] = [];
    DIAGRAM_DIRECTIVES.forEach(({ directive }, i) => {
      DIAGRAM_DIRECTIVES.slice(i + 1).forEach((later) => {
        if (later.directive.toLowerCase().startsWith(directive.toLowerCase())) {
          conflicts.push(`'${directive}' precedes '${later.directive}'`);
        }
      });
    });
    expect(conflicts).toEqual([]);
  });

  it.each(ALL_DIAGRAM_TYPES)('sees past YAML frontmatter (%s)', (type) => {
    const code = `---\ntitle: My Diagram\n---\n${DEFAULT_TEMPLATES[type]}`;
    expect(tryGetDiagramType(code)).toBe(type);
  });

  it.each(ALL_DIAGRAM_TYPES)('sees past an init directive (%s)', (type) => {
    const code = `%%{init: {'theme':'dark'}}%%\n${DEFAULT_TEMPLATES[type]}`;
    expect(tryGetDiagramType(code)).toBe(type);
  });

  it.each(ALL_DIAGRAM_TYPES)('sees past a comment (%s)', (type) => {
    const code = `%% a note about this diagram\n${DEFAULT_TEMPLATES[type]}`;
    expect(tryGetDiagramType(code)).toBe(type);
  });

  it('sees past frontmatter, directives and comments combined', () => {
    const code = [
      '---',
      'title: Combined',
      'config:',
      '  theme: forest',
      '---',
      '',
      "%%{init: {'theme':'dark'}}%%",
      '%% a trailing comment',
      '',
      DEFAULT_TEMPLATES.gantt,
    ].join('\n');
    expect(tryGetDiagramType(code)).toBe('gantt');
  });

  it.each([
    ['empty string', ''],
    ['whitespace only', '   \n\t\n  '],
    ['prose', 'This is not a diagram at all.'],
    ['unsupported directive', 'quantumDiagram\n  A --> B'],
    ['frontmatter only', '---\ntitle: X\n---\n'],
  ])('returns null for %s', (_label, code) => {
    expect(tryGetDiagramType(code)).toBeNull();
  });

  it('requires a word boundary after the directive', () => {
    expect(tryGetDiagramType('graphene\n  A --> B')).toBeNull();
    expect(tryGetDiagramType('pierogi : 1')).toBeNull();
    // ...but real suffixed directives still match.
    expect(tryGetDiagramType('graph TD\n  A --> B')).toBe('flowchart');
    expect(tryGetDiagramType('flowchart-elk LR\n  A --> B')).toBe('flowchart');
    expect(tryGetDiagramType('stateDiagram-v2\n  [*] --> A')).toBe('stateDiagram-v2');
  });

  it('getDiagramType falls back to the default for unknown input', () => {
    expect(getDiagramType('not a diagram')).toBe('flowchart');
  });
});
