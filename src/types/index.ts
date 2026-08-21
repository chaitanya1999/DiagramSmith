export type DiagramType =
  | 'flowchart'
  | 'sequenceDiagram'
  | 'classDiagram'
  | 'stateDiagram-v2'
  | 'erDiagram'
  | 'gantt'
  | 'pie'
  | 'gitgraph'
  | 'journey'
  | 'mindmap'
  | 'timeline'
  | 'sankey'
  | 'swimlane'
  | 'quadrantChart'
  | 'requirement'
  | 'c4'
  | 'xychart'
  | 'block'
  | 'packet'
  | 'kanban'
  | 'architecture'
  | 'radar'
  | 'eventmodeling'
  | 'treemap'
  | 'venn'
  | 'ishikawa'
  | 'wardley'
  | 'cynefin'
  | 'treeView';

export type ThemeMode = 'dark' | 'light';

export type LlmMode = 'action' | 'ask';

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  sendAuthorization: boolean;
}

export interface LlmInteraction {
  mode: LlmMode;
  prompt: string;
  response: string;
  timestamp: number;
}

export interface DiagramState {
  currentMermaid: string;
  isLoading: boolean;
  error: string | null;
}

export interface DiagramDocument {
  mermaid: string;
  summary: string;
}

export type ViewMode = 'diagram-only' | 'split';

export type SnapshotType = 'manual' | 'llm';

export interface DiagramSnapshot {
  id: string;
  timestamp: number;
  type: SnapshotType;
  prompt: string;
  mermaid: string;
  summary: string;
}

export interface VersionHistory {
  snapshots: DiagramSnapshot[];
  activeIndex: number;
}

/**
 * The `.dsmith.json` payload. `version` is what distinguishes it from the original
 * two-field format, which had no such marker — see `parseProjectFile`.
 */
export interface DiagramProjectFile {
  version: number;
  exportedAt: string;
  mermaid: string;
  summary: string;
  diagramType: DiagramType;
  versionHistory: VersionHistory;
}

export const DIAGRAM_DISPLAY_NAMES: Record<DiagramType, string> = {
  flowchart: 'Flowchart',
  sequenceDiagram: 'Sequence',
  classDiagram: 'Class',
  'stateDiagram-v2': 'State',
  erDiagram: 'ER',
  gantt: 'Gantt',
  pie: 'Pie',
  gitgraph: 'Git',
  journey: 'Journey',
  mindmap: 'Mindmap',
  timeline: 'Timeline',
  sankey: 'Sankey',
  swimlane: 'Swimlanes',
  quadrantChart: 'Quadrant',
  requirement: 'Requirement',
  c4: 'C4',
  xychart: 'XY Chart',
  block: 'Block',
  packet: 'Packet',
  kanban: 'Kanban',
  architecture: 'Architecture',
  radar: 'Radar',
  eventmodeling: 'Event Modeling',
  treemap: 'Treemap',
  venn: 'Venn',
  ishikawa: 'Ishikawa',
  wardley: 'Wardley',
  cynefin: 'Cynefin',
  treeView: 'TreeView',
};

export const DIAGRAM_ICONS: Record<DiagramType, string> = {
  flowchart: '🔀',
  sequenceDiagram: '⏩',
  classDiagram: '🏛️',
  'stateDiagram-v2': '⚡',
  erDiagram: '🔗',
  gantt: '📊',
  pie: '🥧',
  gitgraph: '🌿',
  journey: '🗺️',
  mindmap: '🧠',
  timeline: '📅',
  sankey: '🔀',
  swimlane: '🏊',
  quadrantChart: '🎯',
  requirement: '📋',
  c4: '🏗️',
  xychart: '📈',
  block: '🧱',
  packet: '📦',
  kanban: '📋',
  architecture: '🏛️',
  radar: '📡',
  eventmodeling: '🕰️',
  treemap: '🌳',
  venn: '⭕',
  ishikawa: '🐟',
  wardley: '🗺️',
  cynefin: '🌀',
  treeView: '🌲',
};