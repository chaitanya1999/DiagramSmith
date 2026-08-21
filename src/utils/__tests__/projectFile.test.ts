import { describe, it, expect } from 'vitest';
import { buildProjectFile, parseProjectFile, PROJECT_SCHEMA_VERSION } from '../projectFile';
import type { DiagramSnapshot, VersionHistory } from '../../types';

function snapshot(overrides: Partial<DiagramSnapshot> = {}): DiagramSnapshot {
  return {
    id: 'abc123',
    timestamp: 1700000000000,
    type: 'manual',
    prompt: 'Manual Edit',
    mermaid: 'graph TD\n  A --> B',
    summary: 'A flow.',
    ...overrides,
  };
}

const HISTORY: VersionHistory = {
  snapshots: [snapshot({ id: 'a' }), snapshot({ id: 'b', type: 'llm' })],
  activeIndex: 1,
};

describe('buildProjectFile', () => {
  it('round-trips through parseProjectFile', () => {
    const json = buildProjectFile('graph TD\n  A --> B', 'A flow.', 'flowchart', HISTORY);
    const parsed = parseProjectFile(json);

    expect(parsed?.mermaid).toBe('graph TD\n  A --> B');
    expect(parsed?.summary).toBe('A flow.');
    expect(parsed?.diagramType).toBe('flowchart');
    expect(parsed?.versionHistory).toEqual(HISTORY);
  });

  it('stamps the schema version and an export timestamp', () => {
    const raw = JSON.parse(buildProjectFile('graph TD', '', 'flowchart', HISTORY));
    expect(raw.version).toBe(PROJECT_SCHEMA_VERSION);
    expect(Date.parse(raw.exportedAt)).not.toBeNaN();
  });
});

// Files written before versioning existed carry only { mermaid, summary }. They must
// keep importing — they are the backups users already have on disk.
describe('parseProjectFile — legacy files', () => {
  it('accepts the original two-field format', () => {
    const parsed = parseProjectFile(JSON.stringify({ mermaid: 'graph TD', summary: 'Old.' }));
    expect(parsed?.mermaid).toBe('graph TD');
    expect(parsed?.summary).toBe('Old.');
    expect(parsed?.versionHistory).toBeNull();
    expect(parsed?.diagramType).toBeNull();
  });

  it('defaults a missing summary to empty rather than failing', () => {
    expect(parseProjectFile(JSON.stringify({ mermaid: 'graph TD' }))?.summary).toBe('');
  });
});

describe('parseProjectFile — rejection', () => {
  it.each([
    ['malformed JSON', '{{{'],
    ['a JSON primitive', '42'],
    ['null', 'null'],
    ['an object with no mermaid', '{"summary":"x"}'],
    ['a non-string mermaid', '{"mermaid":123}'],
    ['an empty mermaid', '{"mermaid":"   "}'],
  ])('returns null for %s', (_label, raw) => {
    expect(parseProjectFile(raw)).toBeNull();
  });
});

// A corrupt history must not cost the user their diagram — the fields are validated
// independently so the import degrades rather than failing outright.
describe('parseProjectFile — partial corruption', () => {
  it('still imports the diagram when the history is unusable', () => {
    const parsed = parseProjectFile(
      JSON.stringify({ version: 1, mermaid: 'graph TD', summary: 'ok', versionHistory: 'nonsense' })
    );
    expect(parsed?.mermaid).toBe('graph TD');
    expect(parsed?.versionHistory).toBeNull();
  });

  it('drops malformed snapshots but keeps the valid ones', () => {
    const parsed = parseProjectFile(
      JSON.stringify({
        version: 1,
        mermaid: 'graph TD',
        versionHistory: { snapshots: [snapshot({ id: 'good' }), null, 'nope'], activeIndex: 0 },
      })
    );
    expect(parsed?.versionHistory?.snapshots).toHaveLength(1);
    expect(parsed?.versionHistory?.snapshots[0].id).toBe('good');
  });

  it('clamps an out-of-range activeIndex', () => {
    const parsed = parseProjectFile(
      JSON.stringify({
        version: 1,
        mermaid: 'graph TD',
        versionHistory: { snapshots: [snapshot()], activeIndex: 99 },
      })
    );
    expect(parsed?.versionHistory?.activeIndex).toBe(0);
  });

  it('ignores an unrecognised diagram type', () => {
    const parsed = parseProjectFile(
      JSON.stringify({ version: 1, mermaid: 'graph TD', diagramType: 'notAType' })
    );
    expect(parsed?.diagramType).toBeNull();
  });
});
