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
- **✏️ Manual Editing** — Full CodeMirror 6 editor with `codemirror-lang-mermaid` Lezer-based syntax highlighting, real-time validation, and parse error display
- **↩ Word Wrap Toggle** — Toggle word wrapping in the editor on/off via toolbar button
- **📊 29 Diagram Types** — Flowchart, Sequence, Class, State, ER, Gantt, Pie, Gitgraph, Journey, Mindmap, Timeline, Sankey, Swimlanes, Quadrant, Requirement, C4, XY Chart, Block, Packet, Kanban, Architecture, Radar, Event Modeling, Treemap, Venn, Ishikawa, Wardley, Cynefin, TreeView
- **🔄 Diagram Type Auto-Detection** — The diagram type is automatically detected from the Mermaid code's first line, keeping the toolbar dropdown in sync. Supports aliases (e.g., `graph` → flowchart, `C4Context` → c4)
- **🔀 Split View** — Side-by-side editor and rendered diagram with draggable resizable panels. Editor panel has a vertical split for Mermaid code + Text Summary.
- **🔍 Pan & Zoom** — Scroll to zoom (from viewport center), click-and-drag to pan, with floating zoom controls including a zoom slider (30%–1000%, default 250%)
- **🛑 Abortable Generation** — A stop button (⏹) appears in the diagram loading overlay during LLM requests; clicking it cancels the API call immediately and silently (no error toast — cancelling is deliberate, not a failure).
- **⬆️ Recall Last Prompt** — Press the Up Arrow key (↑) on an empty prompt input to pre-fill it with the last submitted prompt
- **🌙 Dark / Light Mode** — Toggleable theme persisted to localStorage, with a comprehensive CSS custom properties theming system covering all UI elements
- **⚙️ Bring Your Own Key** — Connect to any OpenAI-compatible LLM endpoint
- **💾 Local Persistence** — Diagram code, text summary, LLM config, theme, diagram type, and version history saved automatically to localStorage
- **📥 📤 Export & Import** — Export as `.mmd` file, export full project as `.dsmith.json` (includes summary), copy to clipboard, import from `.mmd` or `.dsmith.json` files (auto-detects format)
- **⚠️ Safe by Design** — Invalid Mermaid never overwrites a valid diagram, and an LLM response that carries no summary never overwrites the one you wrote
- **✂️ Truncation Detection** — If the provider cuts a response short (token cap or content filter), you are told so explicitly instead of silently receiving half a diagram

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19, TypeScript ~6.0 |
| Build | Vite 5 |
| UI | Bootstrap 5.3 + react-bootstrap |
| Editor | CodeMirror 6 with `codemirror-lang-mermaid` Lezer-based syntax highlighting |
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
│   ├── SettingsDialog.tsx          # LLM configuration modal (Base URL, API Key, Model, Temperature, Auth header) + Max Snapshots
│   ├── PromptHistoryDialog.tsx     # Modal showing last prompt & LLM response (Action) or question & answer (Ask)
│   └── VersionHistoryDialog.tsx    # Modal showing snapshot list with expand/collapse, diff, and restore
│
├── hooks/
│   ├── useMermaid.ts               # Diagram + summary state, validation, persistence, LLM/editor update flow
│   ├── useLLM.ts                   # LLM generation + ask: loading, abort, error handling, API calls with summary options
│   ├── useToasts.ts                # Toast notification state management with auto-dismiss
│   ├── useTheme.ts                 # Dark/light mode state + localStorage persistence
│   ├── useDiagramType.ts           # Diagram type tracking + template switching + auto-detection
│   └── useVersionHistory.ts        # Version history state: one `commitSnapshot` helper behind three
│                                   # recorders (manual/coalescing, LLM, document-replace), restore,
│                                   # max cap enforcement, quota-aware persistence with oldest-first eviction
│
├── services/
│   ├── llm.ts                      # OpenAI-compatible chat completions API client (editDiagram + askDiagram)
│   │                               # — callChatCompletion: single shared transport for both modes
│   │                               # — LlmError with per-scenario codes (invalid_key, forbidden, billing, rate_limited,
│   │                               #   server_error, timeout, cancelled, malformed_response, network_error, unsupported_model)
│   │                               # — ABORT_REASON_USER / ABORT_REASON_TIMEOUT so cancel ≠ timeout
│   │                               # — Truncation detection via finish_reason (length / content_filter)
│   │                               # — Dual output parsing with a fuzzy SUMMARY_DELIMITER matcher; summary: null
│   │                               #   when absent, so an existing summary is never overwritten
│   │                               # — Per-half code fence stripping (stripCodeFences)
│   ├── mermaid.ts                  # Mermaid parse/validate/render wrappers, theme initialization
│   ├── storage.ts                  # localStorage read/write helpers (mermaid, summary, LLM config, version history,
│   │                               # max snapshots). Writers return success/failure so quota errors are never
│   │                               # swallowed; `loadVersionHistory` validates every rehydrated snapshot and
│   │                               # clamps activeIndex instead of trusting a cast
│   └── __tests__/
│       ├── diagramTypes.test.ts    # Vitest tests: templates parse, syntax-guide examples parse, per-type rules
│       │                           # exist and never contradict their type, directive ordering, type detection
│       └── llm.test.ts             # Vitest tests: dual-output parsing, fuzzy delimiter matching, fence stripping,
│                                   # truncation flagging, HTTP error mapping, abort handling, network failures
│
├── types/
│   └── index.ts                    # TypeScript types: DiagramType (29 types), ThemeMode, LlmMode, LlmConfig, LlmInteraction,
│                                   # DiagramState, DiagramDocument, ViewMode, SnapshotType, DiagramSnapshot, VersionHistory,
│                                   # DIAGRAM_DISPLAY_NAMES, DIAGRAM_ICONS
│
└── utils/
    ├── constants.ts                # Default templates (29 types), LLM config defaults, storage keys, system prompt builders
    │                               # (buildSystemPrompt for Action, buildAskSystemPrompt for Ask), diagram type detection
    │                               # (tryGetDiagramType → type | null, getDiagramType → type with fallback, DIAGRAM_DIRECTIVES
    │                               # aliases), SUMMARY_DELIMITER, REQUEST_TIMEOUT_MS (5 min), ALL_DIAGRAM_TYPES
    └── diagramSyntax.ts            # DIAGRAM_SYNTAX_GUIDES (optional syntax reference per type) and
                                    # DIAGRAM_RULES (always-injected correctness rules per type)
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
│   ├── LLM Configuration (Base URL, API Key, Model, Temperature slider, Send Authorization Header)
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
    ├── 🗑️ Clear All (Keep Current) / 🗑️ Clear Everything
    └── MermaidDiffView (CodeMirror Merge — green/red line backgrounds)
