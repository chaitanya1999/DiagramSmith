# DiagramSmith

**DiagramSmith** is an AI-assisted diagram editor for Mermaid.js diagrams. Unlike one-shot AI diagram generators, DiagramSmith is designed for **iterative editing** — you describe changes in natural language, and an LLM updates the existing diagram incrementally.

The Mermaid source code is the **single source of truth** — you can edit it manually, or let the AI modify it for you. No backend is required.

---

## Features

- **🤖 AI-Powered Editing** — Modify diagrams using natural language instructions via the floating prompt bar
- **❓ Ask Mode** — Two LLM modes: **Action** (modify the diagram) and **Ask** (ask a question about the diagram without modifying it). Ask answers are shown in a popup.
- **🕘 Interaction History** — One-click popup showing the last prompt and LLM response (or last question and answer in Ask mode)
- **📋 Version History** — Full version history with snapshot tracking, side-by-side diff view (powered by CodeMirror Merge), and one-click restore to any previous version
- **📝 Text Summary** — Each diagram can have an accompanying text summary that improves LLM reasoning. The summary is editable and persists across sessions.
- **🔀 Dual Output Mode** — LLM can generate both Mermaid syntax and a text summary simultaneously (separated by a delimiter), improving multi-turn editing quality
- **📖 Syntax Guide** — Optionally injects a concise syntax reference for the current diagram type into the system prompt, helping LLMs generate valid syntax for less common diagram types
- **🛡️ Consume Invalid Output** — Invalid LLM output is never discarded: it is loaded into the editor with the parse error shown, while the last valid diagram remains rendered
- **✏️ Manual Editing** — Full CodeMirror 6 editor with custom Mermaid syntax highlighting (50+ arrow patterns, keywords, node IDs, edge labels, comments, dates), real-time validation, and parse error display
- **↩ Word Wrap Toggle** — Toggle word wrapping in the editor on/off via toolbar button
- **📊 29 Diagram Types** — Flowchart, Sequence, Class, State, ER, Gantt, Pie, Gitgraph, Journey, Mindmap, Timeline, Sankey, Swimlanes, Quadrant, Requirement, C4, XY Chart, Block, Packet, Kanban, Architecture, Radar, Event Modeling, Treemap, Venn, Ishikawa, Wardley, Cynefin, TreeView
- **🔄 Diagram Type Auto-Detection** — The diagram type is automatically detected from the Mermaid code's first line, keeping the toolbar dropdown in sync. Supports aliases (e.g., `graph` → flowchart, `C4Context` → c4)
- **🔀 Split View** — Side-by-side editor and rendered diagram with draggable resizable panels. Editor panel has a vertical split for Mermaid code + Text Summary.
- **🔍 Pan & Zoom** — Scroll to zoom (from viewport center), click-and-drag to pan, with floating zoom controls including a zoom slider (30%–1000%, default 250%)
- **🛑 Abortable Generation** — A stop button (⏹) appears in the diagram loading overlay during LLM requests; clicking it cancels the API call immediately. The Cancel button in the prompt bar also aborts the request.
- **⬆️ Recall Last Prompt** — Press the Up Arrow key (↑) on an empty prompt input to pre-fill it with the last submitted prompt
- **🌙 Dark / Light Mode** — Toggleable theme persisted to localStorage, with a comprehensive CSS custom properties theming system covering all UI elements
- **⚙️ Bring Your Own Key** — Connect to any OpenAI-compatible LLM endpoint
- **💾 Local Persistence** — Diagram code, text summary, LLM config, theme, diagram type, and version history saved automatically to localStorage
- **📥 📤 Export & Import** — Export as `.mmd` file, export full project as `.dsmith.json` (includes summary), copy to clipboard, import from `.mmd` or `.dsmith.json` files (auto-detects format)
- **⚠️ Safe by Design** — Invalid Mermaid never overwrites a valid diagram

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19, TypeScript ~6.0 |
| Build | Vite 5 |
| UI | Bootstrap 5.3 + react-bootstrap |
| Editor | CodeMirror 6 with custom Mermaid StreamLanguage syntax highlighting |
| Merge / Diff | @codemirror/merge |
| Diagram Renderer | Mermaid.js 11 |
| Split Panels | react-resizable-panels |
| Pan / Zoom | @panzoom/panzoom |
| LLM API | OpenAI-compatible REST (fetch) |
| Storage | localStorage |
| Testing | Vitest + jsdom |
| Linting | oxlint |
| Deployment | gh-pages (GitHub Pages) |
| No Backend | ✅ Fully client-side |

---

## Architecture

