import type { LlmConfig, DiagramType } from '../types';

export const DEFAULT_DIAGRAM_TYPE: DiagramType = 'flowchart';

export const DEFAULT_TEMPLATES: Record<DiagramType, string> = {
  flowchart: `flowchart TD
    A[Start] --> B{Is it?}
    B -->|Yes| C[OK]
    C --> D[Rethink]
    B -->|No| E[End]`,
  sequenceDiagram: `sequenceDiagram
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
    Alice-)John: See you later!`,
  classDiagram: `classDiagram
    class Animal {
        +String name
        +makeSound() void
    }
    class Dog {
        +String breed
        +makeSound() void
    }
    Animal <|-- Dog`,
  'stateDiagram-v2': `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`,
  erDiagram: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`,
  gantt: `gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Design
    Requirements    :done,    des1, 2024-01-06, 2024-01-08
    Prototype       :active,  des2, 2024-01-09, 3d
    section Development
    Frontend        :         dev1, 2024-01-12, 5d
    Backend         :         dev2, 2024-01-12, 5d`,
  pie: `pie title Favorite Fruits
    "Apples" : 45
    "Bananas" : 25
    "Cherries" : 20
    "Dates" : 10`,
  gitgraph: `gitGraph
    commit
    branch feature
    checkout feature
    commit
    commit
    checkout main
    merge feature
    commit`,
  journey: `journey
    title My Workday
    section Morning
      Wake up: 5: Me
      Get ready: 3: Me
    section Afternoon
      Work: 4: Me, Colleague
      Lunch: 3: Me`,
  mindmap: `mindmap
    root((Project))
      Planning
        Tasks
        Timeline
      Development
        Frontend
        Backend
      Testing
        Unit
        Integration`,
  timeline: `timeline
    title Project Milestones
    2023 : Planning
    2024 : Development
    2025 : Launch
    2026 : Growth`,
  sankey: `sankey-beta
    Electricity, Fossil Fuels, 300
    Electricity, Renewable, 200
    Fossil Fuels, Industry, 150
    Fossil Fuels, Transport, 100
    Renewable, Residential, 80`,
};

export const SYSTEM_PROMPT = `You are a Mermaid diagram editor. Your task is to modify the existing Mermaid diagram based on the user's instructions.

Rules:
- The first line of the code is the diagram type declaration (e.g., flowchart TD, sequenceDiagram, classDiagram).
- Modify the existing Mermaid diagram only.
- Preserve node identifiers whenever possible.
- Preserve formatting where practical.
- Make the smallest possible changes to satisfy the request.
- Only change the diagram type if the user explicitly asks for a different type.
- Return ONLY the Mermaid syntax.
- Never use Markdown code fences.
- Never explain the changes.
- Never wrap the output in any formatting.`;

export const DEFAULT_LLM_CONFIG: LlmConfig = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  temperature: 0.3,
  maxTokens: 2048,
};

export const STORAGE_KEYS = {
  MERMAID: 'diagramsmith-mermaid',
  LLM_CONFIG: 'diagramsmith-llm-config',
  THEME: 'diagramsmith-theme',
  DIAGRAM_TYPE: 'diagramsmith-diagram-type',
};

export const REQUEST_TIMEOUT_MS = 30000;

export const ALL_DIAGRAM_TYPES: DiagramType[] = [
  'flowchart',
  'sequenceDiagram',
  'classDiagram',
  'stateDiagram-v2',
  'erDiagram',
  'gantt',
  'pie',
  'gitgraph',
  'journey',
  'mindmap',
  'timeline',
  'sankey',
];

export function getDiagramType(mermaidCode: string): DiagramType {
  const firstLine = mermaidCode.trim().split('\n')[0] || '';
  const known: DiagramType[] = [
    'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram-v2',
    'erDiagram', 'gantt', 'pie', 'gitgraph', 'journey', 'mindmap',
    'timeline', 'sankey',
  ];
  for (const dt of known) {
    if (firstLine.startsWith(dt)) return dt;
  }
  return DEFAULT_DIAGRAM_TYPE;
}