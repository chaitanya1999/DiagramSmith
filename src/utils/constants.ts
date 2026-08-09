import type { LlmConfig, DiagramType } from '../types';

export const DEFAULT_DIAGRAM_TYPE: DiagramType = 'flowchart';

export const SUMMARY_DELIMITER = '---==DIAGRAMSMITH_SUMMARY_BOUNDARY==---';

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
	swimlane: `swimlane-beta LR
    subgraph Order
      place[Place Order]
      pay[Process Payment]
    end
    subgraph Fulfillment
      ship[Ship Items]
      deliver[Deliver]
    end
    place --> pay
    pay --> ship --> deliver`,
	quadrantChart: `quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.57, 0.69]
    Campaign D: [0.78, 0.34]
    Campaign E: [0.40, 0.34]
    Campaign F: [0.35, 0.78]`,
	requirement: `requirementDiagram
    requirement test_req {
      id: 1
      text: the test text.
      risk: high
      verifymethod: test
    }
    element test_entity {
      type: simulation
    }
    test_entity - satisfies -> test_req`,
	c4: `C4Context
    title System Context diagram for Internet Banking System
    Person(customer, "Personal Banking Customer", "A customer of the bank")
    System(bankingSystem, "Internet Banking System", "Allows customers to view information about their bank accounts")
    System_Ext(mailSystem, "E-mail System", "The internal Microsoft Exchange e-mail system")
    Rel(customer, bankingSystem, "Uses")
    Rel_Back(customer, mailSystem, "Sends e-mails to")`,
	xychart: `xychart-beta
    title "Sales Revenue"
    x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
    y-axis "Revenue (in $)" 0 --> 5000
    bar [500, 600, 750, 800, 900, 950, 1000, 1100, 1200, 1300, 1400, 1500]
    line [500, 600, 750, 800, 900, 950, 1000, 1100, 1200, 1300, 1400, 1500]`,
	block: `block-beta
    columns 3
    A["Start"] B["Process"] C["End"]
    A --> B --> C`,
	packet: `packet-beta
    title Packet
    0-15: "Source Port"
    16-31: "Destination Port"
    32-63: "Sequence Number"
    64-95: "Acknowledgment Number"`,
	kanban: `kanban
    column Todo
      task1: Write code
      task2: Review code
    column Doing
      task3: Test feature
    column Done
      task4: Ship it`,
	architecture: `architecture-beta
    group api(cloud)[API]
    service db(database)[Database] in api
    service server(server)[Server] in api
    service client(disk)[Client]
    client:R --> L:server
    server:T --> B:db`,
	radar: `radar-beta
    title Team Skills
    axis frontend["Frontend"], backend["Backend"], devops["DevOps"], testing["Testing"]
    curve teamA["Team A"]{8, 6, 5, 7}
    curve teamB["Team B"]{6, 8, 7, 5}
    max 10
    min 0`,
	eventmodeling: `eventmodeling
	
    tf 01 ui CartUI
    tf 02 cmd AddItem { description: string }
    tf 03 evt ItemAdded`,
	treemap: `treemap-beta
"Products"
    "Electronics"
        "Phones": 50
        "Computers": 30
    "Clothing"
        "Shirts": 40
        "Pants": 40`,
	venn: `venn-beta
    title "Team overlap"
    set Frontend
    set Backend
    union Frontend,Backend["APIs"]`,
	ishikawa: `ishikawa-beta
    title "Root Cause Analysis"
    effect "Product Defect"
    cause "Materials" "Bad raw material"
    cause "Methods" "Poor process"
    cause "Machines" "Old equipment"
    cause "People" "Lack of training"`,
	wardley: `wardley-beta
title Wardley Map
	
anchor Business [0.95, 0.63]
component Cup of Tea [0.79, 0.61]
component Tea [0.63, 0.81]
component Kettle [0.43, 0.35]
	
Business -> Cup of Tea
Cup of Tea -> Tea
Tea -> Kettle`,
	cynefin: `cynefin-beta
title Cynefin Framework
	
complex
"Investigate root cause"
"Run experiments"
	
complicated
"Expert analysis needed"
	
clear
"Known procedure"
	
chaotic
"Crisis response"
	
clear --> chaotic : "Complacency"`,
	treeView: `treeView-beta
    title "File System"
    root "Project"
      "src"
        "components"
          "App.tsx"
        "utils"
          "helpers.ts"
      "public"
        "index.html"`,
};

