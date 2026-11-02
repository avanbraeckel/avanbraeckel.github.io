# Iteration 2: Accessibility (WCAG 2.2 AA) and legacy decoupling

Target: **WCAG 2.2 Level AA** on every route of the static export (`site/out/`).
AODA's website requirement (WCAG 2.0 AA) does not legally apply to a personal
site, but 2.2 AA is a strict superset and is the bar we hold ourselves to.

Scope (from the brainstorm): items **1, 2, 4, 8**.

| Ticket | Item | Summary                                                         |
| ------ | ---- | --------------------------------------------------------------- |
| A      | 1    | Pause control for all ambient animation (WCAG 2.2.2)            |
| B      | 2    | Real-browser axe audit (all routes × themes × viewports), contrast fixes, CI |
| C      | 4    | Transient player keyboard/focus audit and fixes                 |
| D      | 8    | Decouple the build from the legacy root folders                 |

Decisions already made by the owner:

- The pause control is an **icon button in the nav bar** (desktop bar and the
  mobile nav sheet).
- If contrast fails, **adjust the failing color tokens minimally** (no approval
  round needed); report before/after values.

## Ground rules for every ticket (read first)

1. **Do not commit, push, or run any git command that changes state.** The owner
   commits manually. `git status`/`git diff` are fine.
2. **File ownership.** Edit only the files your ticket owns (listed per
   ticket). If you need a change in a file you don't own, stop and describe the
   exact change in your final report instead; the orchestrator applies it.
3. **Never run `npm run build`, `npm run dev`, or `next` inside the real
   `site/` folder**: other agents work there in parallel, and builds share
   `.next/` and `out/`. To build, use your private sandbox:

   ```bash
   /tmp/claude-1000/-home-avanbraeckel-code-avanbraeckel-github-io/e3a0ddb9-5899-4f69-8584-98220db2e6e8/scratchpad/sandbox.sh <ticket-letter>
   # copies the current site/ into ~/.cache/avb-sandboxes/<letter>/site and builds it
   # → ~/.cache/avb-sandboxes/<letter>/site/out
   ```

   Serve it on your ticket's port (A 4201, B 4202, C 4203, D 4204) and stop it
   by the PID you captured, never with `pkill -f` (that can kill your own shell):

   ```bash
   cd ~/.cache/avb-sandboxes/<letter>/site && (npx serve out -l <port> >/dev/null 2>&1 & echo $! > ../serve.pid)
   # ...later
   kill "$(cat ~/.cache/avb-sandboxes/<letter>/serve.pid)"
   ```

   (`serve` supports HTTP Range, which CheerpJ needs.)
4. **Commands** (run from `site/`; use npm 10: `export PATH=~/.local/bin:$PATH`):
   `npx vitest run <paths>` for your tests, `npm run lint`, `npm run typecheck`,
   `npx prettier --write <your files>`. Run the full `npm test` once at the end.
5. **Headless Chromium** needs
   `LD_LIBRARY_PATH=/home/avanbraeckel/.local/chromium-libs/root/usr/lib/x86_64-linux-gnu`.
   Put throwaway Playwright scripts in the scratchpad, not in the repo, unless
   the ticket says to commit one. Playwright resolves from `site/node_modules`,
   so run scripts with `NODE_PATH=site/node_modules` or copy them into the
   sandbox's `site/` before running.
6. **Conventions** (see `CLAUDE.md` and `.claude/skills/AppleDesign/SKILL.md`):
   - CSS Modules plus design tokens, and `motion/react`.
   - Tests sit next to the code (Vitest, Testing Library, vitest-axe).
   - Match the surrounding code's comment density and naming.
   - Code and comments stay professional.
   - Never invent facts about the owner in copy.
7. **Final report** (your last message): files changed, what you verified and
   how (commands and results), anything unverified, and any change requested
   in files you don't own.

---

## Ticket A: Pause control for ambient animation (WCAG 2.2.2 Pause, Stop, Hide)

