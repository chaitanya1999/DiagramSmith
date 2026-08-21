import type { DiagramSnapshot, LlmConfig, VersionHistory } from '../types';
import { DEFAULT_TEMPLATES, DEFAULT_DIAGRAM_TYPE, DEFAULT_LLM_CONFIG, STORAGE_KEYS, DEFAULT_MAX_SNAPSHOTS } from '../utils/constants';

/**
 * Every writer returns whether the value actually reached localStorage. Callers must
 * check it: a swallowed QuotaExceededError means the app keeps looking healthy while
 * silently persisting nothing, and the user only discovers the loss on reload.
 */
function writeKey(key: string, value: string, label: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.error(`Failed to save ${label} to localStorage:`, e);
    return false;
  }
}

export function loadMermaid(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MERMAID);
    return stored || DEFAULT_TEMPLATES[DEFAULT_DIAGRAM_TYPE];
  } catch {
    return DEFAULT_TEMPLATES[DEFAULT_DIAGRAM_TYPE];
  }
}

export function saveMermaid(mermaid: string): boolean {
  return writeKey(STORAGE_KEYS.MERMAID, mermaid, 'mermaid');
}

export function loadSummary(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SUMMARY);
    return stored || '';
  } catch {
    return '';
  }
}

export function saveSummary(summary: string): boolean {
  return writeKey(STORAGE_KEYS.SUMMARY, summary, 'summary');
}

export function loadLlmConfig(): LlmConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LLM_CONFIG);
    if (stored) {
      return { ...DEFAULT_LLM_CONFIG, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load LLM config from localStorage:', e);
  }
  return DEFAULT_LLM_CONFIG;
}

export function saveLlmConfig(config: LlmConfig): boolean {
  return writeKey(STORAGE_KEYS.LLM_CONFIG, JSON.stringify(config), 'LLM config');
}

/**
 * Rehydrated snapshots are untrusted input: a `as VersionHistory` cast checks nothing
 * at runtime, and a malformed entry or an out-of-range activeIndex crashes the render
 * on every load — which localStorage then reproduces forever.
 */
export function isValidSnapshot(value: unknown): value is DiagramSnapshot {
  if (!value || typeof value !== 'object') return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.timestamp === 'number' &&
    (s.type === 'manual' || s.type === 'llm') &&
    typeof s.prompt === 'string' &&
    typeof s.mermaid === 'string' &&
    typeof s.summary === 'string'
  );
}

export function loadVersionHistory(): VersionHistory | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.VERSION_HISTORY);
    if (!stored) return null;

    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') return null;

    const raw = parsed as Record<string, unknown>;
    if (!Array.isArray(raw.snapshots)) return null;

    // Drop malformed entries rather than trusting the whole blob.
    const snapshots = raw.snapshots.filter(isValidSnapshot);
    if (snapshots.length === 0) return null;

    const rawIndex = typeof raw.activeIndex === 'number' ? Math.trunc(raw.activeIndex) : snapshots.length - 1;
    const activeIndex = Math.min(Math.max(0, rawIndex), snapshots.length - 1);

    return { snapshots, activeIndex };
  } catch (e) {
    console.error('Failed to load version history from localStorage:', e);
  }
  return null;
}

export function saveVersionHistory(history: VersionHistory): boolean {
  return writeKey(STORAGE_KEYS.VERSION_HISTORY, JSON.stringify(history), 'version history');
}

export function loadMaxSnapshots(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MAX_SNAPSHOTS);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 50) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load max snapshots from localStorage:', e);
  }
  return DEFAULT_MAX_SNAPSHOTS;
}

export function saveMaxSnapshots(max: number): boolean {
  return writeKey(STORAGE_KEYS.MAX_SNAPSHOTS, String(max), 'max snapshots');
}
