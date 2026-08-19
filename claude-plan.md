# DiagramSmith MVP2 — sequenced roadmap

## Context

MVP1 is feature-complete and the core thesis is sound: stateless, BYOK, incremental Mermaid editing with a side-by-side view. A three-part review (LLM/prompting layer, state/persistence, engineering hygiene + UX) surfaced a set of issues where several directly undermine the product's central promise — "incremental refinement with minimal diffs and optimal token usage."

The most important finding: **the system prompt contradicts the seed template.** `BASE_RULES` (constants.ts:249-261) mandates *"All node text must be enclosed in double quotes"*, but `DEFAULT_TEMPLATES.flowchart` (constants.ts:9-13) ships `A[Start] --> B{Is it?}` unquoted — as do the syntax-guide examples. On turn one of every new session the model is told to quote everything while looking at a diagram that quotes nothing, so its "minimal change" legitimately includes rewriting every line. This inflates output tokens (the dominant cost) and produces exactly the large diffs the product exists to avoid.

This roadmap sequences all three tracks in dependency order: correctness → adoption blockers → moat.

---

## Track 1 — Correctness (P0): protect the core promise

**Prompt integrity** (`src/utils/constants.ts`, `src/utils/diagramSyntax.ts`)
- Resolve the quoting contradiction: either quote the seed templates and guide examples, or drop the blanket quoting rule. Recommended: drop it from `BASE_RULES` and move quoting/node-ID/pipe-label rules into the flowchart + swimlane entries of `DIAGRAM_SYNTAX_GUIDES`, since ~4 of 12 base rules are flowchart-only and actively contradict the sankey guide ("no quotes", diagramSyntax.ts:148) and ishikawa guide ("just indented text lines", diagramSyntax.ts:330). Saves ~60 tokens on 27 of 29 types *and* removes the contradiction.
- Fix `getDiagramType` (constants.ts:424-426) to skip YAML frontmatter (`---`), `%%{init:...}%%` directives, and `%%` comments before matching. Return an explicit "unknown" and inject **no** syntax guide and **no** type assertion rather than silently defaulting to flowchart — a confident wrong type is worse than none.
- Strip the stray tab-only lines inside the `wardley`, `cynefin`, and `eventmodeling` templates (constants.ts:175, 204-228) — indentation-sensitive grammars.