```
src/
├── main.tsx                        # React entry point
├── App.tsx                         # Root orchestrator
├── index.css                       # Bootstrap import + 765 lines of dark/light mode CSS with custom properties
│
├── components/
│   ├── DiagramView.tsx             # Mermaid SVG renderer + pan/zoom controls with vertical slider
│   ├── MermaidEditor.tsx           # CodeMirror 6 editor + resizable summary panel (vertical split)
│   ├── MermaidDiffView.tsx         # CodeMirror Merge side-by-side diff view (used by Version History)
│   ├── PromptBar.tsx               # Floating bottom-center prompt with Action/Ask mode toggle + summary/syntax toggles
│   ├── Toolbar.tsx                 # Top toolbar: split view, word wrap, diagram type, import/export, theme, versions, history, settings
│   ├── SettingsDialog.tsx          # LLM configuration modal (Base URL, API Key, Model, Temperature, Max Tokens) + Max Snapshots
│   ├── PromptHistoryDialog.tsx     # Modal showing last prompt & LLM response (Action) or question & answer (Ask)
│   └── VersionHistoryDialog.tsx    # Modal showing snapshot list with expand/collapse, diff, and restore
│
├── hooks/
│   ├── useMermaid.ts               # Diagram + summary state, validation, persistence, LLM/editor update flow
│   ├── useLLM.ts                   # LLM generation + ask: loading, abort, error handling, API calls with summary options
│   ├── useToasts.ts                # Toast notification state management with auto-dismiss
│   ├── useTheme.ts                 # Dark/light mode state + localStorage persistence
│   ├── useDiagramType.ts           # Diagram type tracking + template switching + auto-detection
│   └── useVersionHistory.ts        # Version history state: snapshot tracking, restore, max cap enforcement
│
├── services/
│   ├── llm.ts                      # OpenAI-compatible chat completions API client (editDiagram + askDiagram)
│   │                               # — LlmError class with error codes (invalid_key, timeout, malformed, network, unsupported)
│   │                               # — Dual output parsing via SUMMARY_DELIMITER
│   │                               # — Code fence stripping
│   ├── mermaid.ts                  # Mermaid parse/validate/render wrappers, theme initialization
│   ├── storage.ts                  # localStorage read/write helpers (mermaid, summary, LLM config, version history, max snapshots)
│   └── __tests__/
│       └── diagramTypes.test.ts    # Vitest tests: validates all 29 templates parse correctly and types are detected
│
├── types/
│   └── index.ts                    # TypeScript types: DiagramType (29 types), ThemeMode, LlmMode, LlmConfig, LlmInteraction,
│                                   # DiagramState, DiagramDocument, ViewMode, SnapshotType, DiagramSnapshot, VersionHistory,
│                                   # DIAGRAM_DISPLAY_NAMES, DIAGRAM_ICONS
│
└── utils/
    ├── constants.ts                # Default templates (29 types), LLM config defaults, storage keys, system prompt builders
    │                               # (buildSystemPrompt for Action, buildAskSystemPrompt for Ask), diagram type detection
    │                               # (getDiagramType with aliases), SUMMARY_DELIMITER, REQUEST_TIMEOUT_MS (5 min), ALL_DIAGRAM_TYPES
    ├── diagramSyntax.ts            # Concise syntax reference guides for all 29 diagram types
    └── mermaidLanguage.ts          # Custom CodeMirror StreamLanguage for Mermaid syntax highlighting
```

### Component Tree

