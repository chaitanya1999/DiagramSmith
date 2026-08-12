import { useState, useCallback, useRef } from 'react';
import type { DiagramSnapshot, VersionHistory } from '../types';
import { loadVersionHistory, saveVersionHistory, loadMaxSnapshots, saveMaxSnapshots } from '../services/storage';

interface UseVersionHistoryReturn {
  snapshots: DiagramSnapshot[];
  activeIndex: number;
  maxSnapshots: number;
  isRestored: boolean;
  handleManualEdit: (mermaid: string, summary: string) => void;
  handleLlmGenerate: (mermaid: string, summary: string, prompt: string) => void;
  restoreToIndex: (index: number) => DiagramSnapshot | null;
  setMaxSnapshots: (max: number) => void;
  resetHistory: () => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function useVersionHistory(): UseVersionHistoryReturn {
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

  const persist = useCallback((h: VersionHistory) => {
    saveVersionHistory(h);
  }, []);

  const handleManualEdit = useCallback((mermaid: string, summary: string) => {
    setHistory((prev) => {
      let snapshots = [...prev.snapshots];
      let activeIndex = prev.activeIndex;

      // If we are in a restored state (activeIndex < last index), truncate future snapshots
      if (activeIndex < snapshots.length - 1) {
        snapshots = snapshots.slice(0, activeIndex + 1);
      }

      const latestIndex = snapshots.length - 1;
      const latest = latestIndex >= 0 ? snapshots[latestIndex] : null;

      if (latest && latest.type === 'manual') {
        // Modify in-place: update the latest manual snapshot
        snapshots[latestIndex] = {
          ...latest,
          mermaid,
          summary,
          timestamp: Date.now(),
        };
        activeIndex = latestIndex;
      } else {
        // Push new manual snapshot
        snapshots.push({
          id: generateId(),
          timestamp: Date.now(),
          type: 'manual',
          prompt: 'Manual Edit',
          mermaid,
          summary,
        });
        activeIndex = snapshots.length - 1;
      }

      // Enforce max snapshots cap
      while (snapshots.length > maxSnapshots) {
        snapshots.shift();
        activeIndex = Math.max(0, activeIndex - 1);
      }

      const newHistory: VersionHistory = { snapshots, activeIndex };
      persist(newHistory);
      setIsRestored(false);
      return newHistory;
    });
  }, [maxSnapshots, persist]);

  const handleLlmGenerate = useCallback((mermaid: string, summary: string, prompt: string) => {
    setHistory((prev) => {
      let snapshots = [...prev.snapshots];
      let activeIndex = prev.activeIndex;

      // If we are in a restored state (activeIndex < last index), truncate future snapshots
      if (activeIndex < snapshots.length - 1) {
        snapshots = snapshots.slice(0, activeIndex + 1);
      }

      // Always push a new snapshot for LLM generate
      snapshots.push({
        id: generateId(),
        timestamp: Date.now(),
        type: 'llm',
        prompt,
        mermaid,
        summary,
      });
      activeIndex = snapshots.length - 1;

      // Enforce max snapshots cap
      while (snapshots.length > maxSnapshots) {
        snapshots.shift();
        activeIndex = Math.max(0, activeIndex - 1);
      }

      const newHistory: VersionHistory = { snapshots, activeIndex };
      persist(newHistory);
      setIsRestored(false);
      return newHistory;
    });
  }, [maxSnapshots, persist]);

  const restoreToIndex = useCallback((index: number): DiagramSnapshot | null => {
    // Read synchronously from the ref for immediate return value
    const current = historyRef.current;
    if (index < 0 || index >= current.snapshots.length) {
      return null;
    }

    // Update state with the new activeIndex
    const newHistory: VersionHistory = {
      snapshots: current.snapshots,
      activeIndex: index,
    };
    setHistory(newHistory);
    persist(newHistory);
    setIsRestored(index < current.snapshots.length - 1);

    return current.snapshots[index];
  }, [persist]);

  const handleSetMaxSnapshots = useCallback((max: number) => {
    const clamped = Math.max(1, Math.min(50, max));
    setMaxSnapshotsState(clamped);
    saveMaxSnapshots(clamped);
    setHistory((prev) => {
      if (prev.snapshots.length <= clamped) return prev;
      const excess = prev.snapshots.length - clamped;
      const newHistory: VersionHistory = {
        snapshots: prev.snapshots.slice(excess),
        activeIndex: Math.max(0, prev.activeIndex - excess),
      };
      persist(newHistory);
      return newHistory;
    });
  }, [persist]);

  const resetHistory = useCallback(() => {
    const empty: VersionHistory = { snapshots: [], activeIndex: -1 };
    setHistory(empty);
    persist(empty);
    setIsRestored(false);
  }, [persist]);

  return {
    snapshots: history.snapshots,
    activeIndex: history.activeIndex,
    maxSnapshots,
    isRestored,
    handleManualEdit,
    handleLlmGenerate,
    restoreToIndex,
    setMaxSnapshots: handleSetMaxSnapshots,
    resetHistory,
  };
}