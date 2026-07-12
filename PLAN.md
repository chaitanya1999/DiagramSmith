# FlowSmith – MVP 1 Product Requirements Document

## Overview

FlowSmith is an AI-assisted Mermaid diagram editor.

Unlike existing AI diagram generators, FlowSmith is designed for iterative editing. Users describe changes in natural language, and an LLM updates the existing Mermaid diagram instead of generating a completely new one.

The Mermaid source is the single source of truth.

---

# Goals

Implement a lightweight web application that allows users to:

* Create Mermaid diagrams using natural language.
* Modify existing diagrams using incremental instructions.
* Edit Mermaid code manually.
* Render Mermaid diagrams in real time.
* Connect to any OpenAI-compatible LLM (BYOK).
* Store configuration locally.
* Require no backend.

---

# Non Goals

Do NOT implement:

* Chat interface
* Conversation history
* Version history
* Summary generation
* Diagram diff
* User accounts
* Cloud storage
* Authentication
* Backend database

These belong to future milestones.

---

# Technology Stack

Framework

* React
* TypeScript
* Vite

UI

* Bootstrap

Editor

* CodeMirror 6

Diagram Renderer

* Mermaid.js

Split View

* react-resizable-panels (or similar)

HTTP

* OpenAI-compatible REST API

Storage

* localStorage


---

# Application Layout

Default Mode

Entire screen displays the rendered Mermaid diagram.

A floating prompt bar is positioned at the bottom center.

Top toolbar contains:

* Split View toggle
* Settings button
* New Diagram button
* Import Mermaid
* Export Mermaid

---

Split View

Left side:
Mermaid editor (CodeMirror)

Right side:
Rendered Mermaid diagram

Divider must be draggable.

User may resize both panels.

---

# Floating Prompt

Initially collapsed.

Clicking expands into a multiline text input.

Contains:

Instruction textbox

Cancel button

Generate button

Pressing Ctrl+Enter also submits.

After generation:

Collapse automatically.

---

# LLM Settings

Accessible via Settings dialog.

Fields:

Base URL

API Key

Model Name

Temperature

Maximum Tokens

Save button

Cancel button

Persist to localStorage.

No server-side storage.

---

# Supported Providers

The application must work with any OpenAI-compatible endpoint.

---

# State

Maintain only:

Current Mermaid

Loading State

LLM Configuration

Nothing else.

---

# Mermaid Editing Flow

User enters instruction.

Application sends:

Current Mermaid

User instruction

System prompt

LLM returns updated Mermaid syntax.

Application validates Mermaid.

If valid:

Replace current Mermaid.

Render diagram.

If invalid:

Keep previous Mermaid.

Display error notification.

---

# System Prompt

Use an incremental editing prompt.

Rules:

* Modify existing Mermaid only.
* Preserve node identifiers whenever possible.
* Preserve formatting where practical.
* Make the smallest possible changes.
* Return only Mermaid syntax.
* Never use Markdown code fences.
* Never explain the changes.

---

# Rendering

Diagram updates automatically after every successful edit.

Zoom and pan should be supported if Mermaid allows it.

---

# Manual Editing

User may directly edit Mermaid in CodeMirror.

Diagram rerenders immediately after valid changes.

If Mermaid becomes invalid:

Display parsing error.

Keep editor contents.

Do not crash.

---

# Persistence

Persist automatically:

Current Mermaid

LLM configuration

Restore automatically on reload.

---

# Error Handling

Handle:

Invalid API key

Network timeout

Invalid Mermaid

Malformed LLM response

Unsupported model

Display clear error messages.

Never overwrite a valid diagram with invalid output.

---

# Export

Support:

Export Mermaid (.mmd)

Copy Mermaid

Import Mermaid

---

# Folder Structure

src/

components/

* DiagramView
* MermaidEditor
* PromptBar
* Toolbar
* SettingsDialog

services/

* llm.ts
* storage.ts
* mermaid.ts

hooks/

* useMermaid
* useLLM

types/

utils/

---

# Acceptance Criteria

The application is complete when:

✓ User can create a Mermaid diagram using an LLM.

✓ User can iteratively modify the diagram.

✓ User can manually edit Mermaid.

✓ Split View works.

✓ Settings persist across reloads.

✓ No backend is required.

✓ Works with any OpenAI-compatible API.

✓ Invalid Mermaid never replaces a valid diagram.

✓ Application remains responsive during generation.

---

# Future Roadmap (Not Part of MVP 1)

MVP 2

* Diagram summary
* Summary included in prompts
* Structured JSON LLM responses

MVP 3

* Revision history
* Undo/redo
* Restore revisions

MVP 4

* Mermaid diff viewer

MVP 5

* Project export/import

MVP 6

* React Flow renderer
* ELK layout engine
* Manual node positioning
