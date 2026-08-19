import type { LlmConfig, DiagramType } from '../types';
import { DIAGRAM_SYNTAX_GUIDES, DIAGRAM_RULES } from './diagramSyntax';

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
      text: "the test text."
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
    Product Defect
    Materials
      Bad raw material
    Methods
      Poor process
    Machines
      Old equipment
    People
      Lack of training`,
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

export interface SystemPromptOptions {
  includeSummary?: boolean;
  generateSummary?: boolean;
  includeSyntaxGuide?: boolean;
  /** null when the type could not be determined — see tryGetDiagramType. */
  diagramType: DiagramType | null;
}

/**
 * Rules that hold for every diagram type.
 *
 * Type-specific constraints (quoting, identifier form, indentation sensitivity)
 * live in DIAGRAM_RULES instead, because they genuinely differ per type: pie
 * requires quoted labels, sankey forbids quotes, and ishikawa has no identifiers
 * at all. A blanket quoting rule here contradicted both the shipped templates and
 * several syntax guides, which pushed the model into rewriting whole diagrams.
 *
 * Division of labour: these rules say what to PRESERVE in the existing diagram;
 * DIAGRAM_RULES says how to WRITE anything new. Keep it that way — restating a
 * preservation rule per type only dilutes the prompt.
 */
const BASE_RULES = `Rules:
- The first line of the code is the diagram type declaration (e.g., flowchart TD, sequenceDiagram, classDiagram).
- Do NOT change the diagram type unless the user explicitly asks to.
- Modify the existing Mermaid diagram only.
- Preserve existing identifiers, labels, quoting, indentation and line order unless the instruction requires changing them.
- Make the smallest possible changes to satisfy the request.
- Never use Markdown code fences.
- Never explain the changes.
- Never wrap the output in any formatting.`;

/**
 * Composes the system prompt from a single base of rules plus conditional sections:
 * - summary context (when includeSummary), output format (when generateSummary),
 * - and a diagram-type-specific syntax reference (when includeSyntaxGuide).
 * This eliminates the duplication between the old four static prompt variants.
 */
export function buildSystemPrompt(options: SystemPromptOptions): string {
  const { includeSummary, generateSummary, includeSyntaxGuide, diagramType } = options;
  const parts: string[] = [];

  const summaryAdj = includeSummary ? 'an updated' : 'a';
  if (generateSummary) {
    parts.push(
      `You are DiagramSmith, a Mermaid diagram editor. Your task is to modify the existing Mermaid diagram based on the user's instructions, and also provide ${summaryAdj} text summary of the diagram.

You MUST output TWO things separated by the delimiter "${SUMMARY_DELIMITER}":
1. The updated Mermaid diagram code
2. ${includeSummary ? 'An updated' : 'A plain'} text summary describing what the diagram represents, its key components, and the flow/logic it illustrates`
    );
  } else {
    parts.push(
      `You are DiagramSmith, a Mermaid diagram editor. Your task is to modify the existing Mermaid diagram based on the user's instructions.`
    );
  }

  if (includeSummary && !generateSummary) {
    parts.push(
      `You will also receive a text summary of the diagram. Use it to better understand the diagram's purpose and meaning.`
    );
  }

  if (includeSummary && generateSummary) {
    parts.push(
      `You will receive:
- The current Mermaid diagram code
- The current text summary of the diagram
- The user's instruction

Use the current text summary to better understand the diagram's purpose and meaning.`
    );
  }

  // When the type is unknown, assert nothing and inject nothing type-specific:
  // a confidently wrong type is worse for the model than no type at all.
  if (diagramType && includeSyntaxGuide) {
    parts.push(
      `The diagram is of type "${diagramType}". Use this syntax reference for that diagram type:

${DIAGRAM_SYNTAX_GUIDES[diagramType]}`
    );
  }

  parts.push(BASE_RULES);

  if (diagramType) {
    parts.push(DIAGRAM_RULES[diagramType]);
  }

  if (generateSummary) {
    parts.push(
      `Output format:
[Mermaid diagram code]
${SUMMARY_DELIMITER}
[${includeSummary ? 'Updated' : 'Text'} summary of the diagram]`
    );
  }

  return parts.join('\n\n');
}

/**
 * Composes the system prompt for ASK mode, where the LLM answers a question
 * about the diagram without modifying it.
 */
