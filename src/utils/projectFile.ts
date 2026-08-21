import type { DiagramProjectFile, DiagramType, VersionHistory } from '../types';
import { isValidSnapshot } from '../services/storage';
import { ALL_DIAGRAM_TYPES } from './constants';

/**
 * Bump when the shape changes incompatibly. Files written before versioning existed
 * carry only `{ mermaid, summary }` and no `version` field at all, which is precisely
 * how `parseProjectFile` recognises them.
 */
export const PROJECT_SCHEMA_VERSION = 1;

export interface ParsedProject {
  mermaid: string;
  summary: string;
  /** Informational: the importer still re-detects the type from the code itself. */
  diagramType: DiagramType | null;
  versionHistory: VersionHistory | null;
}

export function buildProjectFile(
  mermaid: string,
  summary: string,
  diagramType: DiagramType,
  versionHistory: VersionHistory
): string {
  const payload: DiagramProjectFile = {
    version: PROJECT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    mermaid,
    summary,
    diagramType,
    versionHistory,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Accepts both the current schema and the original `{ mermaid, summary }` files.
 * Everything beyond `mermaid` is optional and independently validated, so a file with
 * a corrupt history still imports its diagram rather than failing outright.
 */
export function parseProjectFile(content: string): ParsedProject | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') return null;
  const raw = parsed as Record<string, unknown>;

  if (typeof raw.mermaid !== 'string' || !raw.mermaid.trim()) return null;

  const summary = typeof raw.summary === 'string' ? raw.summary : '';

  const diagramType = ALL_DIAGRAM_TYPES.includes(raw.diagramType as DiagramType)
    ? (raw.diagramType as DiagramType)
    : null;

  let versionHistory: VersionHistory | null = null;
  const rawHistory = raw.versionHistory as Record<string, unknown> | undefined;
  if (rawHistory && Array.isArray(rawHistory.snapshots)) {
    const snapshots = rawHistory.snapshots.filter(isValidSnapshot);
    if (snapshots.length > 0) {
      const rawIndex =
        typeof rawHistory.activeIndex === 'number'
          ? Math.trunc(rawHistory.activeIndex)
          : snapshots.length - 1;
      versionHistory = {
        snapshots,
        activeIndex: Math.min(Math.max(0, rawIndex), snapshots.length - 1),
      };
    }
  }

  return { mermaid: raw.mermaid, summary, diagramType, versionHistory };
}
