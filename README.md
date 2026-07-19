# DiagramSmith

**DiagramSmith** is an AI-assisted diagram editor for Mermaid.js diagrams. Unlike one-shot AI diagram generators, DiagramSmith is designed for **iterative editing** — you describe changes in natural language, and an LLM updates the existing diagram incrementally.

The Mermaid source code is the **single source of truth** — you can edit it manually, or let the AI modify it for you. No backend is required.

---

## Features

- **🤖 AI-Powered Editing** — Modify diagrams using natural language instructions via the floating prompt bar
- **📝 Text Summary** — Each diagram can have an accompanying text summary that improves LLM reasoning. The summary is editable and persists across sessions.
- **🔀 Dual Output Mode** — LLM can generate both Mermaid syntax and a text summary simultaneously, improving multi-turn editing quality
- **✏️ Manual Editing** — Full CodeMirror 6 editor with custom Mermaid syntax highlighting, real-time validation, and parse error display
- **📊 12 Diagram Types** — Flowchart, Sequence, Class, State, ER, Gantt, Pie, Gitgraph, Journey, Mindmap, Timeline, Sankey
- **🔀 Split View** — Side-by-side editor and rendered diagram with draggable resizable panels. Editor panel has a vertical split for Mermaid code + Text Summary.
- **🔍 Pan & Zoom** — Scroll to zoom, click-and-drag to pan, with floating zoom controls including a zoom slider (30%–1000%, default 250%)
- **🌙 Dark / Light Mode** — Toggleable theme persisted to localStorage
- **⚙️ Bring Your Own Key** — Connect to any OpenAI-compatible LLM endpoint
- **💾 Local Persistence** — Diagram code, text summary, and LLM config saved automatically to localStorage
- **📥 📤 Export & Import** — Export as `.mmd` file, export full project as `.dsmith.json` (includes summary), copy to clipboard, import from `.mmd` or `.dsmith.json` files
- **⚠️ Safe by Design** — Invalid Mermaid never overwrites a valid diagram

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19, TypeScript |
| Build | Vite 5 |
| UI | Bootstrap 5.3 + react-bootstrap |
| Editor | CodeMirror 6 with custom Mermaid syntax highlighting |
| Diagram Renderer | Mermaid.js 11 |
| Split Panels | react-resizable-panels |
| Pan / Zoom | @panzoom/panzoom |
| LLM API | OpenAI-compatible REST (fetch) |
| Storage | localStorage |
| No Backend | ✅ Fully client-side |

---

## Architecture

```
src/
├── main.tsx                        # React entry point
├── App.tsx                         # Root orchestrator
├── index.css                       # Bootstrap import + dark/light mode CSS
│
├── components/
│   ├── DiagramView.tsx             # Mermaid SVG renderer + pan/zoom controls with slider
│   ├── MermaidEditor.tsx           # CodeMirror 6 editor + resizable summary panel
│   ├── PromptBar.tsx               # Floating bottom-center prompt with summary toggles
│   ├── Toolbar.tsx                 # Top toolbar: split view, diagram type, import/export dropdown, theme, settings
│   └── SettingsDialog.tsx          # LLM configuration modal (Base URL, API Key, Model, etc.)
│
├── hooks/
│   ├── useMermaid.ts               # Diagram + summary state, validation, persistence, LLM/editor update flow
│   ├── useLLM.ts                   # LLM generation: loading, error handling, API calls with summary options
│   ├── useToasts.ts                # Toast notification state management
│   ├── useTheme.ts                 # Dark/light mode state + localStorage persistence
│   └── useDiagramType.ts           # Diagram type tracking + template switching
│
├── services/
│   ├── llm.ts                      # OpenAI-compatible chat completions API client (supports dual output)
│   ├── mermaid.ts                  # Mermaid parse/validate/render wrappers, theme initialization
│   └── storage.ts                  # localStorage read/write helpers (mermaid + summary)
│
├── types/
│   └── index.ts                    # TypeScript types, DiagramDocument interface, display names/icons
│
└── utils/
    ├── constants.ts                # Default templates, 4 system prompt variants, delimiter, storage keys, config
    └── mermaidLanguage.ts          # Custom CodeMirror StreamLanguage for Mermaid syntax highlighting
```

### Component Tree