export function buildAskSystemPrompt(options: {
  includeSummary?: boolean;
  includeSyntaxGuide?: boolean;
  /** null when the type could not be determined — see tryGetDiagramType. */
  diagramType: DiagramType | null;
}): string {
  const { includeSummary, includeSyntaxGuide, diagramType } = options;
  const parts: string[] = [];

  parts.push(
    `You are DiagramSmith, a Mermaid diagram assistant. Your task is to answer the user's question about the given Mermaid diagram. Do NOT modify the diagram. Do NOT output Mermaid code. Provide a clear, concise, and accurate answer based on the diagram content.`
  );

  if (includeSummary) {
    parts.push(
      `You will also receive a text summary of the diagram. Use it to better understand the diagram's purpose and meaning.`
    );
  }

  // Ask mode only reads the diagram, so the write-side DIAGRAM_RULES are not
  // injected here — just the reference guide, and only when the type is known.
  if (diagramType && includeSyntaxGuide) {
    parts.push(
      `The diagram is of type "${diagramType}". Use this syntax reference for that diagram type to help you interpret the diagram:

${DIAGRAM_SYNTAX_GUIDES[diagramType]}`
    );
  }

  parts.push(
    `Rules:
- Answer the user's question directly.
- Base your answer only on the provided diagram and summary.
- Do NOT modify or regenerate the diagram.
- Do NOT use Markdown code fences.
- Keep the answer concise and well-structured.`
  );

  return parts.join('\n\n');
}

export const DEFAULT_LLM_CONFIG: LlmConfig = {
	baseUrl: 'https://api.openai.com/v1',
	apiKey: '',
	model: 'gpt-4o-mini',
	temperature: 0.3,
	maxTokens: 2048,
	sendAuthorization: true,
};

export const STORAGE_KEYS = {
	MERMAID: 'diagramsmith-mermaid',
	LLM_CONFIG: 'diagramsmith-llm-config',
	THEME: 'diagramsmith-theme',
	DIAGRAM_TYPE: 'diagramsmith-diagram-type',
	SUMMARY: 'diagramsmith-summary',
	VERSION_HISTORY: 'diagramsmith-version-history',
	MAX_SNAPSHOTS: 'diagramsmith-max-snapshots',
};

export const REQUEST_TIMEOUT_MS = 300000;

export const DEFAULT_MAX_SNAPSHOTS = 5;

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

/**
 * Diagram directives in match order.
 *
 * IMPORTANT: no directive may appear before another that it is a prefix of,
 * because matching takes the first hit. 'stateDiagram-v2' must precede
 * 'stateDiagram', and 'requirementDiagram' must precede 'requirement'.
 * diagramTypes.test.ts enforces this ordering.
 */
export const DIAGRAM_DIRECTIVES: ReadonlyArray<{ directive: string; type: DiagramType }> = [
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

/**
 * Strips everything Mermaid allows before the diagram directive: a BOM, a YAML
 * frontmatter block, %% comments and %%{init: ...}%% directives, and blank lines.
 *
 * Known limitation: an init directive split across several lines is legal but
 * rare, and this line-based strip leaves its trailing `}%%` behind. Reporting an
 * unknown type there is the correct degradation.
 */
function stripPreamble(mermaidCode: string): string {
	return mermaidCode
		.replace(/^﻿/, '')
		.replace(/^\s*---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/, '')
		.replace(/^(?:[ \t]*(?:%%[^\n]*)?\r?\n)*/, '')
		.trimStart();
}

/**
 * Detects the diagram type, or returns null when it cannot be determined.
 *
 * Prefer this over getDiagramType anywhere a wrong answer is worse than no
 * answer — notably the system prompt, which would otherwise assert a diagram
 * type and inject a syntax guide for a type the diagram is not.
 */
export function tryGetDiagramType(mermaidCode: string): DiagramType | null {
	const firstLine = stripPreamble(mermaidCode).split('\n')[0] || '';
	const lowerFirstLine = firstLine.toLowerCase();
	for (const { directive, type } of DIAGRAM_DIRECTIVES) {
		const lowerDirective = directive.toLowerCase();
		if (!lowerFirstLine.startsWith(lowerDirective)) continue;
		// Require a word boundary so 'graph' does not match 'graphSomething'.
		// Directive suffixes like '-beta' and '-v2' are boundaries, so they still match.
		const next = lowerFirstLine.charAt(lowerDirective.length);
		if (next === '' || !/[a-z0-9_]/.test(next)) return type;
	}
	return null;
}

/**
 * Detects the diagram type, falling back to the default when unknown.
 * For UI surfaces (e.g. the toolbar dropdown) that must display some type.
 */
export function getDiagramType(mermaidCode: string): DiagramType {
	return tryGetDiagramType(mermaidCode) ?? DEFAULT_DIAGRAM_TYPE;
}
