import type { DiagramType } from '../types';

/**
 * Concise syntax guides for each Mermaid diagram type.
 * These are injected into the system prompt (only for the current diagram type)
 * to help LLMs generate valid syntax for less common diagram types.
 * Keep each guide compact to minimize token usage.
 */
export const DIAGRAM_SYNTAX_GUIDES: Record<DiagramType, string> = {
	flowchart: `FLOWCHART SYNTAX:
- First line: flowchart DIR (graph is an alias). DIR: TD or TB top-down, BT bottom-up, LR left-right, RL right-left
- Nodes: A[text] rectangle, A(text) rounded, A([text]) stadium, A[[text]] subroutine, A[(text)] database/cylinder, A((text)) circle, A(((text))) double circle, A>text] asymmetric, A{text} diamond, A{{text}} hexagon, A[/text/] parallelogram, A[\\text\\] parallelogram alt, A[/text\\] trapezoid, A[\\text/] trapezoid alt
- More shapes (no bracket form; use A@{ shape: name, label: "text" }): sm-circ (small start), fr-circ (stop), f-circ (junction), cross-circ (summary), datastore, text (text block), notch-rect (card), lin-rect (lined process), div-rect (divided process), st-rect (multi-process), tag-rect (tagged process), sl-rect (manual input), bow-rect (stored data), doc (document), lin-doc (lined document), docs (multi-document), tag-doc (tagged document), h-cyl (direct access storage), lin-cyl (disk storage), curv-trap (display), delay, tri (extract), flip-tri (manual file), win-pane (internal storage), notch-pent (loop limit), flag (paper tape), bolt (com link), hourglass (collate), fork (fork/join bar), brace / brace-r / braces (comment)
- Text: A["text with (special) chars"], entity codes #quot; #35; #9829;, Markdown A["\`**bold** *italic*\`"] (a newline inside the backticks is a line break)
- Edges: A --> B arrow, A --- B line, A -.-> B dotted, A ==> B thick, A ~~~ B invisible (layout only), A --o B circle end, A --x B cross end, A <--> B / A o--o B / A x--x B both ends
- Edge labels: A -->|text| B, or inline A -- text --> B, A -. text .-> B, A == text ==> B
- Longer edge (spans more ranks): repeat the - . or = character: A ---> B, A -..-> B, A ===> B, A -- text ---> B
- Chaining: A --> B --> C; A & B --> C & D links every pair
- Edge IDs: A e1@--> B, then e1@{ animate: true }, e1@{ animation: fast } (or slow), e1@{ curve: linear } (also basis, bumpX, bumpY, cardinal, catmullRom, monotoneX, monotoneY, natural, step, stepAfter, stepBefore)
- Subgraphs: subgraph id [Title] ... end. Edges may link to a subgraph id. direction TB/LR/BT/RL inside a subgraph is ignored if its nodes link outside it
- Styling: style A fill:#f9f,stroke:#333,stroke-width:2px; classDef name fill:#f96,color:#fff; class A,B name; inline A:::name; classDef default ... styles all nodes; linkStyle 0,2 stroke:#f00 (edges numbered from 0 in order of appearance) or linkStyle default ...; escape commas inside a value as \\,
- Links: click A href "https://example.com" "tooltip" _blank (JavaScript callbacks are disabled)
- Comments: %% text, on its own line
- Example:
  flowchart TD
    A([Start]) --> B{Decision}
    B -->|Yes| C@{ shape: doc, label: "Report" }
    B -- No --> D[(Archive)]
    classDef done fill:#9f9
    class C done`,

	sequenceDiagram: `SEQUENCE DIAGRAM SYNTAX:
- First line: sequenceDiagram
- Participants: participant Alice, actor John, participant A as Alias. Symbols: participant DB@{ "type": "database" } (also boundary, control, entity, collections, queue), combinable with as Alias
- Messages: A->>B: text. Arrows: -> line, --> dotted line, ->> arrow, -->> dotted arrow, <<->> / <<-->> arrows at both ends, -x / --x cross (lost), -) / --) open arrow (async)
- Half arrowheads: -|\\ top, -|/ bottom (--|\\ and --|/ dotted). Central lifeline: A->>()B, A()->>B
- Activation: activate A / deactivate A, or shorthand A->>+B: text then B-->>-A: text
- Create/destroy: create participant C (or create actor D as Name) on the line before the first message to it; destroy C on the line before its last message
- Grouping: box Aqua Label ... end, box rgb(33,66,99) Label ... end (hex colors are not allowed)
- Notes: Note right of A: text, Note left of A: text, Note over A,B: text
- Blocks (each closed by end): loop text; alt text ... else text; opt text; par text ... and text; critical text ... option text; break text; rect rgb(200, 150, 255) or rgba(...) background
- Numbering: autonumber, or autonumber 10 5 (start, step)
- Actor menus: link A: Label @ https://example.com, or links A: {"Label": "https://example.com"}
- Text: <br/> line break; entity codes #59; (semicolon) #35; (#); comments: %% text on its own line
- Example:
  sequenceDiagram
    Alice->>John: Hello
    John-->>Alice: Hi
    Note over Alice,John: Greeting`,

	classDiagram: `CLASS DIAGRAM SYNTAX:
- First line: classDiagram (optional direction TB/BT/LR/RL on its own line)
- Classes: class Name, class Name["Display label"], class \`Name with spaces\`, generic class Square~T~
- Members: class Name { ... } with one member per line, or one at a time: Name : +member. Methods have parentheses and an optional return type: +area() double
- Visibility prefixes: + public, - private, # protected, ~ package. Suffixes: * abstract, $ static (+area()* double, +count()$ int, String id$)
- Generic types: List~int~, nested List~List~int~~
- Relationships: A <|-- B inheritance, A *-- B composition, A o-- B aggregation, A --> B association, A -- B link, A ..> B dependency, A ..|> B realization, A .. B dashed link. Reverse forms (B --|> A), two-way (A <|--|> B), lollipop interface: bar ()-- Foo
- Labels and cardinality: A "1" --> "*" B : label (1, 0..1, 1..*, *, n, 0..n, 1..n)
- Annotations: <<interface>>, <<abstract>>, <<service>>, <<enumeration>>, as class Shape <<interface>> or as the first line of the class body
- Notes: note "text", note for ClassName "text"
- Namespaces: namespace Name { class A }, namespace Name["Label"] { }, nested namespace blocks or dotted names (namespace Co.Eng { })
- Styling: style A fill:#f9f; classDef name fill:#f96; cssClass "A,B" name; class A:::name
- Links: click A href "https://example.com" "tooltip" (JavaScript callbacks are disabled)
- Comments: %% text on its own line
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
- First line: stateDiagram-v2 (optional direction LR/TB/BT/RL on its own line, also inside a composite)
- States: [*] (start/end), StateName, StateName : description, state "Long Name" as shortId
- Transitions: A --> B, A --> B: label
- Composite: state Parent { [*] --> A ... } (nestable; transitions may target a composite)
- Choices: state choice <<choice>>, state fork <<fork>>, state join <<join>>
- Notes: note right of A : text, or a multi-line note left of A ... end note
- Concurrency: -- separator between parallel states inside a composite
- Styling: classDef name fill:#f00,color:white; class A, B name; or A:::name inside a statement
- Comments: %% text on its own line
- Example:
  stateDiagram-v2
    [*] --> Idle
    Idle --> Running: start
    Running --> [*]: stop`,

	erDiagram: `ER DIAGRAM SYNTAX:
- First line: erDiagram (optional direction TB/BT/LR/RL on its own line)
- Entities: CUSTOMER, "Name With Spaces", display alias p[Person] or a["Customer Account"]
- Attributes: CUSTOMER { ... } with one "type name" per line. Types may be string(99), string[] or string? (optional). Keys after the name: PK, FK, UK, or several (PK, FK). A quoted comment goes last: string email UK "login"
- Relationships: CUSTOMER ||--o{ ORDER : places (quote a multi-word label: "appears in")
- Cardinality (left / right side): |o / o| zero or one, || exactly one, }o / o{ zero or more, }| / |{ one or more
- Identifying (solid): -- ; non-identifying (dashed): .. (e.g. }|..|{ )
- Word forms: CAR 1 to zero or more DRIVER : allows. Words: only one, 1, zero or one, one or more, one or many, 1+, many(1), zero or more, zero or many, 0+, many(0); to = identifying, optionally to = non-identifying
- Styling: style A fill:#f9f; classDef name fill:#f96; class A,B name; A:::name
- Example:
  erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER {
      string name PK
      string email UK
    }`,

	gantt: `GANTT CHART SYNTAX:
- First line: gantt
- Directives: title Text, dateFormat YYYY-MM-DD, axisFormat %m/%d (d3 codes such as %Y %m %d %b %H:%M), tickInterval 1week (N millisecond/second/minute/hour/day/week/month), weekday monday, excludes weekends (or dates or day names; repeatable), weekend friday, todayMarker off (or a style list)
- Sections: section Name
- Tasks: Name :tags, id, start, end. Tags are optional and come first: done, active, crit, milestone, vert (combinable: crit, done). Start: a date, or after id1 [id2 ...]. End: a date, a length, or until id
- Lengths: ms, s, m, h, d, w, M, y (e.g. 3d, 1.5w, 12h). A task with no start begins when the previous task ends
- Milestone: Name :milestone, m1, 2024-01-25, 0d. Vertical marker line: Name :vert, v1, 2024-01-15, 0d
- Links: click id href "https://example.com" (JavaScript callbacks are disabled)
- Comments: %% text on its own line
- Example:
  gantt
    title Project
    dateFormat YYYY-MM-DD
    section Dev
    Code :done, c1, 2024-01-06, 3d
    Test :active, t1, after c1, 2d`,

	pie: `PIE CHART SYNTAX:
- First line: pie, or pie showData to print each value in the legend
- Optional: title Text (may share the first line: pie title Sales)
- Data: "Label" : value (a positive number, up to two decimals); slices are drawn clockwise in order
- Example:
  pie title Sales
    "Apples" : 45
    "Bananas" : 25`,

	gitgraph: `GITGRAPH SYNTAX:
- First line: gitGraph, or with an orientation: gitGraph LR:, gitGraph TB:, gitGraph BT:
- History starts on branch main
- commit, with optional id: "ID", tag: "v1.0" and type: NORMAL / REVERSE / HIGHLIGHT, in any combination
- branch name creates and switches to a branch (optional order: N sets its position); checkout name or switch name changes branch
- merge name merges into the current branch, with the same optional id: tag: type: attributes
- cherry-pick id: "ID" copies a commit from another branch; for a merge commit add parent: "ParentID"
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
- Tasks: Task: score: Actor1, Actor2 (score 1-5, 5 is best)
- Example:
  journey
    title My Day
    section Morning
      Wake up: 5: Me
      Work: 4: Me, Colleague`,

	mindmap: `MINDMAP SYNTAX:
- First line: mindmap
- Root: the first node, e.g. root((text))
- Shapes: id[text] square, id(text) rounded, id((text)) circle, id))text(( bang, id)text( cloud, id{{text}} hexagon; bare text is the default shape
- Markdown: id["\`**bold** *italic*\`"] (a newline inside the backticks is a line break)
- Children are indented under parents (2 spaces per level)
- Example:
  mindmap
    root((Project))
      Planning
        Tasks
      Dev
        Frontend`,

	timeline: `TIMELINE SYNTAX:
- First line: timeline, or timeline LR / timeline TD for direction
- title Text
- Entries: period : event. Several events: period : event1 : event2, or continuation lines that start with : event
- Sections: section Name groups the periods that follow it
- Text: <br> forces a line break
- Example:
  timeline
    title History
    section Early
      2023 : Planning : Research
      2024 : Build
    section Later
      2025 : Launch
           : Marketing`,

	sankey: `SANKEY DIAGRAM SYNTAX:
- First line: sankey-beta
- Data rows: Source, Target, Value (CSV with exactly three columns)
- A field that contains a comma is double-quoted ("Heating, homes"); a quote inside it is doubled ("say ""hi""")
- Empty lines are allowed between rows
- Example:
  sankey-beta
    Electricity, Fossil Fuels, 300
    Electricity, Renewable, 200
    Fossil Fuels, Industry, 150`,

	swimlane: `SWIMLANE DIAGRAM SYNTAX:
- First line: swimlane-beta DIR. DIR: TB (default) or TD top-down, BT bottom-up, LR left-right, RL right-left
- Lanes: top-level subgraph LaneName ... end, or subgraph id [Lane label] ... end
- Nodes use flowchart shapes: id[text], id(text), id([text]) stadium, id{text} decision, id((text)) circle, and the other flowchart shapes
- Edges use flowchart syntax: A --> B, A --- B, A -->|label| B, A -.-> B dotted, A ==> B thick, chaining A --> B --> C
- A node belongs to one lane: the first lane that lists it
- Styling: classDef name fill:#fff2cc,stroke:#d6a500; class id name
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
- Axes: x-axis Left --> Right, y-axis Bottom --> Top (or only the first label: x-axis Low)
- Quadrants: quadrant-1 Text (top right), quadrant-2 Text (top left), quadrant-3 Text (bottom left), quadrant-4 Text (bottom right)
- Points: Name: [x, y] (values 0-1)
- Point styling: Name: [x, y] radius: 10, color: #ff3300, stroke-color: #10f0f0, stroke-width: 5px; or Name:::cls: [x, y] with classDef cls color: #109060, radius: 10
- Example:
  quadrantChart
    title Campaigns
    x-axis Low --> High
    y-axis Low --> High
    quadrant-1 Expand
    quadrant-2 Promote
    Campaign A: [0.3, 0.6]`,

	requirement: `REQUIREMENT DIAGRAM SYNTAX:
- First line: requirementDiagram (optional direction TB/BT/LR/RL on its own line)
- Blocks: KIND name { ... } and element name { ... }, with one field per line (the single-line brace form does NOT parse)
- KIND: requirement, functionalRequirement, interfaceRequirement, performanceRequirement, physicalRequirement, designConstraint
- Requirement fields: id, text, risk (low/medium/high), verifymethod (analysis/inspection/test/demonstration)
- Element fields: type, docRef
- Relations: source - TYPE -> destination, or destination <- TYPE - source. TYPE: contains, copies, derives, satisfies, verifies, refines, traces
- Styling: style name fill:#ffa; classDef cls fill:#f96; class name cls; name:::cls
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
- People and systems: Person(id, "Label", "Desc"), Person_Ext, System(id, "Label", "Desc"), SystemDb, SystemQueue, System_Ext, SystemDb_Ext, SystemQueue_Ext
- Containers and components take a technology before the description: Container(id, "Label", "Tech", "Desc"), with ContainerDb, ContainerQueue, Container_Ext, ContainerDb_Ext, ContainerQueue_Ext; Component(...) has the same variants
- Boundaries wrap their children in { }: Enterprise_Boundary(id, "Label") { ... }, System_Boundary, Container_Boundary, Boundary(id, "Label", "type")
- Deployment: Deployment_Node(id, "Label", "Type", "Desc") { ... }, short forms Node, Node_L, Node_R
- Relations: Rel(from, to, "Label", "Tech"), BiRel, Rel_U / Rel_D / Rel_L / Rel_R, Rel_Back; in C4Dynamic RelIndex(1, from, to, "Label")
- Styling: UpdateElementStyle(id, $bgColor="red", $fontColor="white", $borderColor="red"), UpdateRelStyle(from, to, $textColor="blue", $lineColor="blue", $offsetX="10", $offsetY="-10")
- Layout: shapes are placed in statement order; UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
- Example:
  C4Context
    title System Context
    Person(user, "User", "A user")
    System(sys, "System", "Main system")
    Rel(user, sys, "Uses")`,

	xychart: `XY CHART SYNTAX:
- First line: xychart-beta, or xychart-beta horizontal for horizontal bars
- title "Text" (quotes are needed only when the text has spaces; the same applies to axis titles and categories)
- x-axis: categories x-axis [a, b, "c d"], titled x-axis "Label" [a, b], or a numeric range x-axis "Label" 0 --> 100
- y-axis: y-axis "Label" 0 --> 100, or y-axis "Label" alone to derive the range from the data
- Series: bar [1, 2, 3], line [1, 2, 3]; named series: bar "Sales" [1, 2, 3]; line point labels: line [25 "Launch", 45, 72]
- Example:
  xychart-beta
    title "Revenue"
    x-axis [jan, feb, mar]
    y-axis "USD" 0 --> 100
    bar [50, 60, 75]
    line [50, 60, 75]`,

	block: `BLOCK DIAGRAM SYNTAX:
- First line: block-beta
- columns N (grid layout; blocks fill rows left to right and wrap)
- Blocks: A["Text"] rectangle, A("Text") rounded, A(["Text"]) stadium, A[["Text"]] subroutine, A[("Text")] cylinder, A(("Text")) circle, A((("Text"))) double circle, A>"Text"] asymmetric, A{"Text"} rhombus, A{{"Text"}} hexagon, A[/"Text"/] and A[\\"Text"\\] parallelograms, A[/"Text"\\] and A[\\"Text"/] trapezoids
- Block width: A["Text"]:N (span N columns); space or space:N for empty columns
- Composite: block:ID ... end, or block:ID:N ... end to span N columns; a composite may set its own columns N
- Block arrows: arrow1<["Label"]>(right); directions right, left, up, down, x, y, or a pair like (x, down)
- Edges: A --> B, A --- B, A -->|label| B, A -- "label" --> B
- Styling: style A fill:#636,stroke:#333; classDef blue fill:#66f; class A blue
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
- Columns: columnId[Column title]
- Tasks: taskId[Task text], indented under their column
- Task metadata: taskId[Task text]@{ assigned: 'name', ticket: MC-123, priority: 'High' } (priority: 'Very High', 'High', 'Low', 'Very Low')
- Example:
  kanban
    todo[Todo]
      t1[Write code]@{ assigned: 'alex', priority: 'High' }
      t2[Review]
    done[Done]
      t3[Ship]`,

	architecture: `ARCHITECTURE DIAGRAM SYNTAX:
- First line: architecture-beta
- Groups: group id(icon)[Label], optionally nested with in parentId
- Services: service id(icon)[Label], optionally in groupId
- Icons: only cloud, database, disk, internet and server are built in
- Edges: a:R -- L:b; with arrowheads a:R --> L:b, a:R <-- L:b, a:R <--> L:b (sides: L/R/T/B)
- Edge leaving a group: a{group}:B --> T:b{group} (only for services inside a group)
- Junctions: junction id (optionally in groupId), a 4-way split point for edges
- Alignment: align row a b c, align column a b (members must be declared first)
- Example:
  architecture-beta
    group api(cloud)[API]
    service db(database)[DB] in api
    service client(internet)[Client]
    client:R --> L:db`,

	radar: `RADAR CHART SYNTAX:
- First line: radar-beta
- title Text
- Axes: axis name1["Label"], name2["Label"] (several axis lines are allowed)
- Curves: curve name["Label"]{v1, v2, v3} with values in axis order, or keyed by axis: curve name{ name2: 5, name1: 3 }; several curves per line, comma-separated
- Optional: max N, min N, showLegend true/false, graticule circle/polygon, ticks N
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
- Namespaces: Namespace.Name gives the entity its own swimlane (tf 05 evt Inventory.Changed)
- Inline data: { field: type } on the same line, optionally typed: \`json\`{ "name": "foo" } (json, jsobj, figma, salt, uri, md, html, text)
- Data blocks: reference with [[id]] on the frame line, then define at column 0: data id { ... } spread over several lines
- Relations are inferred from frame order. Reset frame: rf NN type Name (or resetframe) breaks the inference. Extra sources: tf 06 rmo View ->> 03 ->> 04
- Example:
  eventmodeling
    tf 01 ui CartUI
    tf 02 cmd AddItem { description: string }
    tf 03 evt ItemAdded`,

	treemap: `TREEMAP SYNTAX:
- First line: treemap-beta
- Nested quoted labels with indentation
- Leaf nodes: "Label": value
- Styling: "Label":::cls on a parent, "Label": 20:::cls on a leaf, with classDef cls fill:#f96,stroke:#333
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
- title Text (unquoted; quotes would be displayed)
- Sets: set Name, set "Name With Spaces", or set A["Label"] for a display label
- Overlaps: union A,B["Label"] (two or more set names; sets must be defined first)
- Optional size: :N suffix on a set/union (e.g. set A["Alpha"]:20)
- Text nodes: indented text Name["Label"] under a set or union
- Styling: style A fill:#ff6b6b; style A,B color:#333 (fill, color, stroke, stroke-width, fill-opacity; also on text nodes)
- Example:
  venn-beta
    title Overlap
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
- title Text; optional size [1100, 600]
- Coordinates are [visibility, evolution], both 0-1 (visibility: 0 infrastructure, 1 user-facing; evolution: 0 genesis, 1 commodity). This is NOT [x, y]
- anchor Name [v, e] for users or customers; component Name [v, e]. Quote a name only if it starts with a non-letter
- After the coordinates: label [offsetX, offsetY], (inertia), and a sourcing mark (build), (buy), (outsource) or (market)
- Links: A -> B (or A --> B), A -> B; label, A -.-> B dashed, A +> B flow, A +< B reverse flow, A +<> B both ways, A +'text'> B labelled flow
- evolve Name 0.8 draws an evolution arrow to a new evolution value
- pipeline Name { component "Variant" [0.25] ... } (evolution value only)
- Stages: evolution Genesis -> Custom -> Product -> Commodity (optional widths: Genesis@0.2)
- Notes: note "text" [v, e]; annotations [v, e] then annotation 1,[v, e] "text"; accelerator "text" [v, e]; deaccelerator "text" [v, e]
- Example:
  wardley-beta
    title Map
    anchor Business [0.95, 0.63]
    component Tea [0.63, 0.81]
    Business -> Tea`,

	cynefin: `CYNEFIN SYNTAX:
- First line: cynefin-beta
- title Text
- Domains: complex, complicated, clear, chaotic, confusion (each a keyword on its own line; positions are fixed)
- Items: "Text" on its own line under a domain (indentation optional)
- Transitions: domain1 --> domain2 : "Label" (label optional; the two domains must differ)
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
- Optional: title Text (unquoted; quotes would be displayed)
- Children indented under parents (2 spaces per level), or box-drawing lines (├── src/, │   └── index.ts)
- Labels: bare (index.js), or quoted when they contain spaces ("my file.txt"). A trailing / marks a directory (src/)
- Annotations after a label: :::highlight (built-in class), ## description
- Comments: %% text on its own line
- Example:
  treeView-beta
    title File System
    project/
      src/
        components/
          App.tsx ## entry point
      public/
        index.html`,
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
- Quote new node text only if it contains [ ] { } ( ) " or a colon. In the A@{ shape: name, label: "text" } form the label is always double-quoted.
- Edge label pipes take no padding spaces: -->|Yes| not --> | Yes |
- Never use lowercase end as a node ID (it closes a subgraph); write End or END. A node ID starting with o or x directly after an edge (A---oB) becomes a circle/cross arrowhead; put a space before it.
- If the diagram uses linkStyle, add new edges after the existing ones; inserting an edge earlier shifts every later linkStyle number.`,

	sequenceDiagram: `SEQUENCE DIAGRAM RULES:
- Participant names are bare identifiers; reuse existing spellings exactly.
- Message text after the colon is plain unquoted text.
- Every block opener (loop, alt, opt, par, critical, break, rect, box) needs a matching end.
- A bare word end in message or note text breaks the diagram; wrap it as (end), [end] or {end}. A semicolon also ends the statement, so write #59; instead.`,

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
- All text is unquoted. Task lines are: Task name: score: Actor1, Actor2 (score 1-5).
- Tasks are indented under their section; indentation defines membership, so never re-indent existing lines.`,

	mindmap: `MINDMAP RULES:
- Indentation depth alone defines the hierarchy. Never change the indentation of existing lines.
- Node text is bare; quote only if it contains ( ) [ ] or a colon.
- There is exactly one root node.`,

	timeline: `TIMELINE RULES:
- All text is unquoted. Event lines are: period : event text
- Line order is chronological order; do not reorder existing entries.`,

	sankey: `SANKEY RULES:
- Every data line is exactly: Source, Target, Value — comma-separated. Quote a field only if it contains a comma.
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
- Keep each element on a single line; only boundaries and deployment nodes open a { } block, closed by } on its own line.`,

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
- Columns are columnId[Title] and tasks are taskId[Text]; text inside the brackets is unquoted.
- Column and task IDs must stay unique; reuse existing IDs exactly.
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
- type must be one of ui, cmd/command, evt/event, rmo/readmodel, pcr/processor.
- A data block starts at column 0 (data id {) and spans several lines; an indented or single-line data block does not parse.`,

	treemap: `TREEMAP RULES:
- Every label MUST be double-quoted. Leaf nodes carry a value: "Label": 50
- Indentation defines the hierarchy; never change the indentation of existing lines.
- Only leaf nodes carry values; parent nodes must not.`,

	venn: `VENN DIAGRAM RULES:
- Set names are bare identifiers (quoted only if they contain spaces); any ["Display Label"] MUST be double-quoted. The title is unquoted.
- A union may only reference sets already defined above it; reuse existing set names exactly.`,

	ishikawa: `ISHIKAWA RULES:
- There are no identifiers, no quotes and no keywords — every line is plain text.
- The first line after the directive is the problem statement; every later line is a cause.
- Indentation depth alone defines the hierarchy; never change the indentation of existing lines.`,

	wardley: `WARDLEY MAP RULES:
- Component and anchor names are unquoted and may contain spaces (component Cup of Tea [0.79, 0.61]).
- Coordinates are two numbers between 0 and 1 in square brackets, in the order [visibility, evolution].
- Links must reference names exactly as declared above.`,

	cynefin: `CYNEFIN RULES:
- Domain headers (complex, complicated, clear, chaotic, confusion) are bare keywords on their own line; no other domain names exist.
- Item text and edge labels MUST be double-quoted; the title is unquoted.
- Items belong to the domain header above them; do not move items between domains.`,

	treeView: `TREE VIEW RULES:
- Labels are bare unless they contain spaces; the title is unquoted. Keep the quoting style the diagram already uses.
- There is no root keyword: every line is a node, and a trailing / marks a directory.
- Indentation defines the hierarchy; never change the indentation of existing lines.`,
};