**Problem.** The WebGL background drifts forever (`idleAfterMs: Infinity`) and
the footer `SpriteRunner` loops indefinitely. Both start automatically, last
more than 5 seconds, and sit alongside content, so WCAG 2.2.2 requires a
mechanism to pause them. Honouring `prefers-reduced-motion` alone does not
satisfy 2.2.2. Looping `PixelSprite` animations (home `TransientFeature`, 404)
are in scope too.

**Owns:**
- `src/design/ambientMotion.ts` + `.test.ts` (new)
- `src/components/shell/MotionToggle.tsx` + `.module.css` + `.test.tsx` (new)
- `src/components/shell/SiteNav.tsx` + `.module.css`
- `src/components/shell/NavSheet.tsx` + `.module.css`
- `src/components/shell/index.ts`
- `src/components/shell/shell.test.tsx`
- `src/background/LivingBackground.tsx` + `.test.tsx`
- `src/components/sprite/*` (PixelSprite, SpriteRunner, their CSS and tests)
- `src/app/layout.tsx`
- `src/components/ui/Icon.tsx` (to add `pause` and `play` glyphs; reuse the existing `play` if it fits)

**Design.**
1. `ambientMotion.ts`: a tiny external store for the user's choice.
   - It holds `paused: boolean`, persisted in `localStorage` under the key
     `avb:ambient-motion` (`"paused"` or absent).
   - Wrap every storage access in try/catch.
   - It mirrors the state to `document.documentElement.dataset.ambientMotion = "paused"`
     (removing the attribute when playing), so CSS can react.
   - It exports `getAmbientMotionPaused()`, `setAmbientMotionPaused(next)`,
     `subscribeAmbientMotion(cb)` and a `useAmbientMotionPaused()` hook built on
     `useSyncExternalStore`.
   - The hook's server snapshot is `false`.
   - The store also syncs across tabs via the `storage` event.
2. **No flash of motion on load when paused.** Add a tiny inline `<script>` in
   `layout.tsx` `<head>` that reads the key and sets the `<html>` attribute
   before first paint.
   - Keep it a minimal, try/catch-wrapped string constant, exported from
     `ambientMotion.ts` so the key lives in one place.
   - Add `suppressHydrationWarning` on `<html>`, since the attribute differs
     from the server HTML.
3. `LivingBackground`:
   - When paused, call `loop.setPaused("user", true)`. The field freezes on its
     current frame; it does not reset.
   - On resume, call `setPaused("user", false)` and wake the loop.
   - The canvas must still redraw on resize and theme change while paused, the
     same way the reduced-motion path does.
   - Reduced motion stays exactly as it is (one still frame).
4. Sprites:
   - Under `html[data-ambient-motion="paused"]`, `SpriteRunner` behaves like
     reduced motion: idle at the left end, no travel.
   - `PixelSprite` frame cycling stops (`animation-play-state: paused` or the
     reduced-motion still frame, whichever matches existing CSS best).
   - Prefer pure CSS keyed off the attribute, so it works before hydration.
5. `MotionToggle` (nav):
   - A `<button type="button">` with `aria-pressed={paused}` and a stable
     accessible name, "Pause animations". `aria-pressed` conveys the state, so
     the label must not flip.
   - The icon swaps between pause and play glyphs.
   - It needs a tooltip-like `title`, or a visible label in the mobile sheet.
   - Size it to at least a 24×24 CSS px target (WCAG 2.5.8); match the nav's
     2rem pill height and hover/press styles (`.link` in `SiteNav.module.css`).
   - Desktop: place it in the nav bar, between the links and the Résumé button.
   - Mobile: a row in the nav sheet, e.g. "Pause animations" with a switch-like
     pressed state. The sheet already has the radix Dialog focus handling.
   - Hide the toggle under `prefers-reduced-motion: reduce` with a CSS media
     query, since nothing moves there.
   - Respect reduced transparency and contrast like the other nav controls.
6. Tests:
   - Store: persistence, the attribute mirror, storage-event sync, and
     try/catch when `localStorage` throws.
   - Toggle: role, name, `aria-pressed` flips on click and keyboard, and the
     state is persisted.
   - `LivingBackground`: `setPaused("user", …)` is called. Use the existing test
     file's mocking approach.
   - Nav: the toggle renders in both the desktop nav and the sheet.
   - Keep the vitest-axe checks passing.

