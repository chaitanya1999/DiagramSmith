import { useCallback, useRef, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import type { DiagramType } from '../types';
import { DIAGRAM_DISPLAY_NAMES, DIAGRAM_ICONS } from '../types';
import { ALL_DIAGRAM_TYPES } from '../utils/constants';

interface ToolbarProps {
  isSplitView: boolean;
  isDark: boolean;
  diagramType: DiagramType;
  wordWrap: boolean;
  onToggleSplitView: () => void;
  onToggleWordWrap: () => void;
  onOpenSettings: () => void;
  onNewDiagram: (type: DiagramType) => void;
  onExportMermaid: () => void;
  onExportProject: () => void;
  onCopyMermaid: () => void;
  onImportMermaid: (content: string) => Promise<boolean>;
  onImportProject: (content: string) => Promise<boolean>;
  onToggleTheme: () => void;
}

export function Toolbar({
  isSplitView,
  isDark,
  diagramType,
  wordWrap,
  onToggleSplitView,
  onToggleWordWrap,
  onOpenSettings,
  onNewDiagram,
  onExportMermaid,
  onExportProject,
  onCopyMermaid,
  onImportMermaid,
  onImportProject,
  onToggleTheme,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDiagramDropdown, setShowDiagramDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();

        // Try to detect if it's a .dsmith.json project file
        let success = false;
        if (file.name.endsWith('.dsmith.json') || file.name.endsWith('.json')) {
          try {
            const parsed = JSON.parse(text);
            if (parsed && typeof parsed.mermaid === 'string') {
              success = await onImportProject(text);
              if (success) return;
            }
          } catch {
            // Not a JSON project file, fall through to .mmd import
          }
        }

        // Fall back to .mmd import
        success = await onImportMermaid(text);
        if (!success) {
          alert('Invalid Mermaid diagram file.');
        }
      } catch {
        alert('Failed to read file.');
      }

      e.target.value = '';
    },
    [onImportMermaid, onImportProject]
  );

  return (
    <div className="toolbar d-flex align-items-center gap-2 px-3 py-2 border-bottom">
      <span className="app-title me-2 fs-5 fw-bold">✨ DiagramSmith</span>

      <div className="vr" />

      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={onToggleSplitView}
        title={isSplitView ? 'Switch to diagram view' : 'Switch to split view'}
      >
        {isSplitView ? '📐 Diagram' : '✂️ Split'}
      </button>

      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={onToggleWordWrap}
        title={wordWrap ? 'Disable word wrap' : 'Enable word wrap'}
      >
        {wordWrap ? '↩ Wrap' : '↩ No Wrap'}
      </button>

      <div className="vr" />

      {/* Diagram Type Dropdown Button */}
      <Dropdown show={showDiagramDropdown} onToggle={setShowDiagramDropdown}>
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
                setShowDiagramDropdown(false);
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
        title="Import from .mmd or .dsmith.json file"
      >
        📥 Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".mmd,.txt,.json,.dsmith.json"
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

      {/* Export Dropdown Button */}
      <Dropdown show={showExportDropdown} onToggle={setShowExportDropdown}>
        <Dropdown.Toggle
          variant="outline-secondary"
          size="sm"
          id="export-dropdown"
          className="d-flex align-items-center gap-1"
        >
          💾 Export
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item
            onClick={() => {
              onExportMermaid();
              setShowExportDropdown(false);
            }}
          >
            <span className="me-2">📄</span>
            Export .mmd
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => {
              onExportProject();
              setShowExportDropdown(false);
            }}
          >
            <span className="me-2">📦</span>
            Export Project (.dsmith.json)
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

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