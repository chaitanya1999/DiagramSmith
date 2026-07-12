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
  | 'sankey';

export type ThemeMode = 'dark' | 'light';

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface DiagramState {
  currentMermaid: string;
  isLoading: boolean;
  error: string | null;
}

export type ViewMode = 'diagram-only' | 'split';

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
};