```
App
├── Toolbar
│   ├── Split View toggle
│   ├── Word Wrap toggle (↩ Wrap / ↩ No Wrap)
│   ├── Diagram Type dropdown (Bootstrap Dropdown with 29 types + icons)
│   ├── Import button (.mmd / .dsmith.json)
│   ├── Copy button (clipboard)
│   ├── Export dropdown
│   │   ├── Export .mmd
│   │   └── Export Project (.dsmith.json)
│   ├── Versions button (📋 — opens Version History)
│   ├── History button (🕘 — opens Prompt History)
│   ├── Theme toggle (🌙/☀️)
│   └── Settings button (⚙️)
├── [Split View]
│   ├── MermaidEditor (left panel)
│   │   ├── Mermaid Code (CodeMirror, resizable top)
│   │   ├── Separator (draggable)
│   │   └── Text Summary (textarea, resizable bottom)
│   ├── Separator (draggable)
│   └── DiagramView (right panel)
│       └── Zoom controls (slider, +/-, reset, percentage label)
├── [Diagram View]
│   └── DiagramView (full screen)
├── PromptBar (floating, collapsible)
│   ├── Action / Ask mode toggle
│   ├── Textarea for instructions / questions
│   ├── "Include Summary" toggle
│   ├── "LLM Generate Summary" toggle (Action mode only)
│   ├── "Include Syntax Guide" toggle
│   └── Generate / Ask / Cancel buttons
├── SettingsDialog (modal)
│   ├── LLM Configuration (Base URL, API Key, Model, Temperature slider, Max Tokens)
│   └── Version History (Max Snapshots slider, 1–50)
├── PromptHistoryDialog (modal)
│   ├── Mode badge (✏️ Action / ❓ Ask)
│   ├── Timestamp
│   ├── Prompt / Question
│   └── LLM Response / Answer
└── VersionHistoryDialog (modal)
    ├── Snapshot cards (reverse chronological)
    │   ├── Badge (#id, 🤖 LLM / ✏️ Manual, time ago, ◀ Current)
    │   ├── Prompt text (truncated to 100 chars)
    │   ├── 🔍 Diff button (opens side-by-side CodeMirror Merge diff)
    │   ├── ▼ Expand button (shows full Mermaid code + summary)
    │   └── Restore button
    └── MermaidDiffView (CodeMirror Merge — green/red line backgrounds)
```

### Data Flow

1. **LLM Flow (Action)**: PromptBar → `useLLM.generate()` → `services/llm.editDiagram()` → OpenAI API → validate → update state (mermaid + optional summary via `---==DIAGRAMSMITH_SUMMARY_BOUNDARY==---` delimiter) → record LLM snapshot → re-render
2. **LLM Flow (Ask)**: PromptBar → `useLLM.ask()` → `services/llm.askDiagram()` → OpenAI API → record interaction → auto-open PromptHistoryDialog with the answer
3. **Manual Edit Flow**: CodeMirror onChange → debounce (400ms) → `services/mermaid.validate()` → if valid: update state & record manual snapshot; if invalid: show parse error
4. **Diagram Type Detection Flow**: CodeMirror onChange → debounce → validate → `getDiagramType()` (first-line matching with aliases) → update toolbar dropdown
5. **Version History Flow**: Manual edits and LLM generations both create `DiagramSnapshot` objects. Restoring a snapshot updates the editor and sets `isRestored` state. If the user edits a restored (past) snapshot, a confirmation dialog warns that future snapshots will be truncated; on cancel the editor reverts to the latest snapshot.
6. **Diagram Type Change**: Toolbar dropdown → `changeDiagramType(type)` → `setMermaidDirectly(template)` → immediate state update (no validation needed for known-good templates)

---

## Getting Started

### Prerequisites

- Node.js 18+ (tested with 20.x)
- npm 9+

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

### Lint

```bash
npm run lint
```

### Test

```bash
npm run test
```

Runs Vitest tests (validates all 29 diagram templates parse correctly and type detection works).

### Deploy to GitHub Pages

```bash
npm run deploy
```

---

## Configuration

### LLM Settings (⚙️)

| Field | Description |
|-------|-------------|
| **Base URL** | Any OpenAI-compatible endpoint (default: `https://api.openai.com/v1`) |
| **API Key** | Your API key (stored locally only). Can be left empty when using local models that don't require authentication (e.g., Ollama, LM Studio) if **Send Authorization Header** is disabled. |
| **Model Name** | e.g., `gpt-4o-mini`, `gpt-4o`, `claude-3-sonnet` (if Anthropic-compatible proxy) |
| **Temperature** | 0–2 (default: 0.3). Lower = more deterministic |
| **Maximum Tokens** | Max response length (default: 2048) |
| **Send Authorization Header** | When enabled (default), the API key is sent as a Bearer token in the `Authorization` header. Disable for local models or endpoints that don't require authentication. Persisted to localStorage. |

### Version History Settings (⚙️)

| Field | Description |
|-------|-------------|
| **Max Snapshots** | 1–50 (default: 5). Oldest snapshots are automatically dropped when the limit is exceeded. |

### Prompt Options

When the prompt bar is expanded, three toggle switches are available:

| Option | Description |
|--------|-------------|
| **Include Summary** | When ON, the current text summary is included in the LLM prompt to improve context and reasoning. Only effective when the summary is non-empty. |
| **LLM Generate Summary** | When ON, the LLM outputs both updated Mermaid syntax and an updated text summary (separated by the delimiter `---==DIAGRAMSMITH_SUMMARY_BOUNDARY==---`). Hidden in Ask mode. |
| **Include Syntax Guide** | When ON, a concise syntax reference for the current diagram type is injected into the system prompt to help the LLM generate valid syntax |

