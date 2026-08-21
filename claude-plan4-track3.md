# Track 3 — decisions

Reviewed 2026-08-21. Track 3 of `claude-plan.md` ("make the token claim decisive"),
triaged item by item. Tracks 1 and 2 are complete; this is what remains.

| # | Item | Verdict | Why | Time |
|---|---|---|---|---|
| 1 | Diff/patch output | ⏸️ **Defer** | Valid-but-wrong patches corrupt silently; needs retry path + own plan file | Hours |
| 2 | Streaming | ❌ Skip | Novelty; conflicts with delimiter parsing — nothing renders until the full response arrives anyway | — |
| 3 | Conditional summary regen | 🔸 Optional | The *LLM Generate Summary* toggle covers the common case; saves ~200 tokens when left ON | ~20 min |
| 4 | Prompt-cache threshold | 🔸 Deprioritise | Provider-specific; padding wastes tokens on local models. Message ordering is already correct | ~30 min + measuring |
| 5 | Shorten `SUMMARY_DELIMITER` | ❌ Skip as proposed | `<<<SUMMARY>>>` collapses the fuzzy matcher to the bare word "summary" → false splits. Saves only ~30 tokens/turn | — |
| 6 | Default `temperature: 0` | ✅ **Do** | One line + README. Deterministic editing task | 2 min |
| 7 | Token meter | ✅ **Do** | Read `usage` from the response; "not reported" when absent. Show in the existing 🕘 History dialog. No cost table | ~15 min |
| 8 | Test coverage | ✅ Mostly done | 351 tests already. Remaining gap: `getDiagramType` aliases/frontmatter | ~15 min |

**Low-risk pairings for a short session:** 6 + 7 (~20 min) or 6 + 8 (~17 min). Both leave the
diagram-mutation path untouched, so a direct push to `main` is low risk.

---

## Notes worth keeping

### 1 — Diff/patch (the big one)

The hard part is that the model may return either a patch *or* a whole diagram. **Do not let it
choose** — the app should decide the mode, instruct it, and validate that the reply matches the
expected shape, with full-rewrite as the fallback.

The danger is specific: `validate()` only catches *invalid* Mermaid. A patch applied to the wrong
lines can produce **valid Mermaid that is silently wrong**. Version history mitigates but only if
the user notices.

Needs: patch format in the system prompt, parser, applier, shape detection, a retry path (a second
API call, so new loading/abort/error handling in `useLLM`), plus interaction with dual-output summary
parsing, snapshots and truncation. Small models mangle structured formats, so it needs testing across
several. The 60–90% output saving is the plan's estimate, not a measurement — worth instrumenting the
token meter (item 7) **first** so the benefit can actually be proven.

### 5 — Why the shorter delimiter breaks

`parseDualOutput` builds its tolerant matcher by stripping non-alphanumerics from the constant
(`src/services/llm.ts`, `DELIMITER_PATTERN`):

```
---==DIAGRAMSMITH_SUMMARY_BOUNDARY==---  →  DIAGRAMSMITH[\s_-]*SUMMARY[\s_-]*BOUNDARY   ← distinctive
<<<SUMMARY>>>                            →  SUMMARY                                     ← matches anywhere
```

The short form would split on the word "summary" appearing in the summary text, in a node labelled
`Summary`, anywhere. If this is ever revisited, keep a distinctive multi-word core
(e.g. `<<<DSMITH_SUMMARY>>>`) **and** revise the matcher to require the bracket decoration.

### 7 — Token meter details

Source is the `usage` object in the response JSON:

```json
"usage": { "prompt_tokens": 812, "completion_tokens": 240, "total_tokens": 1052 }
```

It is optional in the OpenAI-compatible spec, and minimal endpoints omit it. When absent, display
**"not reported"** — never estimate and present a guess as measured, especially when token efficiency
is the product's headline claim.

`usage` is **not currently plumbed**: `ChatCompletionResponse` in `src/services/llm.ts` declares only
`choices` and `error`. Skip cost estimation for now — it needs a per-model price table that varies by
provider and goes stale, and is meaningless for local models.
