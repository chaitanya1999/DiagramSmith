import { describe, it, expect, beforeAll } from 'vitest';
import mermaid from 'mermaid';
import { DEFAULT_TEMPLATES, ALL_DIAGRAM_TYPES, getDiagramType } from '../../utils/constants';
import type { DiagramType } from '../../types';

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
