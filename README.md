# DiagramSmith

**DiagramSmith** is an AI-assisted diagram editor for Mermaid.js diagrams. Unlike one-shot AI diagram generators, DiagramSmith is designed for **iterative editing** — you describe changes in natural language, and an LLM updates the existing diagram incrementally.

The Mermaid source code is the **single source of truth** — you can edit it manually, or let the AI modify it for you. No backend is required.

---

## Features

- **🤖 AI-Powered Editing** — Modify diagrams using natural language instructions via the floating prompt bar
- **✏️ Manual Editing** — Full CodeMirror 6 editor with syntax highlighting, real-time validation, and parse error display
- **📊 12 Diagram Types** — Flowchart, Sequence, Class, State, ER, Gantt, Pie, Gitgraph, Journey, Mindmap, Timeline, Sankey
- **🔀 Split View** — Side-by-side editor and rendered diagram with draggable resizable panels
- **🔍 Pan & Zoom** — Scroll to zoom, click-and-drag to pan, with floating zoom controls
- **🌙 Dark / Light Mode** — Toggleable theme persisted to localStorage
- **⚙️ Bring Your Own Key** — Connect to any OpenAI-compatible LLM endpoint
- **💾 Local Persistence** — Diagram code and LLM config saved automatically to localStorage
- **📥 📤 Export & Import** — Export as `.mmd` file, copy to clipboard, import from `.mmd` files
- **⚠️ Safe by Design** — Invalid Mermaid never overwrites a valid diagram

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19, TypeScript |
| Build | Vite 5 |
| UI | Bootstrap 5.3 + react-bootstrap |
| Editor | CodeMirror 6 with YAML language support |
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
├── App.tsx                         # Root orchestrator (~192 lines)
├── index.css                       # Bootstrap import + dark/light mode CSS
│
├── components/
│   ├── DiagramView.tsx             # Mermaid SVG renderer + pan/zoom controls
│   ├── MermaidEditor.tsx           # CodeMirror 6 editor with theme support
│   ├── PromptBar.tsx               # Floating bottom-center prompt (collapsible)
│   ├── Toolbar.tsx                 # Top toolbar: split view, diagram type dropdown, theme toggle, actions
│   └── SettingsDialog.tsx          # LLM configuration modal (Base URL, API Key, Model, etc.)
│
├── hooks/
│   ├── useMermaid.ts               # Diagram state, validation, persistence, LLM/editor update flow
│   ├── useLLM.ts                   # LLM generation: loading, error handling, API calls
│   ├── useToasts.ts                # Toast notification state management
│   ├── useTheme.ts                 # Dark/light mode state + localStorage persistence
│   └── useDiagramType.ts           # Diagram type tracking + template switching
│
├── services/
│   ├── llm.ts                      # OpenAI-compatible chat completions API client
│   ├── mermaid.ts                  # Mermaid parse/validate/render wrappers, theme initialization
│   └── storage.ts                  # localStorage read/write helpers
│
├── types/
│   └── index.ts                    # TypeScript types + diagram display names/icons
│
└── utils/
    └── constants.ts                # Default templates (12 types), system prompt, storage keys, config
```

### Component Tree

```
App
├── Toolbar
│   ├── Split View toggle
│   ├── Diagram Type dropdown (Bootstrap Dropdown)
│   ├── Import / Copy / Export buttons
│   ├── Theme toggle (🌙/☀️)
│   └── Settings button (⚙️)
├── [Split View]
│   ├── MermaidEditor (left panel)
│   ├── Separator (draggable)
│   └── DiagramView (right panel)
├── [Diagram View]
│   └── DiagramView (full screen)
├── PromptBar (floating, collapsible)
└── SettingsDialog (modal)
```

### Data Flow

1. **LLM Flow**: PromptBar → `useLLM.generate()` → `services/llm.editDiagram()` → OpenAI API → validate → update state → re-render
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

The LLM uses a carefully crafted system prompt for incremental editing:

- Modifies the existing diagram only
- Preserves node identifiers whenever possible
- Makes the smallest possible changes
- Only changes the diagram type if explicitly asked
- Returns only Mermaid syntax (no markdown fences, no explanations)

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid API key | Toast error: "Invalid API key" |
| Network timeout | Toast error after 30s |
| LLM returns invalid Mermaid | Previous diagram preserved, toast error |
| Malformed LLM response | Code fences stripped automatically |
| Empty LLM response | Toast error |
| Mermaid parse error in editor | Error shown in editor footer |
| Mermaid render failure | "⚠ Render Error" displayed in diagram panel |

---

## Project Budget

All source files are kept under **500 lines** to maintain cognitive complexity:

| File | Lines |
|------|-------|
| App.tsx | ~192 |
| constants.ts | ~152 |
| DiagramView.tsx | ~160 |
| MermaidEditor.tsx | ~126 |
| Toolbar.tsx | ~153 |
| PromptBar.tsx | ~97 |
| SettingsDialog.tsx | ~119 |
| useMermaid.ts | ~97 |
| useToasts.ts | ~24 |
| useTheme.ts | ~33 |
| useDiagramType.ts | ~33 |

---

## License

ISC