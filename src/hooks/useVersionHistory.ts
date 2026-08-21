import { useState, useCallback, useEffect, useRef } from 'react';
import type { DiagramSnapshot, SnapshotType, VersionHistory } from '../types';
import { loadVersionHistory, saveVersionHistory, loadMaxSnapshots, saveMaxSnapshots } from '../services/storage';

interface UseVersionHistoryReturn {
  snapshots: DiagramSnapshot[];
  activeIndex: number;
  maxSnapshots: number;
  isRestored: boolean;
  handleManualEdit: (mermaid: string, summary: string) => void;
  handleLlmGenerate: (mermaid: string, summary: string, prompt: string) => void;
  handleReplaceDocument: (mermaid: string, summary: string, label: string) => void;
  restoreToIndex: (index: number) => DiagramSnapshot | null;
  setMaxSnapshots: (max: number) => void;
  resetHistory: () => void;
  replaceHistory: (history: VersionHistory) => void;
  clearHistoryKeepCurrent: () => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

interface SnapshotInput {
  type: SnapshotType;
  prompt: string;
  mermaid: string;
  summary: string;
}

/**
 * The one place snapshots are added. `coalesce` folds the change into the latest
 * snapshot when it is of the same kind, which is what keeps a run of keystrokes from
 * becoming a run of snapshots. LLM generations and document replacements never
 * coalesce: each is a distinct point the user may want to return to.
 */
export function commitSnapshot(
  prev: VersionHistory,
  input: SnapshotInput,
  maxSnapshots: number,
  coalesce: boolean
): VersionHistory {
  let snapshots = [...prev.snapshots];
  let activeIndex = prev.activeIndex;

  // Editing from a restored point discards everything after it.
  if (activeIndex >= 0 && activeIndex < snapshots.length - 1) {
    snapshots = snapshots.slice(0, activeIndex + 1);
  }

  const latestIndex = snapshots.length - 1;
  const latest = latestIndex >= 0 ? snapshots[latestIndex] : null;

  if (coalesce && latest && latest.type === input.type) {
    snapshots[latestIndex] = {
      ...latest,
      mermaid: input.mermaid,
      summary: input.summary,
      timestamp: Date.now(),
    };
  } else {
    snapshots.push({ id: generateId(), timestamp: Date.now(), ...input });
  }
  activeIndex = snapshots.length - 1;

  while (snapshots.length > maxSnapshots) {
    snapshots.shift();
    activeIndex = Math.max(0, activeIndex - 1);
  }

  return { snapshots, activeIndex };
}

export function useVersionHistory(onStorageError?: (message: string) => void): UseVersionHistoryReturn {
  const [maxSnapshots, setMaxSnapshotsState] = useState<number>(() => loadMaxSnapshots());
  const [isRestored, setIsRestored] = useState(false);
  const [history, setHistory] = useState<VersionHistory>(() => {
    const loaded = loadVersionHistory();
    if (loaded && loaded.snapshots.length > 0) {
      return loaded;
    }
    return { snapshots: [], activeIndex: -1 };
  });

  // Keep a ref in sync so we can read the latest value synchronously
  // (setState updater callbacks run async in React 18, so we can't rely
  //  on them to return values from event handlers).
  const historyRef = useRef(history);
  historyRef.current = history;

  const onStorageErrorRef = useRef(onStorageError);
  onStorageErrorRef.current = onStorageError;

  // The initial value came straight from storage; writing it back is pure cost.
  const skipInitialPersistRef = useRef(true);
  const quotaExhaustedRef = useRef(false);

  useEffect(() => {
    if (skipInitialPersistRef.current) {
      skipInitialPersistRef.current = false;
      return;
    }

    if (saveVersionHistory(history)) {
      quotaExhaustedRef.current = false;
      return;
    }

    // Storage is full. Warn once per episode, then shed the oldest snapshot and let
    // this effect retry — the recent versions are worth more than the oldest ones.
    if (!quotaExhaustedRef.current) {
      quotaExhaustedRef.current = true;
      onStorageErrorRef.current?.(
        history.snapshots.length > 1
          ? 'Browser storage is full — older versions are being dropped to make room.'
          : 'Could not save version history — browser storage is full.'
      );
    }

    if (history.snapshots.length > 1) {
      setHistory((prev) => ({
        snapshots: prev.snapshots.slice(1),
        activeIndex: Math.max(0, prev.activeIndex - 1),
      }));
    }
  }, [history]);

  const handleManualEdit = useCallback((mermaid: string, summary: string) => {
    setHistory((prev) => commitSnapshot(prev, { type: 'manual', prompt: 'Manual Edit', mermaid, summary }, maxSnapshots, true));
    setIsRestored(false);
  }, [maxSnapshots]);

  const handleLlmGenerate = useCallback((mermaid: string, summary: string, prompt: string) => {
    setHistory((prev) => commitSnapshot(prev, { type: 'llm', prompt, mermaid, summary }, maxSnapshots, false));
    setIsRestored(false);
  }, [maxSnapshots]);

  /**
   * A wholesale document swap (diagram-type change, import). Always pushes, so the
   * work being replaced stays recoverable instead of being coalesced away.
   */
  const handleReplaceDocument = useCallback((mermaid: string, summary: string, label: string) => {
    setHistory((prev) => commitSnapshot(prev, { type: 'manual', prompt: label, mermaid, summary }, maxSnapshots, false));
    setIsRestored(false);
  }, [maxSnapshots]);

  const restoreToIndex = useCallback((index: number): DiagramSnapshot | null => {
    // Read synchronously from the ref for immediate return value
    const current = historyRef.current;
    if (index < 0 || index >= current.snapshots.length) {
      return null;
    }

    setHistory({ snapshots: current.snapshots, activeIndex: index });
    setIsRestored(index < current.snapshots.length - 1);

    return current.snapshots[index];
  }, []);

  const handleSetMaxSnapshots = useCallback((max: number) => {
    const clamped = Math.max(1, Math.min(50, max));
    setMaxSnapshotsState(clamped);
    if (!saveMaxSnapshots(clamped)) {
      onStorageErrorRef.current?.('Could not save the Max Snapshots setting — browser storage is full.');
    }
    setHistory((prev) => {
      if (prev.snapshots.length <= clamped) return prev;
      const excess = prev.snapshots.length - clamped;
      return {
        snapshots: prev.snapshots.slice(excess),
        activeIndex: Math.max(0, prev.activeIndex - excess),
      };
    });
  }, []);

  const resetHistory = useCallback(() => {
    setHistory({ snapshots: [], activeIndex: -1 });
    setIsRestored(false);
  }, []);

  /** Adopts a history wholesale — used when importing a project file that carries one. */
  const replaceHistory = useCallback((incoming: VersionHistory) => {
    const snapshots = incoming.snapshots.slice(-maxSnapshots);
    const dropped = incoming.snapshots.length - snapshots.length;
    setHistory({
      snapshots,
      activeIndex: Math.min(Math.max(0, incoming.activeIndex - dropped), snapshots.length - 1),
    });
    setIsRestored(false);
  }, [maxSnapshots]);

  const clearHistoryKeepCurrent = useCallback(() => {
    const current = historyRef.current;
    if (current.snapshots.length === 0 || current.activeIndex < 0) return;
    const currentSnapshot = current.snapshots[current.activeIndex];
    if (!currentSnapshot) return;
    setHistory({ snapshots: [currentSnapshot], activeIndex: 0 });
    setIsRestored(false);
  }, []);

  return {
    snapshots: history.snapshots,
    activeIndex: history.activeIndex,
    maxSnapshots,
    isRestored,
    handleManualEdit,
    handleLlmGenerate,
    handleReplaceDocument,
    restoreToIndex,
    setMaxSnapshots: handleSetMaxSnapshots,
    resetHistory,
    replaceHistory,
    clearHistoryKeepCurrent,
  };
}