```

### Data Flow

1. **LLM Flow (Action)**: PromptBar → `useLLM.generate()` → `services/llm.editDiagram()` → OpenAI API → validate → update state (mermaid + optional summary via `---==DIAGRAMSMITH_SUMMARY_BOUNDARY==---` delimiter) → record LLM snapshot → re-render
2. **LLM Flow (Ask)**: PromptBar → `useLLM.ask()` → `services/llm.askDiagram()` → OpenAI API → record interaction → auto-open PromptHistoryDialog with the answer
3. **Manual Edit Flow**: CodeMirror onChange → debounce (400ms) → `services/mermaid.validate()` → if valid: update state & record a coalescing manual snapshot; if invalid: show parse error and record nothing
4. **Diagram Type Detection Flow**: CodeMirror onChange → debounce → validate → `getDiagramType()` (first-line matching with aliases) → update toolbar dropdown
5. **Version History Flow**: Every snapshot is recorded by the action that caused it — `handleManualEdit` (coalescing), `handleLlmGenerate` (always new), or `handleReplaceDocument` (always new, for type changes and imports). All three funnel into one `commitSnapshot` helper that truncates future snapshots when editing from a restored point and enforces the capacity cap.
6. **Diagram Type Change**: Toolbar dropdown → confirmation → flush any pending edit → `changeDiagramType(type)` → `setMermaidDirectly(template)` → `handleReplaceDocument()` records the swap as its own snapshot

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
| **Send Authorization Header** | When enabled (default), the API key is sent as a Bearer token in the `Authorization` header. Disable for local models or endpoints that don't require authentication. Persisted to localStorage. |

### Version History Settings (⚙️)

| Field | Description |
|-------|-------------|
| **Max Snapshots** | 1–50 (default: 5). Oldest snapshots are automatically dropped when the limit is exceeded. Takes effect immediately on save — no reload required. |

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
- **Configurable Capacity** — Set the maximum number of snapshots (1–50) in Settings. The oldest snapshots are automatically trimmed when the limit is exceeded. Changes take effect immediately, without a reload
- **Clear All (Keep Current)** — Deletes every snapshot except the current version, with a confirmation dialog
- **Clear Everything** — Deletes the entire history including the current version. Your diagram and summary are left untouched — only the history is wiped
- **Persistent** — All snapshots are saved to localStorage and survive page reloads. Rehydrated data is validated on load: malformed snapshots are dropped and an out-of-range index is clamped, rather than crashing the app on every reload
- **Quota-aware** — If browser storage fills up, the oldest snapshots are shed to make room and you are told. Storage failures are never silent

### How Snapshots Work

Two rules cover everything:

1. **An AI generation is always its own snapshot.**
2. **A run of consecutive manual edits collapses into one snapshot**, so keystrokes don't flood the history. Manual edits to the Mermaid code *and* to the Text Summary both count, and both coalesce together.

Which gives:

| Sequence | Snapshots |
|----------|-----------|
| AI → AI | 2 |
| AI → manual | 2 |
| manual → AI | 2 |
| manual → manual | 1 |
| AI → manual → manual → manual → AI | 3 |

- **Only valid Mermaid is snapshotted.** An unparseable draft stays in the editor but is not a version worth returning to.
- **Document replacements** — switching diagram type, or importing a file — always push a new snapshot rather than coalescing, so the work being replaced stays recoverable. Any pending edit is committed first.
- **Restoring** a past snapshot and then editing (by typing *or* by generating) asks first: "You are editing a past snapshot. This will discard all future snapshots. Continue?" The prompt appears **before** the change is applied, and is asked once per restore.

Snapshots are recorded by whichever action caused the change rather than by watching state, so the cause is always known exactly — a state watcher cannot tell an AI update apart from a manual one.

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

- **Base rules** — Always included; only rules that hold for *every* diagram type
- **Per-type rules** — Always included for the detected diagram type (`DIAGRAM_RULES` in `diagramSyntax.ts`)
- **Summary context** — Added when *Include Summary* is ON
- **Dual output format** — Added when *LLM Generate Summary* is ON (outputs Mermaid + summary separated by `---==DIAGRAMSMITH_SUMMARY_BOUNDARY==---`)
- **Syntax guide** — Added when *Include Syntax Guide* is ON; a concise syntax reference for the current diagram type is injected so the LLM produces valid syntax

The base rules enforce:
- Modify the existing diagram only
- Preserve existing identifiers, labels, quoting, indentation and line order unless the instruction requires changing them
- Make the smallest possible changes
- Only change the diagram type if explicitly asked
- No markdown code fences, no explanations

### Why rules are per-type

Quoting conventions genuinely differ between diagram types — Pie *requires* quoted labels, Sankey *forbids*
quotes, and Ishikawa has no identifiers or quoting at all — so a single global rule cannot be correct for all
29 types. Rules that only apply to some types (node ID format, quoting, edge-label pipes) therefore live in
`DIAGRAM_RULES`, keyed by diagram type, and every entry is written so that the shipped template *and* the
syntax guide example for that type already satisfy it. The test suite enforces that consistency.

Unlike the syntax guide, per-type rules are injected regardless of the *Include Syntax Guide* toggle, since
they are correctness constraints rather than reference material.

The two layers divide cleanly: **base rules say what to preserve in the existing diagram; per-type rules say
how to write anything new.** Restating a preservation rule per type only dilutes the prompt, so quoting
preservation lives once in the base rules while each type states only its own convention for new text.

### Unknown diagram types

If the diagram type cannot be determined, the prompt asserts **no** type and injects **neither** the per-type
rules nor the syntax guide — a confidently wrong type misleads the model more than no type at all. Detection
(`tryGetDiagramType`) looks past YAML frontmatter, `%%{init: ...}%%` directives and `%%` comments before
matching the diagram directive.

### Ask Mode System Prompt

In Ask mode, the LLM is instructed to answer the user's question about the diagram without modifying it. The prompt includes the diagram code, optional summary, and optional syntax guide.

---

## Syntax Highlighting

The CodeMirror editor uses the [`codemirror-lang-mermaid`](https://github.com/inspirnathan/codemirror-lang-mermaid) package, a Lezer-based grammar parser that provides comprehensive Mermaid syntax highlighting. It supports all major Mermaid diagram types with proper grammar-based tokenization, replacing the previous custom `StreamLanguage` parser.

Syntax colors are themed via CSS custom properties (see [CSS Theming](#css-theming)):
- `--syntax-keyword` — Diagram type declarations and keywords
- `--syntax-attribute` — Meta keywords and attributes
- `--syntax-operator` — Arrows and connectors
- `--syntax-string` — Node labels and string values
- `--syntax-number` — Numeric values and dates
- `--syntax-comment` — `%%` line comments
- `--syntax-punctuation` — Colons, brackets, pipe characters
- `--syntax-definition` — Node IDs and identifiers
- `--syntax-attribute-value` — Edge labels in pipes

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

All API failures are raised as an `LlmError` carrying a `code`, so each scenario gets a message that
names the actual problem instead of funnelling everything into a generic network error.

| Scenario | Code | Behavior |
|----------|------|----------|
| Request cancelled (⏹) | `cancelled` | Loading overlay removed immediately; **no toast** — cancelling is deliberate |
| Request timeout (5 min) | `timeout` | Toast: "Request timed out. The model took too long to respond." |
| Invalid API key (401) | `invalid_key` | Toast: "Invalid API key. Please check your settings." |
| Billing / credits (402) | `billing` | Toast: "Billing issue — check your account credits." |
| No access to model (403) | `forbidden` | Toast: "Access denied — your API key may not have access to this model." |
| Not found (404) | `network_error` | Toast: "Not found (404) — check the Base URL and the model name." |
| Rate limited (429) | `rate_limited` | Toast: "Rate limited — wait a moment and try again." |
| Provider outage (5xx) | `server_error` | Toast names the status and states it is not the user's configuration |
| Temperature rejected (400) | `unsupported_model` | Toast suggests setting Temperature to 1 — reasoning models accept only the default |
| Unreachable endpoint | `network_error` | Any `TypeError` from `fetch` is treated as a network failure (covers Chrome, Firefox **and** Safari's `"Load failed"`) |
| HTTP 200 with an error body | `network_error` | The provider's own message is surfaced (common with Ollama / LM Studio) rather than "empty response" |
| Non-JSON response body | `malformed_response` | Toast: the endpoint is not an OpenAI-compatible API |
| Empty LLM response | `malformed_response` | Toast error |
| **Response cut short** | — | Warning toast: "The model's response was cut short by the provider." Detected via `finish_reason` (`length` / `content_filter`). The partial output is still loaded into the editor and the summary is left untouched |
| **No summary in response** | — | The existing summary is **retained**, never overwritten. Toast: "Diagram updated successfully. Existing summary kept." |
| LLM returns invalid Mermaid | — | Output is loaded into the editor with the parse error shown; the last valid diagram remains rendered; toast error shown |
| Provider error bodies | — | Truncated to 200 characters before being shown, so a large JSON or HTML error page cannot fill the screen |
| Mermaid parse error in editor | — | Error shown in editor footer |
| Mermaid render failure | — | "⚠ Render Error" displayed in diagram panel |
| **localStorage quota exceeded** | — | Toast error. For version history, the oldest snapshots are shed to make room first. Warned once per episode, not once per keystroke |
| **Corrupt version history on load** | — | Malformed snapshots are dropped and `activeIndex` is clamped into range; a wholly invalid blob is discarded rather than crashing the render |
| **Replacing the document** | — | Switching diagram type asks for confirmation first, and the replaced work is preserved as its own snapshot |

---

## CSS Theming

DiagramSmith uses a comprehensive CSS custom properties system for theming. All colors, shadows, and spacing are defined as CSS variables under `:root` (light) and `[data-bs-theme="dark"]` (dark). Key variable groups:

- **Backgrounds & Text** — `--app-bg`, `--app-text`, `--surface-bg`, `--editor-bg`, `--diagram-bg`
- **Accent & Status** — `--accent`, `--success`, `--warning`, `--danger`
- **Prompt FAB** — `--fab-bg`, `--fab-bg-hover`, `--fab-fg`, `--fab-ring`
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

The project includes four Vitest suites (337 tests).

**`src/services/__tests__/diagramTypes.test.ts`** validates:

1. `ALL_DIAGRAM_TYPES` array matches the keys of `DEFAULT_TEMPLATES`
2. Every default template parses successfully with Mermaid.js (no syntax errors)
3. Every template's diagram type is correctly detected by `getDiagramType()`
4. Per-type rules exist and never contradict their own type's template or syntax guide

**`src/services/__tests__/llm.test.ts`** validates:

1. `parseDualOutput` returns `summary: null` when the delimiter is missing — the regression test
   guarding against an LLM response silently wiping the user's summary
2. Near-miss delimiters (fewer dashes, extra spaces, lowercase, markdown emphasis) still split correctly
3. Code fences are stripped from each half independently
4. `finish_reason: length` / `content_filter` is flagged as truncated without discarding the output
5. HTTP 401/402/403/404/429/5xx map to distinct error codes, and long error bodies are truncated
6. HTTP 200 responses carrying an error payload surface the provider's message
7. A deliberate cancel is reported as `cancelled`, the 5-minute timeout as `timeout`
8. Chrome, Firefox **and** Safari network failures all map to `network_error`

**`src/hooks/__tests__/versionHistory.test.ts`** validates the snapshot rules:

1. The full sequencing table above (AI → AI = 2, manual → manual = 1, and so on)
2. Consecutive manual edits coalesce and keep the newest content and the original snapshot id
3. Document replacement pushes rather than overwriting the work being replaced
4. Editing from a restored snapshot discards everything after it
5. The capacity cap trims oldest-first and keeps `activeIndex` valid, down to a cap of 1

**`src/services/__tests__/storage.test.ts`** validates persistence:

1. Version history round-trips
2. Malformed snapshots are dropped; a wholly invalid blob returns `null`
3. `activeIndex` is clamped, including after entries are dropped
4. Every writer returns `false` when the quota is exceeded

Run with:

```bash
npm run test
```

---

## License

ISC