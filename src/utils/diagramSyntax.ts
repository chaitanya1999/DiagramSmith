import type { DiagramType } from '../types';

/**
 * Concise syntax guides for each Mermaid diagram type.
 * These are injected into the system prompt (only for the current diagram type)
 * to help LLMs generate valid syntax for less common diagram types.
 * Keep each guide compact to minimize token usage.
 */
export const DIAGRAM_SYNTAX_GUIDES: Record<DiagramType, string> = {
	flowchart: `FLOWCHART SYNTAX:
- First line: flowchart TD (top-down) or flowchart LR (left-right)
- Nodes: A[text] rectangle, A(text) rounded, A{text} diamond, A((text)) circle, A>text] asymmetric
- Edges: A --> B, A --- B, A -->|label| B, A -.-> B (dotted), A ==> B (thick), A --o B, A --x B
- Subgraphs: subgraph id [Title] ... end
- Example:
  flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[OK]
    B -->|No| D[End]`,

	sequenceDiagram: `SEQUENCE DIAGRAM SYNTAX:
- First line: sequenceDiagram
- Participants: participant Alice, actor John, participant A as Alias
- Messages: Alice->>John: text (solid arrow), Alice-->>John: text (dashed), Alice-)John: text (async), Alice--xJohn: text (lost)
- Activation: activate Alice / deactivate Alice
- Notes: Note over Alice,John: text, Note left of Alice: text
- Blocks: loop text ... end, alt text ... else ... end, opt text ... end
- Example:
  sequenceDiagram
    Alice->>John: Hello
    John-->>Alice: Hi
    Note over Alice,John: Greeting`,

	classDiagram: `CLASS DIAGRAM SYNTAX:
- First line: classDiagram
- Classes: class Name { ... } with one member per line (+publicAttr type, +method() type, -privateAttr)
- Relationships: A <|-- B (inheritance), A *-- B (composition), A o-- B (aggregation), A --> B (dependency), A ..> B (interface)
- Cardinality: "1" *-- "many" B
- Namespaces: namespace Name { class A }
- Example:
  classDiagram
    class Animal {
        +String name
        +makeSound() void
    }
    class Dog {
        +String breed
    }
    Animal <|-- Dog`,

	'stateDiagram-v2': `STATE DIAGRAM SYNTAX:
- First line: stateDiagram-v2
- States: [*] (start/end), StateName, state "Long Name" as shortId
- Transitions: A --> B, A --> B: label
- Composite: state Parent { A --> B }
- Choices: state choice <<choice>>, state fork <<fork>>, state join <<join>>
- Notes: note right of A : text
- Concurrency: -- separator between parallel states inside a composite
- Example:
  stateDiagram-v2
    [*] --> Idle
    Idle --> Running: start
    Running --> [*]: stop`,

	erDiagram: `ER DIAGRAM SYNTAX:
- First line: erDiagram
- Entities: CUSTOMER { string name int age }, alias: CUSTOMER [Customer]
- Relationships: CUSTOMER ||--o{ ORDER : places
- Cardinality: |o (zero/one), || (exactly one), }o (zero/more), }| (one/more)
- Identifying (solid): -- ; non-identifying (dashed): .. (e.g. }|..|{ )
- Keys: PK, FK, UK in attribute braces
- Optional: direction TB/BT/LR/RL
- Example:
  erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER { string name PK }`,

	gantt: `GANTT CHART SYNTAX:
- First line: gantt
- Directives: title Text, dateFormat YYYY-MM-DD, axisFormat %m/%d
- Sections: section Name
- Tasks: TaskName :done, id1, 2024-01-06, 3d (status: done/active/crit, optional milestone)
- Dependencies: after id1, or explicit dates
- Example:
  gantt
    title Project
    dateFormat YYYY-MM-DD
    section Dev
    Code :done, c1, 2024-01-06, 3d
    Test :active, t1, after c1, 2d`,

	pie: `PIE CHART SYNTAX:
- First line: pie
- Optional: title Text, showData
- Data: "Label" : value (value is a number)
- Example:
  pie title Sales
    "Apples" : 45
    "Bananas" : 25`,

	gitgraph: `GITGRAPH SYNTAX:
- First line: gitGraph
- Commands: commit, commit id: "ID" type: HIGHLIGHT, branch name, checkout name, merge name, cherry-pick id
- Options: commit tag: "v1.0"
- Example:
  gitGraph
    commit
    branch feature
    checkout feature
    commit
    checkout main
    merge feature`,

	journey: `JOURNEY DIAGRAM SYNTAX:
- First line: journey
- title Text
- Sections: section Name
- Tasks: Task: score: Actor1, Actor2 (score 0-9)
- Example:
  journey
    title My Day
    section Morning
      Wake up: 5: Me
      Work: 4: Me, Colleague`,

	mindmap: `MINDMAP SYNTAX:
- First line: mindmap
- Root: root((text)), shapes: (text) circle, ((text)) hexagon, [text] square, [[text]] cloud
- Children are indented under parents (2 spaces per level)
- Example:
  mindmap
    root((Project))
      Planning
        Tasks
      Dev
        Frontend`,

	timeline: `TIMELINE SYNTAX:
- First line: timeline
- title Text
- Periods: period Name
- Events: date : event text, or time : event
- Example:
  timeline
    title History
    2023 : Planning
    2024 : Build
    period 2025
      Q1 : Launch`,

	sankey: `SANKEY DIAGRAM SYNTAX:
- First line: sankey-beta
- Data rows: Source, Target, Value (comma-separated, no quotes)
- Example:
  sankey-beta
    Electricity, Fossil Fuels, 300
    Electricity, Renewable, 200
    Fossil Fuels, Industry, 150`,

	swimlane: `SWIMLANE DIAGRAM SYNTAX:
- First line: swimlane-beta LR (or TB)
- Lanes: subgraph LaneName ... end
- Nodes: id[text], id(text), id{text}
- Edges: A --> B, A -->|label| B
- Example:
  swimlane-beta LR
    subgraph Order
      place[Place Order]
    end
    subgraph Fulfillment
      ship[Ship]
    end
    place --> ship`,

	quadrantChart: `QUADRANT CHART SYNTAX:
- First line: quadrantChart
- title Text
- Axes: x-axis Low --> High, y-axis Low --> High
- Quadrants: quadrant-1 Text, quadrant-2 Text, quadrant-3 Text, quadrant-4 Text
- Points: Name: [x, y] (values 0-1)
- Example:
  quadrantChart
    title Campaigns
    x-axis Low --> High
    y-axis Low --> High
    quadrant-1 Expand
    quadrant-2 Promote
    Campaign A: [0.3, 0.6]`,

	requirement: `REQUIREMENT DIAGRAM SYNTAX:
- First line: requirementDiagram
- Blocks: requirement name { ... } and element name { ... }, with one field per line (the single-line brace form does NOT parse)
- Requirement fields: id, text, risk (low/medium/high), verifymethod (analysis/inspection/test/demonstration)
- Element fields: type, docref
- Relations: element - satisfies -> requirement, requirement - verifies -> element, element - contains -> element
- Example:
  requirementDiagram
    requirement req1 {
      id: 1
      text: "must work"
      risk: high
      verifymethod: test
    }
    element el1 {
      type: simulation
    }
    el1 - satisfies -> req1`,

	c4: `C4 DIAGRAM SYNTAX:
- First line: C4Context (or C4Container, C4Component, C4Dynamic, C4Deployment)
- title Text
- Elements: Person(id, "Label", "Desc"), System(id, "Label", "Desc"), System_Ext(...), Container(...), Component(...), Rel(id1, id2, "Label")
- Relations: Rel, Rel_Back, Rel_Neighbor, BiRel
- Example:
  C4Context
    title System Context
    Person(user, "User", "A user")
    System(sys, "System", "Main system")
    Rel(user, sys, "Uses")`,

	xychart: `XY CHART SYNTAX:
- First line: xychart-beta
- title "Text"
- Axes: x-axis [a, b, c] or x-axis "Label" [1, 2, 3], y-axis "Label" 0 --> 100
- Series: bar [1, 2, 3], line [1, 2, 3]
- Example:
  xychart-beta
    title "Revenue"
    x-axis [jan, feb, mar]
    y-axis "USD" 0 --> 100
    bar [50, 60, 75]
    line [50, 60, 75]`,

	block: `BLOCK DIAGRAM SYNTAX:
- First line: block-beta
- columns N (grid layout)
- Blocks: A["Text"], A("Text"), A{"Text"}, A[("Text")]
- Block width: A["Text"]:N (span N columns); space or space:N for empty columns
- Composite: block:ID ... end (nested blocks)
- Edges: A --> B, A -->|label| B, A --- B
- Example:
  block-beta
    columns 3
    A["Start"] B["Process"] C["End"]
    A --> B --> C`,

	packet: `PACKET DIAGRAM SYNTAX:
- First line: packet-beta
- title Text
- Fields: start-end: "Label" (bit ranges, e.g. 0-15, 16-31) or +N: "Label" (bit count from previous field)
- Single-bit field: N: "Label"
- Example:
  packet-beta
    title TCP Header
    0-15: "Source Port"
    16-31: "Dest Port"
    32-63: "Sequence"`,

	kanban: `KANBAN SYNTAX:
- First line: kanban
- Columns: column Name
- Tasks: taskId: Task text (indented under column)
- Optional: title Text
- Example:
  kanban
    column Todo
      t1: Write code
      t2: Review
    column Done
      t3: Ship`,

	architecture: `ARCHITECTURE DIAGRAM SYNTAX:
- First line: architecture-beta
- Groups: group id(icon)[Label]
- Services: service id(icon)[Label] in groupId
- Icons: cloud, database, server, disk, firewall, browser, mobile, api
- Edges: service1:R --> L:service2 (directions: L/R/T/B)
- Junctions: junction id
- Example:
  architecture-beta
    group api(cloud)[API]
    service db(database)[DB] in api
    service client(browser)[Client]
    client:R --> L:db`,

	radar: `RADAR CHART SYNTAX:
- First line: radar-beta
- title Text
- Axes: axis name1["Label"], name2["Label"]
- Curves: curve name["Label"]{v1, v2, v3}
- Optional: max N, min N
- Example:
  radar-beta
    title Skills
    axis frontend["FE"], backend["BE"], devops["Ops"]
    curve teamA["Team A"]{8, 6, 5}
    max 10
    min 0`,

	eventmodeling: `EVENT MODELING SYNTAX:
- First line: eventmodeling
- Time frames: tf NN type Name (compact) or timeframe NN type Name (relaxed)
- NN is a unique sequence number (2+ digits)
- Entity types: ui (UI), pcr/processor (Processor), cmd/command (Command), evt/event (Event), rmo/readmodel (Read Model)
- Inline data: { field: type } on the same line; data blocks: [[id]] reference
- Reset frame: rf NN type Name (breaks inferred relations)
- Example:
  eventmodeling
    tf 01 ui CartUI
    tf 02 cmd AddItem { description: string }
    tf 03 evt ItemAdded`,

	treemap: `TREEMAP SYNTAX:
- First line: treemap-beta
- Nested quoted labels with indentation
- Leaf nodes: "Label": value
- Example:
  treemap-beta
    "Products"
      "Electronics"
        "Phones": 50
        "Computers": 30
      "Clothing"
        "Shirts": 40`,

	venn: `VENN DIAGRAM SYNTAX:
- First line: venn-beta
- title "Text"
- Sets: set Name (or set A["Label"] for a display label)
- Overlaps: union A,B["Label"] (two or more set names; sets must be defined first)
- Optional size: :N suffix on a set/union (e.g. set A["Alpha"]:20)
- Text nodes: indented text Name["Label"] under a set or union
- Example:
  venn-beta
    title "Overlap"
    set Frontend["FE"]
    set Backend["BE"]
    union Frontend,Backend["Fullstack"]:3`,

	ishikawa: `ISHIKAWA (FISHBONE) SYNTAX:
- First line: ishikawa-beta
- The first line after the directive is the problem/event (the fish head)
- Subsequent lines are causes; indentation depth defines the fishbone hierarchy (deeper = sub-cause)
- No keywords like effect/cause are used — just indented text lines
- Example:
  ishikawa-beta
    Blurry Photo
    Process
      Out of focus
      Shutter speed too slow
    User
      Shaky hands
    Equipment
      LENS
        Dirty lens`,

	wardley: `WARDLEY MAP SYNTAX:
- First line: wardley-beta
- title Text
- anchor Name [x, y] (x: evolution 0-1, y: visibility 0-1)
- component Name [x, y]
- Edges: A -> B
- Optional: map axis labels (e.g. map "Genesis" 0.0 --> "Commodity" 1.0)
- Example:
  wardley-beta
    title Map
    anchor Business [0.95, 0.63]
    component Tea [0.63, 0.81]
    Business -> Tea`,

	cynefin: `CYNEFIN SYNTAX:
- First line: cynefin-beta
- title Text
- Domains: clear, complicated, complex, chaotic, confused (as section headers)
- Items: "Text" (indented under a domain)
- Edges: domain1 --> domain2 : "Label" (also ==> thick, ..> dotted)
- Example:
  cynefin-beta
    title Framework
    clear
    "Known procedure"
    complex
    "Run experiments"
    clear --> complex : "Complacency"`,

	treeView: `TREE VIEW SYNTAX:
- First line: treeView-beta
- title "Text"
- root "Label" (first node)
- Children indented under parents (2 spaces per level)
- Example:
  treeView-beta
    title "File System"
    root "Project"
      "src"
        "components"
          "App.tsx"
      "public"
        "index.html"`,
};