**Acceptance criteria:**
- [ ] One click on the nav toggle freezes the background and the footer runner
  within one frame, and all looping sprites stop. A second click resumes them.
- [ ] The choice survives reload and navigation, and there is no flash of
  motion on reload when paused.
- [ ] The toggle is keyboard-operable, has a visible focus ring, is named
  "Pause animations", exposes `aria-pressed`, and has a target of at least 24px.
- [ ] Under `prefers-reduced-motion` nothing changes from today, and the
  toggle is hidden.
- [ ] Unit tests cover everything above. Lint, typecheck and the full
  `npm test` pass.
- [ ] Verified in the sandbox (port 4201) with Playwright:
  - The canvas pixels stop changing while paused (compare two `toDataURL`
    samples taken 1s apart) and change again on resume.
  - The attribute is set before hydration on reload (read it from a
    `DOMContentLoaded` hook via `page.addInitScript`).
  - Light and dark screenshots of the toggle (desktop and the mobile sheet)
    are in the scratchpad.

---

## Ticket B: Real-browser accessibility audit, contrast fixes, CI gate

**Problem.** Our axe checks run in jsdom with `color-contrast` disabled.
`tokens.test.ts` checks text tokens on solid surfaces only. Nothing checks
the rendered pages, text over the translucent nav material or the animated
background, or text on photos and gradients.

**Owns:**
- `scripts/a11y-audit.mjs` (new; committed)
- `package.json` + `package-lock.json` (add the devDependency `@axe-core/playwright` and an `"a11y"` script)
- `src/design/tokens.css`, `src/design/tokens.test.ts`
- `src/background/palette.ts` (only if needed), `src/background/palette.test.ts`
- `.github/workflows/ci.yml`
- Any `*.module.css` **except** the ones ticket A owns (`SiteNav`, `NavSheet`,
  `MotionToggle`, `SpriteRunner`, `PixelSprite`) and ticket C's
  `TransientPlayer.module.css`. Report needed changes in those instead.

