import { describe, it, expect } from 'vitest';
import { commitSnapshot } from '../useVersionHistory';
import type { SnapshotType, VersionHistory } from '../../types';

const EMPTY: VersionHistory = { snapshots: [], activeIndex: -1 };
const BIG_CAP = 50;

/** Mirrors what App does: manual edits coalesce, LLM and document swaps never do. */
function manual(history: VersionHistory, mermaid: string, summary = '', cap = BIG_CAP) {
  return commitSnapshot(history, { type: 'manual', prompt: 'Manual Edit', mermaid, summary }, cap, true);
}
function llm(history: VersionHistory, mermaid: string, summary = '', cap = BIG_CAP) {
  return commitSnapshot(history, { type: 'llm', prompt: 'do a thing', mermaid, summary }, cap, false);
}
function replace(history: VersionHistory, mermaid: string, summary = '', cap = BIG_CAP) {
  return commitSnapshot(history, { type: 'manual', prompt: 'New diagram', mermaid, summary }, cap, false);
}

/** Applies a sequence of steps and returns the resulting snapshot types in order. */
function run(steps: Array<'ai' | 'manual'>): SnapshotType[] {
  let history = EMPTY;
  steps.forEach((step, i) => {
    history = step === 'ai' ? llm(history, `code-${i}`) : manual(history, `code-${i}`);
  });
  return history.snapshots.map((s) => s.type);
}

describe('snapshot sequencing', () => {
  // The agreed rule: an AI generation is always its own snapshot; a run of
  // consecutive manual edits collapses into one.
  it.each([
    [['ai'], 1],
    [['manual'], 1],
    [['ai', 'ai'], 2],
    [['ai', 'manual'], 2],
    [['manual', 'ai'], 2],
    [['manual', 'manual'], 1],
    [['ai', 'manual', 'manual', 'manual', 'ai'], 3],
    [['manual', 'manual', 'ai', 'manual', 'manual'], 3],
  ] as Array<[Array<'ai' | 'manual'>, number]>)('%j produces %i snapshot(s)', (steps, expected) => {
    expect(run(steps)).toHaveLength(expected);
  });

  it('labels the AI → manual → manual → manual → AI run correctly', () => {
    expect(run(['ai', 'manual', 'manual', 'manual', 'ai'])).toEqual(['llm', 'manual', 'llm']);
  });

  it('keeps only the newest content when manual edits coalesce', () => {
    let history = manual(EMPTY, 'first');
    history = manual(history, 'second');
    history = manual(history, 'third');
    expect(history.snapshots).toHaveLength(1);
    expect(history.snapshots[0].mermaid).toBe('third');
  });

  it('never coalesces two AI generations', () => {
    let history = llm(EMPTY, 'first');
    history = llm(history, 'second');
    expect(history.snapshots.map((s) => s.mermaid)).toEqual(['first', 'second']);
  });

  it('points activeIndex at the newest snapshot after every commit', () => {
    let history = llm(EMPTY, 'a');
    history = manual(history, 'b');
    history = llm(history, 'c');
    expect(history.activeIndex).toBe(history.snapshots.length - 1);
  });
});

describe('document replacement', () => {
  // Coalescing here would overwrite the very snapshot holding the work being
  // replaced — the diagram-type switch used to destroy it that way.
  it('pushes a new snapshot instead of overwriting the latest manual one', () => {
    const history = replace(manual(EMPTY, 'my work'), 'template');
    expect(history.snapshots).toHaveLength(2);
    expect(history.snapshots[0].mermaid).toBe('my work');
    expect(history.snapshots[1].mermaid).toBe('template');
  });

  it('carries its label as the snapshot prompt', () => {
    const history = replace(EMPTY, 'template');
    expect(history.snapshots[0].prompt).toBe('New diagram');
  });
});

describe('editing from a restored snapshot', () => {
  it('discards everything after the restored point', () => {
    let history = manual(EMPTY, 'a');
    history = llm(history, 'b');
    history = llm(history, 'c');
    expect(history.snapshots).toHaveLength(3);

    // Restore to index 0, then edit.
    const restored: VersionHistory = { ...history, activeIndex: 0 };
    const edited = manual(restored, 'a-edited');

    expect(edited.snapshots.map((s) => s.mermaid)).toEqual(['a-edited']);
    expect(edited.activeIndex).toBe(0);
  });

  it('coalesces into the restored snapshot when both are manual', () => {
    let history = manual(EMPTY, 'a');
    history = llm(history, 'b');
    const restored: VersionHistory = { ...history, activeIndex: 0 };
    const edited = manual(restored, 'a-edited');
    expect(edited.snapshots).toHaveLength(1);
    expect(edited.snapshots[0].type).toBe('manual');
  });

  it('pushes a new snapshot when the restored one is an AI snapshot', () => {
    let history = llm(EMPTY, 'a');
    history = llm(history, 'b');
    const restored: VersionHistory = { ...history, activeIndex: 0 };
    const edited = manual(restored, 'a-edited');
    expect(edited.snapshots.map((s) => s.type)).toEqual(['llm', 'manual']);
  });
});

describe('max snapshots cap', () => {
  it('drops the oldest snapshots once the cap is exceeded', () => {
    let history = EMPTY;
    for (let i = 0; i < 8; i++) history = llm(history, `code-${i}`, '', 3);
    expect(history.snapshots).toHaveLength(3);
    expect(history.snapshots.map((s) => s.mermaid)).toEqual(['code-5', 'code-6', 'code-7']);
  });

  it('keeps activeIndex pointing at the newest snapshot after trimming', () => {
    let history = EMPTY;
    for (let i = 0; i < 8; i++) history = llm(history, `code-${i}`, '', 3);
    expect(history.activeIndex).toBe(2);
  });

  it('honours a cap of 1', () => {
    let history = llm(EMPTY, 'a', '', 1);
    history = llm(history, 'b', '', 1);
    expect(history.snapshots).toHaveLength(1);
    expect(history.snapshots[0].mermaid).toBe('b');
    expect(history.activeIndex).toBe(0);
  });
});

describe('snapshot identity', () => {
  it('gives every pushed snapshot a distinct id', () => {
    let history = EMPTY;
    for (let i = 0; i < 20; i++) history = llm(history, `code-${i}`);
    const ids = new Set(history.snapshots.map((s) => s.id));
    expect(ids.size).toBe(history.snapshots.length);
  });

  it('preserves the id when coalescing', () => {
    const first = manual(EMPTY, 'a');
    const second = manual(first, 'b');
    expect(second.snapshots[0].id).toBe(first.snapshots[0].id);
  });
});