/**
 * Per-diagram-type correctness rules, injected into every system prompt for the
 * detected diagram type.
 *
 * These are deliberately separate from DIAGRAM_SYNTAX_GUIDES above:
 *   - DIAGRAM_RULES are constraints the model must obey and are ALWAYS injected.
 *   - DIAGRAM_SYNTAX_GUIDES are optional reference material, injected only when
 *     the "Include Syntax Guide" toggle is on.
 *
 * Quoting conventions differ per diagram type (pie requires quotes, sankey forbids
 * them, flowchart tolerates either), so a single global quoting rule cannot be
 * correct — that contradiction is what these entries exist to remove.
 *
 * Each entry must be satisfied by DEFAULT_TEMPLATES[type] and by this file's
 * syntax-guide example for the same type. Derive the rules from those; never
 * write a rule the shipped examples violate.
 *
 * Scope: describe how to WRITE new content for this type. Preserving what the
 * diagram already contains is BASE_RULES' job — do not restate it here.
 */
export const DIAGRAM_RULES: Record<DiagramType, string> = {
	flowchart: `FLOWCHART RULES:
- Node IDs are alphanumeric/underscore with no spaces. Reuse existing IDs exactly; never rename or renumber them.
- Quote new node text only if it contains [ ] { } ( ) " or a colon.
- Edge label pipes take no padding spaces: -->|Yes| not --> | Yes |`,

	sequenceDiagram: `SEQUENCE DIAGRAM RULES:
- Participant names are bare identifiers; reuse existing spellings exactly.
- Message text after the colon is plain unquoted text.
- Every block opener (loop, alt, opt, par, critical) needs a matching end.`,

	classDiagram: `CLASS DIAGRAM RULES:
- Class names are bare identifiers; reuse existing names exactly.
- Keep one member per line inside a class body. Do NOT collapse a multi-line class onto one line.
- Preserve existing visibility prefixes (+ - # ~) and member order.`,

	'stateDiagram-v2': `STATE DIAGRAM RULES:
- State names are bare identifiers; [*] is the start/end pseudo-state. Reuse existing names exactly.
- Quote text only in the state "Long Name" as id form; transition labels after the colon are unquoted.
- Every composite state block needs a matching closing brace.`,

	erDiagram: `ER DIAGRAM RULES:
- Entity names are bare and unquoted, and may contain hyphens (e.g. LINE-ITEM). Reuse existing casing exactly.
- Relationship labels after the colon are unquoted.
- Keep cardinality glyphs (||, |o, }o, }|) exactly as written; do not substitute equivalents.`,

	gantt: `GANTT RULES:
- All text is unquoted, including title, section names and task names.
- Task IDs must stay unique, and existing IDs must be reused because dependencies reference them by name.
- Dates must match the declared dateFormat. Preserve the existing column alignment of task lines.`,

	pie: `PIE RULES:
- Every label MUST be double-quoted: "Label" : number
- Values are plain numbers — no units, thousands separators or percent signs.`,

	gitgraph: `GITGRAPH RULES:
- Branch and checkout names are bare identifiers; reuse existing branch names exactly.
- Only id:, tag: and type: values are quoted (commit id: "A1" tag: "v1.0"); commands themselves are bare.
- A branch must be created before it is checked out or merged; keep commands in chronological order.`,

	journey: `JOURNEY RULES:
- All text is unquoted. Task lines are: Task name: score: Actor1, Actor2 (score 0-9).
- Tasks are indented under their section; indentation defines membership, so never re-indent existing lines.`,

	mindmap: `MINDMAP RULES:
- Indentation depth alone defines the hierarchy. Never change the indentation of existing lines.
- Node text is bare; quote only if it contains ( ) [ ] or a colon.
- There is exactly one root node.`,

	timeline: `TIMELINE RULES:
- All text is unquoted. Event lines are: period : event text
- Line order is chronological order; do not reorder existing entries.`,

	sankey: `SANKEY RULES:
- Every data line is exactly: Source, Target, Value — comma-separated and unquoted.
- Value must be a number.
- Node names are their literal text, so reuse existing spellings exactly; identical text means the same node.`,

	swimlane: `SWIMLANE RULES:
- Node IDs are alphanumeric/underscore with no spaces. Reuse existing IDs exactly.
- Quote new node text only if it contains [ ] { } ( ) " or a colon.
- Edge label pipes take no padding spaces: -->|Yes| not --> | Yes |
- Every subgraph (lane) needs a matching end.`,

	quadrantChart: `QUADRANT CHART RULES:
- All text is unquoted, including point names, which may contain spaces (Campaign A: [0.3, 0.6]).
- Point coordinates are two numbers between 0 and 1.
- Axis lines use the bare "Low --> High" form, not quoted labels.`,

	requirement: `REQUIREMENT DIAGRAM RULES:
- requirement and element names are bare identifiers; reuse existing names exactly.
- Write one field per line inside a block — the single-line brace form does NOT parse.
- Only the text: value is quoted; id:, risk:, verifymethod: and type: values are bare.
- risk must be low, medium or high; verifymethod must be analysis, inspection, test or demonstration.`,

	c4: `C4 RULES:
- The first argument of every element is a bare id; all label and description arguments MUST be double-quoted.
- Reuse existing ids exactly, because Rel(...) references them.
- Keep each element on a single line.`,

	xychart: `XY CHART RULES:
- The title and axis labels are double-quoted; category tokens inside x-axis [...] are bare.
- Every data series must have exactly as many values as there are x-axis categories.
- Values are plain numbers.`,

	block: `BLOCK DIAGRAM RULES:
- Block text MUST be double-quoted inside the brackets: A["Text"]
- Block IDs are bare alphanumeric/underscore; reuse existing IDs exactly.
- Keep the columns N value consistent with the intended row width; use space for empty cells.`,

	packet: `PACKET DIAGRAM RULES:
- Field labels MUST be double-quoted; the title is unquoted.
- Bit ranges must be contiguous, non-overlapping and in ascending order.`,

	kanban: `KANBAN RULES:
- All text is unquoted. Task lines are: taskId: Task text, indented under their column.
- Task IDs must stay unique; reuse existing IDs exactly.
- Indentation defines column membership; never re-indent existing lines.`,

	architecture: `ARCHITECTURE RULES:
- Service and group IDs are bare alphanumeric/underscore; reuse existing IDs exactly.
- Labels in square brackets are unquoted; the icon in parentheses must be a supported icon name.
- Edges must name a side at both ends: serviceA:R --> L:serviceB`,

	radar: `RADAR CHART RULES:
- The title is unquoted; axis and curve display labels in square brackets MUST be double-quoted.
- Axis and curve keys are bare identifiers; reuse existing keys exactly.
- Every curve must have exactly as many values as there are axes.`,

	eventmodeling: `EVENT MODELING RULES:
- All names are bare and unquoted. Frame lines are: tf NN type Name
- NN is a unique two-digit sequence number; keep frames in ascending order and never renumber existing ones.
- type must be one of ui, cmd/command, evt/event, rmo/readmodel, pcr/processor.`,

	treemap: `TREEMAP RULES:
- Every label MUST be double-quoted. Leaf nodes carry a value: "Label": 50
- Indentation defines the hierarchy; never change the indentation of existing lines.
- Only leaf nodes carry values; parent nodes must not.`,

	venn: `VENN DIAGRAM RULES:
- Set names are bare identifiers; the title and any ["Display Label"] MUST be double-quoted.
- A union may only reference sets already defined above it; reuse existing set names exactly.`,

	ishikawa: `ISHIKAWA RULES:
- There are no identifiers, no quotes and no keywords — every line is plain text.
- The first line after the directive is the problem statement; every later line is a cause.
- Indentation depth alone defines the hierarchy; never change the indentation of existing lines.`,

	wardley: `WARDLEY MAP RULES:
- Component and anchor names are unquoted and may contain spaces (component Cup of Tea [0.79, 0.61]).
- Coordinates are two numbers between 0 and 1 in square brackets.
- Edges use -> and must reference names exactly as declared above.`,

	cynefin: `CYNEFIN RULES:
- Domain headers (clear, complicated, complex, chaotic, confused) are bare keywords on their own line.
- Item text and edge labels MUST be double-quoted; the title is unquoted.
- Items belong to the domain header above them; do not move items between domains.`,

	treeView: `TREE VIEW RULES:
- Every label MUST be double-quoted, including the title and root.
- There is exactly one root node.
- Indentation defines the hierarchy; never change the indentation of existing lines.`,
};