All three default to ON for optimal multi-turn editing quality.

### Diagram Types

| Type | Icon | Description |
|------|------|-------------|
| Flowchart | 🔀 | Process flows and decision trees |
| Sequence | ⏩ | Interaction diagrams |
| Class | 🏛️ | Object-oriented class structures |
| State | ⚡ | State machine diagrams |
| ER | 🔗 | Entity-relationship diagrams |
| Gantt | 📊 | Project timeline charts |
| Pie | 🥧 | Pie/percentage charts |
| Git | 🌿 | Git branch visualization |
| Journey | 🗺️ | User journey maps |
| Mindmap | 🧠 | Hierarchical mind maps |
| Timeline | 📅 | Chronological timelines |
| Sankey | 🔀 | Flow/sankey diagrams |
| Swimlanes | 🏊 | Process flows divided by responsibility |
| Quadrant | 🎯 | Quadrant/scatter charts |
| Requirement | 📋 | Requirements and their relationships |
| C4 | 🏗️ | C4 architecture diagrams |
| XY Chart | 📈 | XY/bar/line charts |
| Block | 🧱 | Block diagrams |
| Packet | 📦 | Network packet layouts |
| Kanban | 📋 | Kanban board visualization |
| Architecture | 🏛️ | Architecture diagrams |
| Radar | 📡 | Radar/spider charts |
| Event Modeling | 🕰️ | Event modeling timelines |
| Treemap | 🌳 | Hierarchical treemap charts |
| Venn | ⭕ | Venn set diagrams |
| Ishikawa | 🐟 | Fishbone/root-cause diagrams |
| Wardley | 🗺️ | Wardley strategy maps |
| Cynefin | 🌀 | Cynefin framework diagrams |
| TreeView | 🌲 | Tree view hierarchies |

---

## Version History

The version history system tracks every change to your diagram, whether made manually or by the LLM.

### Features

- **Automatic Snapshots** — Every manual edit (after validation) and every LLM generation creates a snapshot with a unique ID, timestamp, type badge (🤖 LLM / ✏️ Manual), and the prompt text
- **Side-by-Side Diff** — Click the 🔍 Diff button on any snapshot to see a CodeMirror Merge view comparing that snapshot against the current version, with red (deletion) and green (insertion) line highlighting
- **Expand to View** — Click ▼ to expand a snapshot and view the full Mermaid code and summary at that point in time
- **One-Click Restore** — Click "Restore" to revert the diagram to any previous snapshot. If you then make edits, a confirmation dialog warns that future snapshots will be discarded
- **Configurable Capacity** — Set the maximum number of snapshots (1–50) in Settings. The oldest snapshots are automatically trimmed when the limit is exceeded
- **Persistent** — All snapshots are saved to localStorage and survive page reloads

### How Snapshots Work