export const SYSTEM_PROMPT = `You are DiagramSmith, a Mermaid diagram editor. Your task is to modify the existing Mermaid diagram based on the user's instructions.

Rules:
- The first line of the code is the diagram type declaration (e.g., flowchart TD, sequenceDiagram, classDiagram).
- Do NOT change mermaid diagram type unless user explicitly asks to.
- Modify the existing Mermaid diagram only.
- Node IDs must be alphanumeric with underscores without spaces
- Preserve node identifiers whenever possible.
- All node text must be enclosed in double quotes
- Preserve formatting where practical.
- Make the smallest possible changes to satisfy the request.
- Return ONLY the Mermaid syntax.
- Never use Markdown code fences.
- Never explain the changes.
- Never wrap the output in any formatting.
- No spaces inside edge label pipes`;

export const SYSTEM_PROMPT_WITH_SUMMARY = `You are DiagramSmith, a Mermaid diagram editor. Your task is to modify the existing Mermaid diagram based on the user's instructions.

Rules:
- The first line of the code is the diagram type declaration (e.g., flowchart TD, sequenceDiagram, classDiagram).
- Do NOT change mermaid diagram type unless user explicitly asks to.
- Modify the existing Mermaid diagram only.
- Node IDs must be alphanumeric with underscores without spaces
- Preserve node identifiers whenever possible.
- All node text must be enclosed in double quotes
- Preserve formatting where practical.
- Make the smallest possible changes to satisfy the request.
- You will also receive a text summary of the diagram. Use it to better understand the diagram's purpose and meaning.
- Return ONLY the Mermaid syntax.
- Never use Markdown code fences.
- Never explain the changes.
- Never wrap the output in any formatting.
- No spaces inside edge label pipes`;

export const SYSTEM_PROMPT_GENERATE_SUMMARY = `You are DiagramSmith, a Mermaid diagram editor. Your task is to modify the existing Mermaid diagram based on the user's instructions, and also provide a text summary of the diagram.

You MUST output TWO things separated by the delimiter "${SUMMARY_DELIMITER}":
1. The updated Mermaid diagram code
2. A plain text summary describing what the diagram represents, its key components, and the flow/logic it illustrates

Rules:
- The first line of the code is the diagram type declaration (e.g., flowchart TD, sequenceDiagram, classDiagram).
- Do NOT change mermaid diagram type unless user explicitly asks to.
- Modify the existing Mermaid diagram only.
- Node IDs must be alphanumeric with underscores without spaces
- Preserve node identifiers whenever possible.
- All node text must be enclosed in double quotes
- Preserve formatting where practical.
- Make the smallest possible changes to satisfy the request.
- Never use Markdown code fences around the Mermaid syntax.
- Never explain the changes outside the required format.
- No spaces inside edge label pipes

Output format:
[Mermaid diagram code]
${SUMMARY_DELIMITER}
[Text summary of the diagram]`;

