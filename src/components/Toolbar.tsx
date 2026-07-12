import { useCallback, useRef, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import type { DiagramType } from '../types';
import { DIAGRAM_DISPLAY_NAMES, DIAGRAM_ICONS } from '../types';
import { ALL_DIAGRAM_TYPES } from '../utils/constants';

interface ToolbarProps {
  isSplitView: boolean;
  isDark: boolean;
  diagramType: DiagramType;
  onToggleSplitView: () => void;
  onOpenSettings: () => void;
  onNewDiagram: (type: DiagramType) => void;
  onExportMermaid: () => void;
  onCopyMermaid: () => void;
  onImportMermaid: (content: string) => Promise<boolean>;
  onToggleTheme: () => void;
}

export function Toolbar({
  isSplitView,
  isDark,
  diagramType,
  onToggleSplitView,
  onOpenSettings,
  onNewDiagram,
  onExportMermaid,
  onCopyMermaid,
  onImportMermaid,
  onToggleTheme,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const success = await onImportMermaid(text);
        if (!success) {
          alert('Invalid Mermaid diagram file.');
        }
      } catch {
        alert('Failed to read file.');
      }

      e.target.value = '';
    },
    [onImportMermaid]
  );

  return (
    <div className="toolbar d-flex align-items-center gap-2 px-3 py-2 border-bottom">
      <span className="fw-bold text-primary me-2 fs-5">DiagramSmith</span>

      <div className="vr" />

      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={onToggleSplitView}
        title={isSplitView ? 'Switch to diagram view' : 'Switch to split view'}
      >
        {isSplitView ? '📐 Diagram' : '✂️ Split'}
      </button>

      <div className="vr" />

      {/* Diagram Type Dropdown Button */}
      <Dropdown show={showDropdown} onToggle={setShowDropdown}>
        <Dropdown.Toggle
          variant="outline-secondary"
          size="sm"
          id="diagram-type-dropdown"
          className="d-flex align-items-center gap-1"
        >
          <span>{DIAGRAM_ICONS[diagramType]}</span>
          <span>{DIAGRAM_DISPLAY_NAMES[diagramType]}</span>
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {ALL_DIAGRAM_TYPES.map((dt) => (
            <Dropdown.Item
              key={dt}
              active={dt === diagramType}
              onClick={() => {
                onNewDiagram(dt);
                setShowDropdown(false);
              }}
            >
              <span className="me-2">{DIAGRAM_ICONS[dt]}</span>
              {DIAGRAM_DISPLAY_NAMES[dt]}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>

      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={handleImportClick}
        title="Import Mermaid from .mmd file"
      >
        📥 Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".mmd,.txt"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={onCopyMermaid}
        title="Copy Mermaid code"
      >
        📋 Copy
      </button>

      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={onExportMermaid}
        title="Export as .mmd file"
      >
        💾 Export
      </button>

      <div className="ms-auto d-flex align-items-center gap-2">
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={onToggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={onOpenSettings}
          title="Settings"
        >
          ⚙️
        </button>
      </div>
    </div>
  );
}