- **Manual edits** that pass validation update the latest manual snapshot in-place (to avoid noise from keystroke-level changes). If the latest snapshot is an LLM snapshot, a new manual snapshot is created.
- **LLM generations** always create a new snapshot.
- **Restoring** a past snapshot and then editing triggers a confirmation: "You are editing a past snapshot. This will discard all future snapshots. Continue?" If accepted, future snapshots are truncated. If cancelled, the editor reverts to the latest snapshot.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl` + `Enter` | Submit AI prompt |
| `↑` (Arrow Up) | Recall last prompt (when input is empty) |
| `Tab` / `Shift`+`Tab` | Indent / outdent in the CodeMirror editor |
| Scroll wheel | Zoom in/out (diagram view, from viewport center) |
| Click + drag | Pan diagram |

---

## System Prompt

The system prompt is composed dynamically from a single base of rules plus conditional sections, eliminating redundancy:

- **Base rules** — Always included (modify existing diagram only, preserve node identifiers, smallest changes, no code fences, no explanations, etc.)
- **Summary context** — Added when *Include Summary* is ON
- **Dual output format** — Added when *LLM Generate Summary* is ON (outputs Mermaid + summary separated by `---==DIAGRAMSMITH_SUMMARY_BOUNDARY==---`)
- **Syntax guide** — Added when *Include Syntax Guide* is ON; a concise syntax reference for the current diagram type is injected so the LLM produces valid syntax

All variants enforce:
- Modify the existing diagram only
- Preserve node identifiers whenever possible
- Make the smallest possible changes
- Only change the diagram type if explicitly asked
- No markdown code fences, no explanations

### Ask Mode System Prompt

In Ask mode, the LLM is instructed to answer the user's question about the diagram without modifying it. The prompt includes the diagram code, optional summary, and optional syntax guide.

---

## Syntax Highlighting

The CodeMirror editor features a custom `StreamLanguage` parser that provides comprehensive Mermaid syntax highlighting with distinct colors for:

| Token Type | Elements |
|------------|----------|
| **Keywords** | Diagram type declarations: `flowchart`, `sequenceDiagram`, `classDiagram`, etc. |
| **Attribute Names** | Meta keywords: `section`, `title`, `subgraph`, `participant`, `loop`, `alt`, `note`, etc. |
| **Operators** | 50+ arrow/connector patterns: `-->`, `->>`, `==>`, `-.->`, `<|--`, `o--o`, etc. |
| **Strings** | Node labels in brackets: `[text]`, `{text}`, `(text)` |
| **Numbers** | Numeric values and dates (`YYYY-MM-DD`) |
| **Comments** | `%%` line comments (gray, italic) |
| **Punctuation** | Colon, semicolon, brackets, pipe characters |
| **Definition Keywords** | Node IDs and identifiers (teal, bold) |
| **Attribute Values** | Edge labels in pipes: `\|text\|` |

---

## Export / Import

| Action | Format | Content |
|--------|--------|---------|
| Export .mmd | `.mmd` (plain text) | Mermaid syntax only |
| Export Project | `.dsmith.json` (JSON) | `{ "mermaid": "...", "summary": "..." }` |
| Import | `.mmd` or `.dsmith.json` | Auto-detects format; imports both mermaid and summary if available. JSON files (`.json`, `.dsmith.json`) are tried as project files first, falling back to `.mmd` import. |
| Copy | Clipboard | Mermaid syntax only |

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Request cancelled | Loading overlay removed immediately; no toast shown |
| Invalid API key | `LlmError` with code `invalid_key` → Toast error: "Invalid API key. Please check your settings." |
| Network error | `LlmError` with code `network_error` → Toast error: "Network error. Please check your Base URL and ensure the API is reachable." |
| Network timeout (5 min) | `LlmError` with code `timeout` → Toast error: "Request cancelled." |
| LLM returns invalid Mermaid | Output is loaded into the editor with the parse error shown; the last valid diagram remains rendered; toast error shown |
| Malformed LLM response | Code fences stripped automatically; dual output parsed via `---==DIAGRAMSMITH_SUMMARY_BOUNDARY==---` delimiter; toast error on empty response |
| Empty LLM response | `LlmError` with code `malformed_response` → Toast error |
| Mermaid parse error in editor | Error shown in editor footer |
| Mermaid render failure | "⚠ Render Error" displayed in diagram panel |

---

## CSS Theming

DiagramSmith uses a comprehensive CSS custom properties system for theming. All colors, shadows, and spacing are defined as CSS variables under `:root` (light) and `[data-bs-theme="dark"]` (dark). Key variable groups:

- **Backgrounds & Text** — `--app-bg`, `--app-text`, `--surface-bg`, `--editor-bg`, `--diagram-bg`
- **Accent & Status** — `--accent`, `--success`, `--warning`, `--danger`
- **Borders & Panels** — `--surface-border`, `--panel-handle`, `--scrollbar-thumb`
- **Shadows** — `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- **Syntax Colors** — `--syntax-keyword`, `--syntax-attribute`, `--syntax-operator`, `--syntax-string`, `--syntax-number`, `--syntax-comment`, `--syntax-punctuation`, `--syntax-definition`, `--syntax-attribute-value`

The theme is toggled by setting `data-bs-theme` on `<html>` and persisted to localStorage.

---

## Localization / Storage Keys

All persisted data uses the following `localStorage` keys:

| Key | Content |
|-----|---------|
| `diagramsmith-mermaid` | Current valid Mermaid diagram code |
| `diagramsmith-summary` | Current text summary |
| `diagramsmith-llm-config` | LLM configuration (JSON) |
| `diagramsmith-theme` | Theme mode (`dark` / `light`) |
| `diagramsmith-version-history` | Version history with snapshots (JSON) |
| `diagramsmith-max-snapshots` | Max snapshots setting (number) |

---

## Tests

The project includes a Vitest test suite in `src/services/__tests__/diagramTypes.test.ts` that validates:

1. `ALL_DIAGRAM_TYPES` array matches the keys of `DEFAULT_TEMPLATES`
2. Every default template parses successfully with Mermaid.js (no syntax errors)
3. Every template's diagram type is correctly detected by `getDiagramType()`

Run with:

```bash
npm run test
```

---

## License

ISC