export const SYSTEM_PROMPT_GENERATE_SUMMARY_WITH_CONTEXT = `You are DiagramSmith, a Mermaid diagram editor. Your task is to modify the existing Mermaid diagram based on the user's instructions, and also provide an updated text summary of the diagram.

You will receive:
- The current Mermaid diagram code
- The current text summary of the diagram
- The user's instruction

You MUST output TWO things separated by the delimiter "${SUMMARY_DELIMITER}":
1. The updated Mermaid diagram code
2. An updated plain text summary describing what the diagram represents, its key components, and the flow/logic it illustrates

Rules:
- The first line of the code is the diagram type declaration (e.g., flowchart TD, sequenceDiagram, classDiagram).
- Do NOT change mermaid diagram type unless user explicitly asks to.
- Modify the existing Mermaid diagram only.
- Node IDs must be alphanumeric with underscores without spaces
- Preserve node identifiers whenever possible.
- All node text must be enclosed in double quotes
- Preserve formatting where practical.
- Make the smallest possible changes to satisfy the request.
- Use the current text summary to better understand the diagram's purpose and meaning.
- Never use Markdown code fences around the Mermaid syntax.
- Never explain the changes outside the required format.
- No spaces inside edge label pipes

Output format:
[Mermaid diagram code]
${SUMMARY_DELIMITER}
[Updated text summary of the diagram]`;

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
	SUMMARY: 'diagramsmith-summary',
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
	'swimlane',
	'quadrantChart',
	'requirement',
	'c4',
	'xychart',
	'block',
	'packet',
	'kanban',
	'architecture',
	'radar',
	'eventmodeling',
	'treemap',
	'venn',
	'ishikawa',
	'wardley',
	'cynefin',
	'treeView',
];

export function getDiagramType(mermaidCode: string): DiagramType {
	const firstLine = mermaidCode.trim().split('\n')[0] || '';
	const lowerFirstLine = firstLine.toLowerCase();
	const known: Array<{ directive: string; type: DiagramType }> = [
		{ directive: 'flowchart', type: 'flowchart' },
		{ directive: 'graph', type: 'flowchart' },
		{ directive: 'sequenceDiagram', type: 'sequenceDiagram' },
		{ directive: 'classDiagram', type: 'classDiagram' },
		{ directive: 'stateDiagram-v2', type: 'stateDiagram-v2' },
		{ directive: 'stateDiagram', type: 'stateDiagram-v2' },
		{ directive: 'erDiagram', type: 'erDiagram' },
		{ directive: 'gantt', type: 'gantt' },
		{ directive: 'pie', type: 'pie' },
		{ directive: 'gitGraph', type: 'gitgraph' },
		{ directive: 'journey', type: 'journey' },
		{ directive: 'mindmap', type: 'mindmap' },
		{ directive: 'timeline', type: 'timeline' },
		{ directive: 'sankey', type: 'sankey' },
		{ directive: 'swimlane', type: 'swimlane' },
		{ directive: 'quadrantChart', type: 'quadrantChart' },
		{ directive: 'requirementDiagram', type: 'requirement' },
		{ directive: 'requirement', type: 'requirement' },
		{ directive: 'C4Context', type: 'c4' },
		{ directive: 'C4Container', type: 'c4' },
		{ directive: 'C4Component', type: 'c4' },
		{ directive: 'C4Dynamic', type: 'c4' },
		{ directive: 'C4Deployment', type: 'c4' },
		{ directive: 'xychart', type: 'xychart' },
		{ directive: 'block', type: 'block' },
		{ directive: 'packet', type: 'packet' },
		{ directive: 'kanban', type: 'kanban' },
		{ directive: 'architecture', type: 'architecture' },
		{ directive: 'radar', type: 'radar' },
		{ directive: 'eventmodeling', type: 'eventmodeling' },
		{ directive: 'treemap', type: 'treemap' },
		{ directive: 'venn', type: 'venn' },
		{ directive: 'ishikawa', type: 'ishikawa' },
		{ directive: 'wardley', type: 'wardley' },
		{ directive: 'cynefin', type: 'cynefin' },
		{ directive: 'treeView', type: 'treeView' },
	];
	for (const { directive, type } of known) {
		if (lowerFirstLine.startsWith(directive.toLowerCase())) return type;
	}
	return DEFAULT_DIAGRAM_TYPE;
}
