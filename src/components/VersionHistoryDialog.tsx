import { useState, useCallback, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import type { DiagramSnapshot, ThemeMode } from '../types';
import { MermaidDiffView } from './MermaidDiffView';

interface VersionHistoryDialogProps {
  show: boolean;
  snapshots: DiagramSnapshot[];
  activeIndex: number;
  onRestore: (index: number) => void;
  onClose: () => void;
  onClearHistory: () => void;
  onClearAllHistory: () => void;
  theme: ThemeMode;
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function VersionHistoryDialog({
  show,
  snapshots,
  activeIndex,
  onRestore,
  onClose,
  onClearHistory,
  onClearAllHistory,
  theme,
}: VersionHistoryDialogProps) {
  const [expandedSnapshot, setExpandedSnapshot] = useState<string | null>(null);
  const [diffSnapshotId, setDiffSnapshotId] = useState<string | null>(null);

  // Reset expanded/diff state when modal opens
  useEffect(() => {
    if (show) {
      setExpandedSnapshot(null);
      setDiffSnapshotId(null);
    }
  }, [show]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedSnapshot((prev) => (prev === id ? null : id));
    setDiffSnapshotId(null);
  }, []);

  const toggleDiff = useCallback((id: string) => {
    setDiffSnapshotId((prev) => (prev === id ? null : id));
  }, []);

  const handleRestore = useCallback((index: number) => {
    if (index === activeIndex) return;
    onRestore(index);
    onClose();
  }, [activeIndex, onRestore, onClose]);

  const latestMermaid = activeIndex >= 0 && activeIndex < snapshots.length
    ? snapshots[activeIndex].mermaid
    : '';

  return (
    <Modal show={show} onHide={onClose} centered size="xl" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>📋 Version History</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh' }}>
        {snapshots.length === 0 ? (
          <p className="text-muted mb-0">No version history yet. Make edits or generate with AI to create snapshots.</p>
        ) : (
          <div className="version-history-list">
            {[...snapshots].reverse().map((snapshot, reverseIdx) => {
              const originalIndex = snapshots.length - 1 - reverseIdx;
              const isActive = originalIndex === activeIndex;
              const isExpanded = expandedSnapshot === snapshot.id;
              const showDiff = diffSnapshotId === snapshot.id;

              return (
                <div
                  key={snapshot.id}
                  className={`version-card border rounded p-3 mb-2 ${isActive ? 'version-card-active' : ''}`}
                  style={{
                    borderColor: isActive ? 'var(--accent)' : 'var(--surface-border)',
                    backgroundColor: isActive ? 'var(--accent-light)' : 'var(--surface-bg)',
                  }}
                >
                  <div className="d-flex align-items-start justify-content-between gap-2">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="badge text-bg-secondary">#{snapshot.id.slice(0, 6)}</span>
                      <span className={`badge ${snapshot.type === 'llm' ? 'text-bg-info' : 'text-bg-secondary'}`}>
                        {snapshot.type === 'llm' ? '🤖 LLM' : '✏️ Manual'}
                      </span>
                      <span className="text-muted small">{formatTime(snapshot.timestamp)}</span>
                      {isActive && <span className="badge text-bg-success">◀ Current</span>}
                    </div>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => toggleDiff(snapshot.id)}
                        disabled={originalIndex === activeIndex || snapshots.length < 2}
                        title="Diff with current"
                      >
                        🔍 Diff
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => toggleExpand(snapshot.id)}
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? '▲' : '▼'}
                      </Button>
                      <Button
                        variant={isActive ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleRestore(originalIndex)}
                        disabled={isActive}
                      >
                        {isActive ? 'Current' : 'Restore'}
                      </Button>
                    </div>
                  </div>

                  {/* Prompt text */}
                  <div className="mt-2 small">
                    <strong>Prompt:</strong>{' '}
                    <span className={snapshot.type === 'manual' ? 'text-muted fst-italic' : ''}>
                      {snapshot.prompt.length > 100
                        ? snapshot.prompt.slice(0, 100) + '...'
                        : snapshot.prompt}
                    </span>
                  </div>

                  {/* Diff view using CodeMirror merge */}
                  {showDiff && latestMermaid && originalIndex !== activeIndex && (
                    <div className="mt-2" style={{ minHeight: '150px' }}>
                      <div className="small fw-semibold mb-1 text-muted">
                        Diff: <span className="text-primary">Snapshot</span> ← → <span className="text-success">Current</span>
                      </div>
                      <MermaidDiffView
                        original={snapshot.mermaid}
                        modified={latestMermaid}
                        theme={theme}
                      />
                    </div>
                  )}

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-2">
                      <div className="row g-2">
                        <div className="col-12">
                          <div className="small fw-semibold mb-1">Mermaid Code:</div>
                          <pre className="version-code-block p-2 rounded mb-0" style={{ fontSize: '12px', maxHeight: '150px', overflow: 'auto' }}>
                            {snapshot.mermaid}
                          </pre>
                        </div>
                        {snapshot.summary && (
                          <div className="col-12">
                            <div className="small fw-semibold mb-1">Summary:</div>
                            <div className="p-2 rounded small" style={{ backgroundColor: 'var(--editor-bg)' }}>
                              {snapshot.summary}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <small className="text-muted me-auto">
          {snapshots.length > 0
            ? `Showing ${snapshots.length} version${snapshots.length > 1 ? 's' : ''} (newest first)`
            : ''}
        </small>
        <Button
          variant="outline-danger"
          size="sm"
          disabled={snapshots.length <= 1}
          onClick={() => {
            if (window.confirm('Are you sure you want to delete all version history except the current version? This cannot be undone.')) {
              setExpandedSnapshot(null);
              setDiffSnapshotId(null);
              onClearHistory();
            }
          }}
        >
          🗑️ Clear All (Keep Current)
        </Button>
        <Button
          variant="danger"
          size="sm"
          disabled={snapshots.length === 0}
          onClick={() => {
            if (window.confirm('Are you sure you want to delete the entire version history, including the current version? Your diagram will not be changed. This cannot be undone.')) {
              setExpandedSnapshot(null);
              setDiffSnapshotId(null);
              onClearAllHistory();
            }
          }}
        >
          🗑️ Clear Everything
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}