**Design.**
1. `scripts/a11y-audit.mjs`, modelled on `scripts/screenshot.mjs` (reuse its
   route discovery and static server, or its `--base-url` mode):
   - Routes: every HTML page in `out/`, including 404 and each case study.
   - Matrix: {desktop 1440×900, mobile 390×844} × {light, dark}. Add one more
     pass with `forcedColors: "active"` on desktop light, for a smoke check.
   - For each, scroll through the page so lazy and reveal content renders, then
     run `AxeBuilder` with the tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`.
   - Output a readable console summary (route, matrix cell, rule, impact,
     target, and a failure-summary snippet) plus JSON at `.a11y/report.json`.
     Add `.a11y/` to `site/.gitignore`; Ticket B owns that line.
   - Exit non-zero on any violation. `incomplete` results are listed separately
     as "needs review" and do not fail.
   - It sets `LD_LIBRARY_PATH` itself, like `screenshot.mjs`.
   - Flags: `--base-url`, `--routes`.
   - `npm run a11y` runs it against `out/`.
2. **Text over the animated background.** axe reports text over the canvas as
   `incomplete`, so verify it analytically.
   - Extend `palette.test.ts`, or add a test, that computes the field's
     **extreme colors** for each theme from `simulation.ts`/`shader.ts`: the
     strongest line or tint color mixed over `--bg` at its maximum alpha.
   - Assert that `--fg-secondary`, `--fg-tertiary` (if used for text) and
     `--accent` still meet 4.5:1 against those.
   - If reading the shader is impractical, sample real pixels instead: in the
     audit run, screenshot with all text hidden (`* { color: transparent }`)
     and compute the contrast of each text element's color against the
     lightest and darkest pixel under its box.
3. **Fix every violation** with the smallest change:
   - Prefer token tweaks in `tokens.css`, nudging only the failing token's
     lightness, for both themes and the `[data-theme]` blocks.
   - Keep `tokens.test.ts`'s expectations in sync.
   - Then add the nav material (`--material-regular` over the worst-case page
     content) as a surface in `tokens.test.ts` if that's feasible.
4. CI: add an `a11y` step to `ci.yml` after `npm run build`:
   - `npx playwright install --with-deps chromium`, then `npm run a11y`.
   - Free on GitHub-hosted runners. Set `LD_LIBRARY_PATH` only when the local
     path exists, so CI doesn't break.
5. Record each token change, before → after with contrast ratios, in your
   report.

**Acceptance criteria:**
- [ ] `npm run a11y` against the sandbox build (port 4202) reports **0
  violations** across all routes and matrix cells, after fixes.
- [ ] The "needs review" items are listed in the report with your manual
  verdicts.
- [ ] Text-over-background contrast is verified for both themes, by test or by
  pixel sampling, and documented.
- [ ] Token changes are minimal and listed. `tokens.test.ts` and the full
  `npm test` pass, and lint and typecheck pass.
- [ ] `ci.yml` runs the audit. The YAML is valid (check with `npx js-yaml` or
  by careful review).

---

## Ticket C: Transient player keyboard and focus audit

**Problem.** The game is keyboard-only and runs inside CheerpJ (a Java VM).
WCAG 2.1.2 (No Keyboard Trap) applies: a keyboard user must be able to leave
the game with standard keys, or be told how. The controls around the game
(play, fullscreen, help, close/exit) must be fully keyboard-operable with
visible focus (2.1.1, 2.4.7, 2.4.11). Status changes (loading, error) should be
announced (4.1.3). People who can't play need the information conveyed some
other way (1.1.1: the poster and description).

**Owns:**
- `src/components/projects/TransientPlayer.tsx`, `.module.css`, `.test.tsx`
- `src/components/projects/transientRuntime.ts`, `.test.ts`
- `src/app/projects/transient/page.tsx` (+ its CSS module and test, if any)

**Must not change:** the CheerpJ license notice or the "Built with CheerpJ"
credit (see `CLAUDE.md`). Don't hide, restyle or cover them.

**Steps.**
1. Build the sandbox (`sandbox.sh C`) and serve it on port 4203.
2. Write a Playwright audit script in the scratchpad. Use a real network:
   CheerpJ loads from its CDN on click. It should:
   - Tab from the top of `/projects/transient/` to the play button. Check that
     focus is visible: there is a focus ring, it isn't clipped, and it has at
     least 3:1 contrast against the poster.
   - Activate play with Enter and with Space.
   - While loading, check that progress is exposed (`role=progressbar` with a
     value) and that the loading/ready/error status reaches a live region.
   - Once running, press Tab and Shift+Tab repeatedly, and record where focus
     goes. **Does focus escape the game canvas?** Java AWT may consume Tab for
     its own focus traversal.
   - Test Escape, both inline and in fullscreen.
   - Test the fullscreen toggle and the help/controls toggle by keyboard, and
     check their `aria-pressed`/`aria-expanded`.
   - Check that the retry/reload error buttons are reachable.
3. Fix what fails.
   - If Tab is trapped, add a documented escape. For example, intercept
     `Escape` in the capture phase on the player's wrapper to blur the game and
     move focus to the next control. Show the hint "Press Esc to leave the
     game" visually and to screen readers via `aria-describedby`, as a small
     overlay chip near the controls.
   - The game itself doesn't use Esc. Verify that in its controls list on the
     page; if the game *does* use Esc, choose another documented key and
     explain why.
   - Make sure the game area has an accessible name and a short description of
     what it is (it already has `aria-label`; add `aria-describedby` to the
     controls list).
   - Make sure focus returns somewhere sensible when the player closes or
     errors.
4. Confirm the poster image has meaningful alt text and the page describes the
   game for someone who can't play it.
   - The page already has a description, screenshots and a controls list;
     note any gap.
   - Don't invent facts about the game. Use only what's already on the page
     or in `src/content/projects.ts`.
5. Unit tests for anything testable in jsdom:
   - The Esc handler moves focus.
   - The hint is linked via `aria-describedby`.
   - Status lands in a live region.
   - Keep the vitest-axe checks passing.

**Acceptance criteria:**
- [ ] A keyboard-only user can start the game, play it, leave it (Esc, or the
  documented key) and reach the rest of the page, with visible focus
  throughout. This is verified by the Playwright script; include its output
  in the report.
- [ ] Loading, ready and error states are announced politely.
- [ ] The CheerpJ notice and credit are untouched.
- [ ] Unit tests added. Lint, typecheck and the full `npm test` pass.

---

## Ticket D: Decouple the build from the legacy root folders

**Problem.** `site/media-sources.json` points every image at the legacy
`images/` folder at the repo root. `extract-sprites.mjs` and
`prepare-transient.mjs` try `assets/` before `archive/transient/`. Deleting
the legacy site (pending owner approval) would break the build. `archive/images/`
already holds byte-identical copies (`diff -rq images archive/images` is
clean).

**Owns:**
- `site/media-sources.json`
- `site/scripts/optimize-images.mjs`, `extract-sprites.mjs`, `prepare-transient.mjs`
- A new test `site/src/media/sources.test.ts`
- The repo-root `CLAUDE.md` (Repository layout and Site architecture lines
  about these paths only)

**Steps.**
1. Repoint every `src` in `media-sources.json` from `images/…` to
   `archive/images/…`. Re-run `node scripts/optimize-images.mjs` (that's
   allowed in the real `site/`, since it touches only `public/media` and the
   manifest).
   - **Confirm `src/media/manifest.json` is unchanged:** hashes come from
     source bytes plus settings, so `git diff`/`cmp` against a copy saved
     beforehand should show nothing.
   - If the paths *do* change the hashes, report that and stop.
2. In `extract-sprites.mjs` and `prepare-transient.mjs`, make
   `archive/transient/TRANSIENT-DISTRIBUTABLE.zip` the **first** candidate.
   Keep `assets/` as a fallback until the legacy folder is gone, and update
   the comments.
3. Add `src/media/sources.test.ts` with two checks:
   - Every `src` in `media-sources.json` exists and lives under `archive/` or
     `site/media-src/`, never `images/`, `assets/` or `react-app/`.
   - Grep-style: no file in `site/scripts/` references the legacy root folders
     except the documented fallback lines.
4. **Prove it builds without the legacy folders.**
   - Create a sandbox manually rather than with `sandbox.sh`, which symlinks
     `images` and `assets`: copy it to `~/.cache/avb-sandboxes/D-nolegacy/`
     with only the `archive` symlink and no `images` or `assets`.
   - Run the build there, then serve it on port 4204.
   - Spot-check with Playwright that `/`, `/about/`, `/experience/ncr/` and
     `/projects/transient/` render their images (no broken `<img>`:
     `naturalWidth > 0`).
5. Update `CLAUDE.md` so it no longer says the build depends on root folders,
   and fix the `prepare-transient` fallback sentence to match.

**Acceptance criteria:**
- [ ] No build input references `images/` or `assets/`, except the documented
  Transient zip fallback.
- [ ] `manifest.json` is byte-identical before and after.
- [ ] The build succeeds in a copy of the repo with **no** `images/` or
  `assets/`, and the pages render their images.
- [ ] The new test, lint, typecheck and full `npm test` pass.

---

## Orchestrator (after A–D report back)

1. Review each diff for scope creep, conventions and correctness. Apply any
   cross-ticket changes the agents reported.
2. Make one integrated sandbox build (`sandbox.sh final`) and run:
   - `npm run a11y`: 0 violations.
   - A Playwright walkthrough of every route:
     - Pause toggle: the canvas freezes, the runner idles, the state persists
       across reload and navigation, and the mobile sheet toggle works.
     - Transient: a keyboard-only start and exit.
     - Reduced-motion and forced-colors smoke passes.
   - `npm run screenshot` for visual regression review: light/dark ×
     desktop/mobile.
3. In the real `site/`, after all agents are done: `npm run lint`,
   `format:check`, `typecheck`, `npm test`, `npm run build`.
4. Report to the owner:
   - What changed.
   - Before/after token values.
   - Anything that needs a manual check: VoiceOver on iPhone, NVDA on Windows,
     and Safari.

## Out of scope (noted for later)

- Captions on the YouTube music video (owner, on YouTube).
- Manual screen-reader passes (owner).
- An accessibility statement page.
- Résumé PDF tagging.
- Safari/Firefox testing.
