import type { LlmConfig } from '../types';
import { DEFAULT_TEMPLATES, DEFAULT_DIAGRAM_TYPE, DEFAULT_LLM_CONFIG, STORAGE_KEYS } from '../utils/constants';

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