```
App
├── Toolbar
│   ├── Split View toggle
│   ├── Diagram Type dropdown (Bootstrap Dropdown)
│   ├── Import button
│   ├── Copy button
│   ├── Export dropdown
│   │   ├── Export .mmd
│   │   └── Export Project (.dsmith.json)
│   ├── Theme toggle (🌙/☀️)
│   └── Settings button (⚙️)
├── [Split View]
│   ├── MermaidEditor (left panel)
│   │   ├── Mermaid Code (CodeMirror, resizable top)
│   │   ├── Separator (draggable)
│   │   └── Text Summary (textarea, resizable bottom)
│   ├── Separator (draggable)
│   └── DiagramView (right panel)
│       └── Zoom controls (slider, +/-, reset, percentage)
├── [Diagram View]
│   └── DiagramView (full screen)
├── PromptBar (floating, collapsible)
│   ├── Textarea for instructions
│   ├── "Include Summary" toggle
│   ├── "LLM Generate Summary" toggle
│   └── Generate / Cancel buttons
└── SettingsDialog (modal)
```

### Data Flow

1. **LLM Flow**: PromptBar → `useLLM.generate()` → `services/llm.editDiagram()` → OpenAI API → validate → update state (mermaid + optional summary) → re-render
2. **Manual Edit Flow**: CodeMirror onChange → debounce (400ms) → `services/mermaid.validate()` → if valid: update state & render; if invalid: show parse error
3. **Diagram Type Change**: Toolbar dropdown → `changeDiagramType(type)` → `setMermaidDirectly(template)` → immediate state update (no validation needed for known-good templates)

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

---

## Configuration

### LLM Settings (⚙️)

| Field | Description |
|-------|-------------|
| **Base URL** | Any OpenAI-compatible endpoint (default: `https://api.openai.com/v1`) |
| **API Key** | Your API key (stored locally only) |
| **Model Name** | e.g., `gpt-4o-mini`, `gpt-4o`, `claude-3-sonnet` (if Anthropic-compatible proxy) |
| **Temperature** | 0–2 (default: 0.3). Lower = more deterministic |
| **Maximum Tokens** | Max response length (default: 2048) |

### Prompt Options

When the prompt bar is expanded, two toggle switches are available:

| Option | Description |
|--------|-------------|
| **Include Summary** | When ON, the current text summary is included in the LLM prompt to improve context and reasoning |
| **LLM Generate Summary** | When ON, the LLM outputs both updated Mermaid syntax and an updated text summary (separated by a delimiter) |

Both default to ON for optimal multi-turn editing quality.

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

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl` + `Enter` | Submit AI prompt |
| Scroll wheel | Zoom in/out (diagram view) |
| Click + drag | Pan diagram |

---

## System Prompt

The LLM uses one of four system prompts depending on the toggle settings:

- **Base** — Standard incremental editing (no summary involvement)
- **With Summary Context** — Includes summary in the prompt for better understanding
- **Generate Summary** — Instructs LLM to output both Mermaid code and a text summary separated by `---==DIAGRAMSMITH_SUMMARY_BOUNDARY==---`
- **Generate Summary With Context** — Combines both: receives current summary, uses it for context, and outputs updated Mermaid + updated summary

All variants enforce:
- Modify the existing diagram only
- Preserve node identifiers whenever possible
- Make the smallest possible changes
- Only change the diagram type if explicitly asked
- No markdown code fences, no explanations

---

## Export / Import

| Action | Format | Content |
|--------|--------|---------|
| Export .mmd | `.mmd` (plain text) | Mermaid syntax only |
| Export Project | `.dsmith.json` (JSON) | `{ "mermaid": "...", "summary": "..." }` |
| Import | `.mmd` or `.dsmith.json` | Auto-detects format; imports both mermaid and summary if available |
| Copy | Clipboard | Mermaid syntax only |

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid API key | Toast error: "Invalid API key" |
| Network timeout | Toast error after 30s |
| LLM returns invalid Mermaid | Previous diagram preserved, toast error |
| Malformed LLM response | Code fences stripped automatically; dual output parsed via delimiter |
| Empty LLM response | Toast error |
| Mermaid parse error in editor | Error shown in editor footer |
| Mermaid render failure | "⚠ Render Error" displayed in diagram panel |

---

## Project Budget

All source files are kept under **500 lines** to maintain cognitive complexity:

| File | Lines |
|------|-------|
| App.tsx | ~266 |
| constants.ts | ~227 |
| DiagramView.tsx | ~162 |
| MermaidEditor.tsx | ~163 |
| Toolbar.tsx | ~181 |
| PromptBar.tsx | ~97 |
| SettingsDialog.tsx | ~119 |
| useMermaid.ts | ~101 |
| useLLM.ts | ~40 |
| useToasts.ts | ~24 |
| useTheme.ts | ~33 |
| useDiagramType.ts | ~33 |
| mermaidLanguage.ts | ~72 |

---

## License

ISC