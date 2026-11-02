# Revamp Tickets (iteration 1)

Execution tickets for [PLAN.md](PLAN.md). Each ticket is executed by one agent, in the order below. Tickets on the same line in the sequence can run in parallel because they own disjoint files.

**Sequence:** T01 + T02 → T03 → T04 + T05 + T06 → T07 + T08 → T09 → T10 → T11 → T12 → T13

## Shared conventions (apply to every ticket)

- **Location:** the new app lives in `site/`. Don't touch the legacy files at the repo root or `react-app/` unless the ticket says so.
- **Git:** never run `git commit`, `git push`, `git stash`, `git reset`, or `git checkout`. The owner commits manually.
- **Stack:** Next.js 16 (App Router, `src/` dir, TypeScript strict), `output: 'export'`, npm, CSS Modules + design tokens (no Tailwind, no MUI, no styled-components), `motion` (`motion/react`) for animation, `radix-ui` for accessible primitives, Vitest + Testing Library + jsdom for tests.
- **Fonts:** stack is `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif`, with Inter Variable self-hosted (woff2, OFL) as the fallback for non-Apple platforms.
- **Design:** follow `.claude/skills/AppleDesign/SKILL.md`. Critically damped springs by default, bounce only after momentum gestures, feedback on pointer-down, interruptible motion, compositor-only properties, and honor `prefers-reduced-motion` / `-transparency` / `-contrast`.
- **Headless browser:** for visual checks use Playwright Chromium. Run `export LD_LIBRARY_PATH=/home/avanbraeckel/.local/chromium-libs/root/usr/lib/x86_64-linux-gnu` first. The browser is already in `~/.cache/ms-playwright`, so pin `playwright@1.64.1`. For WebGL, launch with `--use-angle=swiftshader --enable-unsafe-swiftshader`.
- **Definition of done:** `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` all pass in `site/`. New behavior has Vitest tests. Look at your own UI work in headless screenshots before you report.
- **Content integrity:** never invent facts about the owner (employer, dates, metrics). Missing facts go in `site/src/content/site.ts` as `null`/omitted, and the UI hides the empty sections. Each one is listed under "Owner input needed" in your report.

---

## T01: Scaffold and tooling

**Implementation**
- `create-next-app` into `site/`: TS, ESLint, App Router, `src/`, `@/*` alias, no Tailwind.
- `next.config.ts`: `output: 'export'`, `trailingSlash: true`, `images: { unoptimized: true }`, `reactStrictMode: true`.
- Scripts:
  - `dev`, `build`, `start` (serves `out/` with `serve`), `lint`, `typecheck` (`tsc --noEmit`)
  - `test` (`vitest run`), `test:watch`, `format` (Prettier)
  - `screenshot` (`scripts/screenshot.mjs`): captures each route at 1440×900 and 390×844, in light and dark, plus one reduced-motion pass, into `site/.screenshots/` (gitignored)
- Vitest: jsdom, `@vitejs/plugin-react`, `vite-tsconfig-paths`, `@testing-library/jest-dom` setup, CSS Modules mocked (`css.modules.classNameStrategy: 'non-scoped'`).
- `.github/workflows/ci.yml` (PR + push): node 20, `npm ci` in `site/`, lint, typecheck, test, build.
- `.github/workflows/deploy.yml` (push to master + `workflow_dispatch`): build, then `actions/configure-pages`, `actions/upload-pages-artifact` (path `site/out`), and `actions/deploy-pages`. Include the permissions and concurrency settings.
- `site/public/.nojekyll`. Replace the starter page with a minimal placeholder.

**Acceptance criteria**
- `npm run build` emits `site/out/index.html` and `site/out/404.html`.
- All definition-of-done scripts pass, and at least 1 sample test exists.
- `npm run screenshot` writes PNGs.
- Both workflows parse as valid YAML.

## T02: Spike: Transient on CheerpJ (parallel with T01)

**Implementation**
- Work in the scratchpad only. Extract `assets/TRANSIENT-DISTRIBUTABLE.zip`, inspect the `TRANSIENT.jar` manifest (main class, class-path, class file major version), and find how it loads its assets (relative paths, classpath resources).
- Build a standalone HTML page that loads the current CheerpJ release from its CDN. Mount the JAR and loose files and run the game. Serve the page with a local static server and drive it in headless Chromium: screenshot after load, send keypresses, and capture console errors. Check audio separately (look for errors from the MP3 SPI).
- Confirm CheerpJ's current license terms for personal, non-commercial sites.

