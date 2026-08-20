import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadVersionHistory, saveVersionHistory, saveMermaid, saveSummary, saveMaxSnapshots } from '../storage';
import { STORAGE_KEYS } from '../../utils/constants';
import type { DiagramSnapshot } from '../../types';

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

function store(value: unknown) {
  localStorage.setItem(STORAGE_KEYS.VERSION_HISTORY, JSON.stringify(value));
}

beforeEach(() => {
  localStorage.clear();
  // Several cases deliberately trigger the module's own error logging.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('loadVersionHistory — valid data', () => {
  it('round-trips a saved history', () => {
    const history = { snapshots: [snapshot({ id: 'a' }), snapshot({ id: 'b' })], activeIndex: 1 };
    expect(saveVersionHistory(history)).toBe(true);
    expect(loadVersionHistory()).toEqual(history);
  });

  it('returns null when nothing is stored', () => {
    expect(loadVersionHistory()).toBeNull();
  });
});

// A `as VersionHistory` cast checks nothing at runtime. Corrupt data used to reach
// the render and crash it on every load, which localStorage then reproduced forever.
describe('loadVersionHistory — malformed data', () => {
  it.each([
    ['not JSON at all', '{{{'],
    ['a JSON primitive', '42'],
    ['null', 'null'],
  ])('returns null for %s', (_label, raw) => {
    localStorage.setItem(STORAGE_KEYS.VERSION_HISTORY, raw);
    expect(loadVersionHistory()).toBeNull();
  });

  it('returns null when snapshots is not an array', () => {
    store({ snapshots: 'nope', activeIndex: 0 });
    expect(loadVersionHistory()).toBeNull();
  });

  it('drops entries that are not shaped like snapshots', () => {
    store({ snapshots: [snapshot({ id: 'good' }), null, 'hello', { id: 'x' }], activeIndex: 0 });
    const result = loadVersionHistory();
    expect(result?.snapshots).toHaveLength(1);
    expect(result?.snapshots[0].id).toBe('good');
  });

  it('drops entries with an unknown snapshot type', () => {
    store({ snapshots: [snapshot({ type: 'wat' as DiagramSnapshot['type'] })], activeIndex: 0 });
    expect(loadVersionHistory()).toBeNull();
  });

  it('drops entries missing the mermaid field', () => {
    const bad = { ...snapshot() } as Partial<DiagramSnapshot>;
    delete bad.mermaid;
    store({ snapshots: [bad], activeIndex: 0 });
    expect(loadVersionHistory()).toBeNull();
  });

  it('returns null when every entry is malformed', () => {
    store({ snapshots: [null, undefined, 3], activeIndex: 0 });
    expect(loadVersionHistory()).toBeNull();
  });
});

describe('loadVersionHistory — activeIndex clamping', () => {
  it('clamps an index past the end', () => {
    store({ snapshots: [snapshot(), snapshot({ id: 'b' })], activeIndex: 999 });
    expect(loadVersionHistory()?.activeIndex).toBe(1);
  });

  it('clamps a negative index', () => {
    store({ snapshots: [snapshot()], activeIndex: -5 });
    expect(loadVersionHistory()?.activeIndex).toBe(0);
  });

  it('defaults to the newest snapshot when the index is not a number', () => {
    store({ snapshots: [snapshot(), snapshot({ id: 'b' })], activeIndex: 'latest' });
    expect(loadVersionHistory()?.activeIndex).toBe(1);
  });

  it('re-clamps after malformed entries are dropped', () => {
    store({ snapshots: [snapshot(), null, null], activeIndex: 2 });
    const result = loadVersionHistory();
    expect(result?.snapshots).toHaveLength(1);
    expect(result?.activeIndex).toBe(0);
  });
});

// Writers used to swallow QuotaExceededError, so the app kept looking healthy
// while persisting nothing and the user only found out on reload.
describe('write failures are reported', () => {
  function failWrites() {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('exceeded the quota', 'QuotaExceededError');
    });
  }

  it.each([
    ['saveMermaid', () => saveMermaid('graph TD')],
    ['saveSummary', () => saveSummary('a summary')],
    ['saveMaxSnapshots', () => saveMaxSnapshots(10)],
    ['saveVersionHistory', () => saveVersionHistory({ snapshots: [snapshot()], activeIndex: 0 })],
  ])('%s returns false when the quota is exceeded', (_label, write) => {
    failWrites();
    expect(write()).toBe(false);
  });

  it('returns true on a normal write', () => {
    expect(saveMermaid('graph TD')).toBe(true);
  });
});
