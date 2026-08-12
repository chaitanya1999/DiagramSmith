import type { LlmConfig, VersionHistory } from '../types';
import { DEFAULT_TEMPLATES, DEFAULT_DIAGRAM_TYPE, DEFAULT_LLM_CONFIG, STORAGE_KEYS, DEFAULT_MAX_SNAPSHOTS } from '../utils/constants';

export function loadMermaid(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MERMAID);
    return stored || DEFAULT_TEMPLATES[DEFAULT_DIAGRAM_TYPE];
  } catch {
    return DEFAULT_TEMPLATES[DEFAULT_DIAGRAM_TYPE];
  }
}

export function saveMermaid(mermaid: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MERMAID, mermaid);
  } catch (e) {
    console.error('Failed to save mermaid to localStorage:', e);
  }
}

export function loadSummary(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SUMMARY);
    return stored || '';
  } catch {
    return '';
  }
}

export function saveSummary(summary: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUMMARY, summary);
  } catch (e) {
    console.error('Failed to save summary to localStorage:', e);
  }
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

export function saveLlmConfig(config: LlmConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LLM_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save LLM config to localStorage:', e);
  }
}

export function loadVersionHistory(): VersionHistory | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.VERSION_HISTORY);
    if (stored) {
      const parsed = JSON.parse(stored) as VersionHistory;
      if (Array.isArray(parsed.snapshots) && typeof parsed.activeIndex === 'number') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load version history from localStorage:', e);
  }
  return null;
}

export function saveVersionHistory(history: VersionHistory): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VERSION_HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save version history to localStorage:', e);
  }
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

export function saveMaxSnapshots(max: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MAX_SNAPSHOTS, String(max));
  } catch (e) {
    console.error('Failed to save max snapshots to localStorage:', e);
  }
}