**Acceptance criteria**
- Written verdict (works / partially works / doesn't), screenshots, a list of issues, and the exact loader code and file layout that worked.
- Notes on load size and time, plus the license findings.

## T03: Design system

**Implementation**
- `src/design/tokens.css`:
  - Semantic colors, light and dark via `prefers-color-scheme`. A near-white / near-black neutral base and one restrained accent.
  - Materials: `--material-thin` / `--material-regular` (fill + blur + edge).
  - Spacing scale in `rem`, radii, shadows, z-index scale.
  - Overrides for `prefers-reduced-transparency` and `prefers-contrast: more`.
- `src/design/typography.css`: type scale (display / title1–3 / headline / body / callout / footnote / caption) with size-specific tracking and leading. Self-host Inter Variable.
- `src/design/motion.ts`: `spring.default` (`bounce: 0, duration: 0.4`), `spring.snappy` (`0, 0.3`), `spring.momentum` (`0.2, 0.4`), and `project(velocity, rate)` / `rubberband(...)` helpers from the skill. Add a `useMotionPreference()` hook that returns reduced-motion-safe transitions.
- Primitives in `src/components/ui/`:
  - `Button`: variants filled / tinted / plain; press scale on pointer-down; works as a link or a button.
  - `Link`: internal links use `next/link`; external links get `rel` and an icon.
  - `Card`: interactive hover/press lift.
  - `Chip`, `Container`, `Section` (eyebrow + title), `VisuallyHidden`.
  - `Icon`: a small inline SVG set (GitHub, LinkedIn, arrow, download, play, external, document, close, menu).
- Global reset + base styles in `globals.css`.
- Temporary `/kitchen-sink` route showing every primitive in both themes (removed in T12).

**Acceptance criteria**
- Tests for `project`/`rubberband` math and for each primitive's render, variants, link vs. button semantics, and keyboard focusability.
- Kitchen-sink screenshots look polished in light and dark.
- Builds with no hydration warnings.

## T04: App shell and navigation

**Implementation**
- `src/app/layout.tsx`: html lang, metadata base, a skip link, a background slot (renders `<LivingBackground />` from `@/background` if present), `<SiteNav />`, `<main id="main">`, and `<SiteFooter />`.
- `SiteNav`:
  - Fixed, translucent material bar with a scroll-edge effect (a blur/fade that appears only once content scrolls under it).
  - Name/wordmark on the left. Links: Work, Experience, About, plus a Résumé button that opens `/resume.pdf` in a new tab.
  - Active link from `usePathname`, with an animated indicator (shared `layoutId`).
- Mobile (< 768px): a menu button opens a **draggable bottom sheet**, built on Radix Dialog for focus trap, Escape, and aria.
  - 1:1 drag that respects the grab offset, rubber-banding above the top, and momentum projection + velocity handoff on release to decide dismiss.
  - Scrim dims the page. The sheet enters and exits along the same path.
- `SiteFooter`: GitHub, LinkedIn, résumé, © year.
- Page transitions: enable React/Next View Transitions if available in Next 16 (`experimental.viewTransition`). Use a subtle cross-fade, and none under reduced motion.
- `src/content/site.ts`: owner name, tagline, social URLs, nav items. Single source.
- Copy `react-app/public/AustinVanBraeckel-Resume.pdf` to `site/public/resume.pdf`.

**Acceptance criteria**
- Tests:
  - Nav renders all items, marks the active one with `aria-current="page"`, and the résumé link has the right href and target.
  - Mobile sheet opens, closes on Escape and on the scrim, and returns focus to the trigger.
  - Skip link targets `#main`.
- Screenshots at desktop and mobile, with the sheet open.

## T05: Living background (parallel with T03/T04, files: `src/background/**` only)

**Implementation**
- `src/background/LivingBackground.tsx` (client) + `shader.ts`:
  - Fixed full-viewport canvas behind content (`z-index` below main, `pointer-events: none`). WebGL2 fragment shader: a few soft color fields using domain-warped noise, low contrast, palette from CSS tokens (read `--bg` / `--accent` via `getComputedStyle`, re-read on color-scheme change).
  - Pointer position smoothed by a critically damped spring and gently attracting the field. Scroll progress shifts the hue slightly. Idle drift is slow and non-periodic.
  - Render at ≤ 0.5× resolution with DPR ≤ 1.5, CSS-upscaled. Pause on `visibilitychange`, on window blur, and after idle without input once motion has settled.
- **Fallbacks:** no WebGL2 → a CSS gradient div. `prefers-reduced-motion` → render a single static frame, with no rAF loop.
- Export via `src/background/index.ts`.

**Acceptance criteria**
- Tests (jsdom, with WebGL mocked as unavailable): the fallback renders, the reduced-motion path doesn't start a rAF loop, and visibility pause/resume works. Unit test any pure math.
- Headless screenshots in light and dark show a tasteful, readable background with text contrast intact.

## T06: Media pipeline (parallel with T03/T04)

**Implementation**
- `site/scripts/optimize-images.mjs` (sharp):
  - Reads `site/media-sources.json`: entries `{ id, src (path relative to repo root), alt, credit? }`.
  - Writes AVIF + WebP at 640/1280/1920 (never upscaling) to `site/public/media/`.
  - Writes `src/media/manifest.json` with width, height, a tiny base64 blur placeholder, and srcset entries.
  - Runs as `prebuild`, and is idempotent (skips outputs that are up to date).
- `src/components/Picture.tsx`: `<picture>` with sources, `sizes` prop, lazy by default, `priority` prop, explicit dimensions, blur placeholder background.
- **Curate:** read `ncr.html`, `magnet1.html`, `magnet2.html` and the comments saying which photos are the owner's. Select 4–8 owner-taken photos per Magnet term, plus logos usable for identification. NCR: logo only, since none of its photos are the owner's. Also include the portrait (`images/portrait.jpg`) and the Transient screenshot (`images/TransientPic.jpg`). Look at the candidate images before choosing, and write good alt text.

**Acceptance criteria**
- Script runs cleanly, and the output is under 6 MB total.
- Tests for `Picture` (sources, alt, lazy/priority, sizes).
- Report the selected images with their reasoning.

## T07: Experience (timeline + case studies) (parallel with T08)

**Implementation**
- Content model: `src/content/experience.ts` (typed entries: slug, company, role, team, location, start, end, summary, stack[], cover media id, accent).
- Case-study bodies in MDX at `src/content/case-studies/*.mdx`, rendered via `@next/mdx` with styled MDX components.
- Rewrite each legacy report (NCR, Magnet term 3, Magnet terms 4–5) into a scannable case study:
  - Sections: Context, Role, What I built (high level, respecting the confidentiality notes), Stack, What I learned. About 400–700 words, with 2–4 photos and captions.
  - Use only facts from the reports. Write in first person, confident, and specific.
- One case study per role/term, three total: `/experience/ncr`, `/experience/magnet-review`, `/experience/magnet-axiom-cyber`.
- `/experience`: interactive timeline. Vertical with a scroll-linked progress line and entries that reveal on scroll (reduced motion: no reveal). Each entry is a card linking to its case study. Add an education entry (University of Guelph, Software Engineering, B.Eng.), using dates only if they're in the legacy content.
- Case-study page: hero (company, role, dates, location, stack chips, cover), body, and previous/next navigation. Use `generateStaticParams`.

**Acceptance criteria**
- Tests: the timeline renders every entry in reverse chronological order with correct links. Each slug's case-study page renders its title and stack. Data validation tests (unique slugs, valid dates, media ids exist in the manifest).
- Screenshots of the timeline and one case study.

## T08: Home, About, Work, Pong, Transient page shell (parallel with T07)

**Implementation**
- `/`:
  - Hero: large display name, a one-line positioning statement, and two calls to action (Work, Experience).
  - Short intro with the portrait. "Selected work" (Transient, Pong) cards. Experience preview (latest 3 entries from `experience.ts`, linking to `/experience`).
  - Restrained: no typewriter effects, no gradient text.
- `/about`: rewritten bio based on `index.html` (interests: problem-solving, graphic design, games, film, math). Don't claim current employment details that aren't known. Links to the résumé, GitHub, and LinkedIn.
- `/work`: project grid from `src/content/projects.ts`.
- `/work/pong`: description, source link, and the Khan Academy embed **exactly as legacy** (same `embed.js` URL), injected client-side into a sized container. Lazy-load it on visibility.
- `/work/transient`: description, screenshot, Download button (`/transient/TRANSIENT-DISTRIBUTABLE.zip`), and a `<TransientPlayer />` placeholder slot (filled in T10).

**Acceptance criteria**
- Tests: every page renders its h1, projects link correctly, the Pong embed script is injected with the exact URL, and the download href is correct.
- Screenshots of every page at desktop and mobile.

## T09: SEO, metadata, 404

**Implementation**
- Per-route `metadata` (title template `%s · Austin Van Braeckel`, descriptions).
- `sitemap.ts`, `robots.ts` (both need `export const dynamic = 'force-static'`), JSON-LD `Person`, `icon` and `apple-icon`.
- Generated OG image (`opengraph-image.tsx`, static) for the root and case studies, if static export supports it.
- Custom `not-found.tsx` in the site's style.
- `manifest.ts` with theme colors.

**Acceptance criteria**
- `out/sitemap.xml` lists all routes, and `out/robots.txt` exists.
- Each route's HTML has a unique title and description.
- `404.html` uses the custom page.
- Tests cover the sitemap contents and metadata.

## T10: Transient in the browser

**Implementation**
- Based on the T02 verdict. Add `site/scripts/prepare-transient.mjs` (run in `prebuild`/`predev`): extract the game from the zip (source path in a config constant, defaulting to `../assets/TRANSIENT-DISTRIBUTABLE.zip`, with fallback `../archive/transient/TRANSIENT-DISTRIBUTABLE.zip`) into `public/transient/` and copy the zip there. Gitignore `public/transient/`.
- `TransientPlayer` (client):
  - Poster + "Play in browser" button. Load CheerpJ only on click, with a progress/loading state.
  - The game runs in a focused, aspect-correct container, with a fullscreen toggle, a controls overlay, and "Download instead" always visible.
  - Mobile/touch: show a "Best on desktop with a keyboard" notice; play remains optional.
  - Handle errors with a friendly fallback.
- If T02 failed: poster + screenshots + download only, with the reason documented in PLAN.md.

**Acceptance criteria**
- Tests: the player doesn't load CheerpJ before the click, shows the loading state after the click, and renders the error fallback.
- A headless run reaches the game's first screen, shown in screenshots.

## T11: Polish, accessibility, performance

**Implementation**
- Accessibility: `vitest-axe` checks on every page component; headings order; landmarks; focus-visible styles; color contrast in both themes; `prefers-contrast` / `-transparency` variants.
- Motion review: slow-motion screenshots or frames of nav, sheet, and timeline. Check that animations are interruptible and that reduced motion is honored everywhere.
- Performance:
  - Run Lighthouse (npm `lighthouse` against `npm start`, using the cached Chromium) on Home, Experience, and a case study.
  - Fix anything under Performance 90 / Accessibility 100 / Best Practices 100 / SEO 100. Check the bundle size.
- Cross-viewport sweep: 360, 390, 768, 1024, 1440, 1920. No horizontal scroll, no overlap.

**Acceptance criteria**
- Axe tests pass, and the Lighthouse scores are recorded in the report.
- The screenshot sweep shows no layout defects.

## T12: Archive and cleanup

**Implementation**
- Serve the repo root statically and print `ncr.html`, `magnet1.html`, and `magnet2.html` to PDF with headless Chromium (A4, backgrounds on, waiting for all images) into `archive/reports/`.
- Copy `images/` into `archive/images/` (git dedups identical blobs) and the zip into `archive/transient/`. Add `archive/README.md` saying the folder isn't deployed.
- Remove the `/kitchen-sink` route.
- Update `CLAUDE.md` for the new architecture.
- **Do not delete legacy files.** That waits for owner sign-off.

**Acceptance criteria**
- 3 PDFs that open, with images visible (check a page screenshot of each).
- The build no longer contains `kitchen-sink`.

## T13: Final verification (orchestrator)

- Clean install and build from scratch. Run every test. Do a full headless walkthrough of every route at desktop and mobile, light and dark, plus reduced motion.
- Click through the nav and sheet, play Transient, check the Pong embed and the résumé link. Review against PLAN.md §12 parity checklist.