**LLM robustness** (`src/services/llm.ts`, `src/hooks/useLLM.ts`)
- Send `max_tokens` — it's configured, clamped, and persisted (`SettingsDialog.tsx:34,46`, `constants.ts:374`) but never reaches the API, and there's no input field for it. Add the field and wire it into `ChatCompletionRequest` (llm.ts:26-30).
- Check `finish_reason`. Today a truncated response silently falls into the "no delimiter" branch (llm.ts:164-171) → `summary: ''` → `useMermaid.ts:79` **wipes the user's summary** behind a success toast.
- Make delimiter matching tolerant (regex, whitespace/case-insensitive) and fence-strip the summary half too (llm.ts:174). Consider `response_format: json_object` where supported to retire delimiter parsing entirely.
- Distinguish user-cancel from timeout (`AbortSignal.reason`) so cancelling stops producing a red error toast (llm.ts:139-141, App.tsx:279).
- Guard the concurrent-request race in `useLLM.ts:84-98`: capture the controller and gate `setError`/`setIsLoading` on still being the current request, otherwise submitting a second prompt kills the spinner and fires a false error.
- Broaden HTTP handling (403/429/402/5xx, 200-with-error-body), truncate error bodies before toasting, and fix the Safari network-error detection (`e.message.includes('fetch')` never matches Safari's "Load failed", llm.ts:142).
- Deduplicate `editDiagram`/`askDiagram` — ~90% identical (llm.ts:81-152 vs 220-279) so every fix above currently needs applying twice.

**State & persistence** (`src/services/storage.ts`, `src/hooks/useVersionHistory.ts`, `src/App.tsx`)
- Stop swallowing `QuotaExceededError` (storage.ts:16,33,53,76,99). Return success/failure, surface a toast, and evict oldest snapshots on failure. Today the app silently stops saving and the user only finds out on reload.
- Fix the duplicate-snapshot bug: `llmBusyCounterRef` (App.tsx:189-214) decrements in a microtask before React commits the state update, so the snapshot effect (App.tsx:305) also records a redundant `manual` snapshot after every LLM generation — doubling storage and halving effective history depth. Track provenance in the action itself rather than via a mutable ref.
- Wire `handleSetMaxSnapshots`: the hook exposes it (useVersionHistory.ts:188) but `App.tsx:58-65` never destructures it, so the Settings slider has no effect until reload.
- Add a confirmation to the diagram-type dropdown (Toolbar.tsx:128 → App.tsx:93-102) — it silently replaces the document and blanks the summary, and can overwrite the only snapshot holding the previous work.
- Validate rehydrated data in `loadVersionHistory` (storage.ts:58-71): per-snapshot shape and `activeIndex` range, or corrupt data crashes the render.
- Move `restoringRef`/`pendingEditRef` provenance logic out of effects; `window.confirm` inside a commit-phase effect (App.tsx:313) runs *after* the edit is already persisted.

**Security** (`src/services/mermaid.ts`, `index.html`)
- Move off `securityLevel: 'loose'` (mermaid.ts:8) to `strict`, or sanitize before `dangerouslySetInnerHTML` (DiagramView.tsx:200). Under `loose`, `click X "javascript:..."` in an imported `.mmd` or LLM response yields an un-sanitized `javascript:` href, and the API key sits in plaintext localStorage on a **shared `*.github.io` origin**.
- Add a CSP meta tag, and offer `sessionStorage` as an API-key option with a clear note about plaintext persistence.

**Typing/tooling**: enable `"strict": true` in `tsconfig.app.json` (currently absent), enable `react-hooks/exhaustive-deps` in `.oxlintrc.json` (two `eslint-disable` comments exist for a rule that isn't on), and drop the stale `@types/react-bootstrap@^1` stub.

---

## Track 2 — Adoption blockers (P1)

- **PNG/SVG export** — the single sharpest gap. The rendered SVG is already in state at `DiagramView.tsx:21`; an SVG download plus a canvas-based PNG is a small change. "I can't paste this into a doc" is the first wall a new user hits. Add copy-image-to-clipboard alongside it.
- **Multi-diagram support** — storage is currently one scalar key per concern (constants.ts:379-382). Introduce a document index + per-document keys, thread an `activeDocId` through `useMermaid`/`useVersionHistory`, and add a document switcher. Plan for the provenance refs in App.tsx breaking on switch (a doc change looks like a manual edit).
- **Complete the backup story** — `Export Project` writes only `{mermaid, summary}` (App.tsx:115); include version history, diagram type, and a schema `version` field for forward compat. Add an "export all documents" action.
- **Responsive layout** — `index.css` has **zero** `@media` queries in 841 lines; the split view gives two ~180px columns on a phone. Add a breakpoint that stacks or tabs the panes, and let the toolbar wrap/overflow.
- **Repo & launch essentials** — add the missing `LICENSE` file (README claims ISC but GitHub currently shows none, blocking reuse), link the live demo (`https://<user>.github.io/DiagramSmith/`) in the README, add screenshots/GIF to `public/`, fill in `package.json` metadata, add `og:`/`twitter:` meta tags to `index.html` for link previews, and add a CI workflow running build + lint + test.
- **Accessibility basics** — `role="img"` + `aria-label` on the rendered SVG (the Text Summary is the ideal accessible description and is currently unlinked), `aria-label` on emoji-only buttons, and bind `aria-expanded` to real state (PromptBar.tsx:110 hardcodes `false`).
- **Preserve pan/zoom across renders** — the Panzoom effect keys on `[svg]` (DiagramView.tsx:103) and re-creates at `DEFAULT_SCALE`, so zoom/pan resets ~400ms after every keystroke. Add fit-to-view (Reset currently jumps to 250%, not fit).
- **Connection test in Settings** — a "Test connection" button and optional `GET /v1/models` listing; today a typo'd model or a CORS-blocked endpoint surfaces as an opaque failure after a wasted request.

---

## Track 3 — Moat (P2): make the token claim decisive

- **Diff/patch output** — the biggest single win. The prompt already asks for "smallest possible changes" but demands the whole diagram back; output tokens are priced 3-4× input and dominate cost. A line-anchored patch format (`REPLACE:`/`WITH:`) cuts output 60-90% on large diagrams, with the existing validator (`useMermaid.validate`) as the fallback trigger for a full-rewrite retry. **Depends on Track 1's prompt fix** — while the rules contradict the templates, a full rewrite is the model's honest answer.
- **Streaming** (`stream: true`) — fixes the blind 5-minute spinner, enables early truncation detection, and allows stopping at the summary delimiter.
- **Conditional summary regeneration** — `generateSummary` is unconditional (App.tsx:163), so "make the arrows dotted" burns ~200 output tokens rewriting an unchanged summary. Let the model emit `SUMMARY: UNCHANGED`.
- **Prompt-cache threshold** — the system prompt is ~520-570 tokens against the ~1,024-token minimum prefix for automatic caching, i.e. currently too big to be minimal and too small to cache. Message ordering is already correct (stable system first, volatile diagram second), so deliberately enriching to cross 1,024 would make repeat turns *cheaper*, not dearer. Worth measuring both ways.
- **Shorten `SUMMARY_DELIMITER`** — `---==DIAGRAMSMITH_SUMMARY_BOUNDARY==---` tokenizes to ~15 tokens and appears 3× per turn (~45 tokens); `<<<SUMMARY>>>` is ~5.
- **Default `temperature: 0`** for a deterministic editing task (currently 0.3), guarding against reasoning models that reject non-`1` temperature — which is exactly what the unreachable `unsupported_model` error code was for.
- **Add a token/cost meter** — since "optimum token consumption" is the headline claim, show measured input/output tokens and estimated cost per turn from the API's `usage` field. It turns an assertion into a visible, verifiable feature.
- **Test coverage for the above** — the only existing test is a fixture-consistency check; `parseDualOutput`, `cleanMermaidCode`, snapshot trimming, storage round-trips, and `getDiagramType` aliases/frontmatter are all untested. Add `@testing-library/react` and cover the parsing and history logic before refactoring them.

---

## Verification

1. `npm run lint`, `npm run test`, `npx tsc --noEmit`, `npm run build` clean after each track.
2. **Track 1**: with a fresh localStorage, submit a one-node edit on the default flowchart and confirm the returned diff touches only the intended line (regression test for the diff-amplification bug). Force a truncated response (`max_tokens: 32`) and confirm the summary is preserved and a truncation warning appears. Fill localStorage near quota and confirm a visible error rather than silent loss. Confirm one LLM generation creates exactly one snapshot. Change Max Snapshots and confirm it takes effect without reload. Import a `.mmd` containing a `click` directive with a `javascript:` URL and confirm it is neutralized.
3. **Track 2**: export PNG/SVG and confirm the file opens correctly in both themes; create/switch/delete multiple documents and confirm histories stay isolated; load at 375px width and confirm both panes are usable; confirm the demo link, LICENSE, and CI badge are live.
4. **Track 3**: instrument token counts before/after patch-mode on a 200-line diagram and confirm the output-token reduction; verify streaming renders incrementally and cancel works mid-stream.
