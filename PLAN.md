# Portfolio Revamp Plan

A plan to replace the legacy HTML5 UP site and the in-progress CRA app with a modern, statically exported Next.js site hosted on GitHub Pages. Design and motion follow Apple's design principles (see `.claude/skills/AppleDesign/SKILL.md`).

---

## 1. Decisions (confirmed)

| Topic | Decision |
| --- | --- |
| Hosting | GitHub Pages, `avanbraeckel.github.io`, no custom domain |
| Framework | Next.js (latest stable, App Router) with `output: 'export'` |
| Positioning | Employed engineer building a presence: projects and personality first, résumé secondary |
| UI stack | Drop MUI, Emotion, and styled-components. Use custom components, CSS Modules + design tokens, Motion for springs, and Radix primitives for accessible overlays |
| Experience content | Interactive Experience timeline, plus one rewritten case study per role |
| Original reports | Archived as PDFs in an `archive/` folder in this repo. Never linked from or deployed with the site (but visible on GitHub, since the repo is public) |
| Transient | Playable in the browser (via CheerpJ) **and** downloadable |
| Pong | Keep the Khan Academy embed as-is |
| Background | Subtle WebGL gradient field that reacts to the pointer and scroll |

## 2. Current state (audit findings)

- **Nothing real is live.** `gh-pages` serves the CRA "under construction" build, so none of the legacy content is online right now. That makes the move to the new stack urgent and low-risk: there's no working site to break.
- **`react-router-dom` is imported but missing from `react-app/package.json`.** A clean `npm install && npm run build` would fail. Moot once CRA is retired, which is just as well: CRA is deprecated.
- **Broken legacy links.** The résumé button points to `./documents/AustinVB-Resume.pdf`, which doesn't exist. The current PDF is in `react-app/public/`. "View Transcript" is a disabled placeholder.
- **Heavy, unoptimized media.** `images/Magnet1` is 57 MB and `images/Magnet2` is 36 MB, with single photos up to 4 MB. `assets/TRANSIENT-DISTRIBUTABLE.zip` is 50 MB and contains a 28 MB `TRANSIENT.jar`, 3 library JARs (MP3 playback via JavaZoom/Tritonus), and loose assets (PNG, MP3, WAV, CSV, TTF).
- **Image rights.** The legacy page comments say some report images aren't yours (NCR: none are yours). Only your own photos and company logos used for identification should make it into the new site.
- **Stale copy.** "Fifth-year student", a `@uoguelph.ca` email, and commented-out Facebook/Instagram links.
- **Content inventory:** Home (bio), NCR (W1–2, May–Dec 2021), Magnet 1 (W3, May–Aug 2022, Waterloo), Magnet 2 (W4–5, Jan–Aug 2023, Ottawa), Transient (Java game + download), Pong (Khan Academy embed). Reports share the sections About company / Job description / Tools & technologies / Work highlights / Goals / Conclusions / Acknowledgements.

## 3. Why this stack

### Next.js static export on GitHub Pages
- **Pre-rendered HTML for every route.** This fixes the SPA deep-link 404 problem `BrowserRouter` has on Pages (refreshing `/transient` returns a 404 today). It also gives real SEO and link previews.
- **File-based routing, a metadata API, `sitemap.ts`/`robots.ts`, and MDX** all work with static export.
- **Portability.** If server features are ever needed (contact form, ISR, edge OG images), moving to Vercel is a config change, not a rewrite.

What GitHub Pages costs us, and how we compensate:

| Pages limitation | Mitigation |
| --- | --- |
| No server: no SSR, API routes, ISR, middleware, or redirects | Everything is static. Nothing in scope needs a server. |
| No `next/image` optimization | Pre-optimize at build time (§7). |
| No per-PR preview deploys | CI builds every PR. Preview locally with `npx serve out`. Revisit Vercel if previews become important. |
| Custom headers unavailable (CSP, cache control) | Use a `<meta>` CSP. Next's hashed filenames handle cache busting. |
| Soft limits: 1 GB site, 100 GB/month bandwidth | The Transient payload (~50 MB) is the main cost. It loads only when the player opts in. |

**Alternatives considered:** a Vite SPA (simpler, but no per-route HTML, so the deep-link and SEO problems remain) and Astro (excellent for content sites, but islands make a persistent, app-like shell with a continuous background and cross-route transitions harder). Next.js is the better fit for "content site that feels like an app."

### Dropping MUI
MUI's Material ripples, elevation, and defaults pull against Apple's style, and theming them away costs more than building the ~10 components we need. Radix provides accessible behavior (focus traps, dialogs, menus) with no styling, so we keep accessibility without fighting a visual language.

## 4. Target architecture

```
/                       repo root
├── site/               new Next.js app (moved to root after cutover; see Phase 6)
│   ├── src/app/        routes (App Router)
│   ├── src/components/ UI primitives + composites
│   ├── src/design/     tokens.css, motion.ts (spring presets), typography
│   ├── src/content/    MDX: case studies, project pages, timeline data (typed)
│   ├── src/background/ WebGL gradient field
│   ├── public/         résumé PDF, optimized images, transient/ (game payload)
│   └── scripts/        image optimization, content checks
├── archive/            NOT deployed: original reports as PDF + original photos
├── .github/workflows/  ci.yml, deploy.yml
└── (legacy files until Phase 6)
```

**Routes** (labels are specific, per Apple's wayfinding guidance):

| Route | Purpose |
| --- | --- |
| `/` | Hero (name, one-line positioning), short intro, selected work, experience preview |
| `/work` | Projects grid: Transient, Pong, plus any new projects |
| `/work/transient` | Story, screenshots, **Play in browser**, **Download** |
| `/work/pong` | Khan Academy embed (unchanged behavior) |
| `/experience` | Interactive timeline: current role, Magnet (×2 terms), NCR, education |
| `/experience/[slug]` | Case study per role |
| `/about` | Longer bio, interests (design, film, games, math), contact links |
| `/resume.pdf` | Résumé served as a static file, linked from the nav |
| `404` | Custom `not-found.tsx` |

**App shell:** `layout.tsx` persists across navigations and holds the background canvas, translucent nav, and footer. That keeps the background continuous between pages, which is what makes it feel like an app instead of page reloads.

**Content model:** typed MDX with exported `metadata` (title, dates, role, company, location, stack, cover image). The timeline and project grid read from the same data, so there's one source of truth. Use `@next/mdx`, and add Velite only if frontmatter validation turns out to be worth it.

## 5. Design system (Apple principles, applied)

**Tokens (`tokens.css`)**
- **Color:** semantic tokens (`--bg`, `--fg`, `--fg-secondary`, `--accent`, `--separator`, `--material-*`) with light and dark sets that follow `prefers-color-scheme`. One restrained accent color. No theme toggle unless requested.
- **Type:** the system font stack (`system-ui`, which is SF Pro on Apple devices). A type scale where tracking and leading vary by size: display ~`-0.02em`/`1.05`, body `0`/`1.5`. Hierarchy comes from weight, size, and leading together. All spacing in `rem` so it scales with the user's text size.
- **Spacing and radii:** a 4/8-based scale; continuous-feeling radii on cards.
- **Materials:** two material weights for the nav and sheets (`backdrop-filter: blur() saturate()` + semi-transparent fill + a bright top edge). Never stack light material on light material. Use a scroll-edge blur/fade under the nav instead of a 1px border.

**Motion (`motion.ts`)**
- `spring.default`: critically damped (`bounce: 0, duration: 0.4`), used everywhere by default.
- `spring.momentum`: `bounce: ~0.2`, used **only** after a flick or drag release.
- Press feedback on pointer-down (`scale(0.97)`), never deferred to click.
- Every animation is interruptible and animates from the current on-screen value (Motion does this by default; never lock input during transitions).
- Enter and exit take the same path. Popovers and sheets originate from their trigger (`transform-origin`).
- Route transitions use the View Transitions API (a short cross-fade + shared-element morph for case-study covers going from timeline to detail). Unsupported browsers fall back to an instant swap.
- Compositor-only properties (`transform`, `opacity`).

**Signature interactions** (where the "feels like an app" quality comes from, kept deliberately few):
1. **Mobile nav as a draggable sheet:** 1:1 drag tracking, rubber-banding past the edges, momentum projection plus velocity handoff to choose open or closed.
2. **Experience timeline:** horizontal and scroll-snapped on desktop, vertical on mobile. Cards expand into case studies with a shared-element transition.
3. **Living background** (§6).

Everything else stays quiet, following Purpose and Simplicity: no confetti, no typewriter heroes, no gradient-text clichés.

**Accessibility baked into components**
- `prefers-reduced-motion`: springs and slides become short cross-fades, and the background renders one static frame.
- `prefers-reduced-transparency`: materials become solid.
- `prefers-contrast: more`: solid surfaces with defined borders.
- Keyboard: visible focus rings, a skip link, and full keyboard play for Transient.
- Target WCAG 2.2 AA; automated axe checks in CI.

## 6. Living background

- A full-viewport `<canvas>` behind content running a WebGL2 fragment shader: a soft, low-contrast gradient field (a few blurred color "blobs" through domain-warped noise) in the accent palette, adapting to light and dark.
- **Reactive, not looping:** the pointer position (smoothed with a critically damped spring) gently warps the field toward the cursor. Scroll progress shifts the palette subtly per section. Idle drift is very slow and non-periodic. This avoids the ~0.2 Hz oscillation Apple flags as a vestibular trigger.
- **Budget:** render at a capped DPR (≤1.5) and reduced resolution, upscaled (it's a blur). Pause on `visibilitychange`, when the window loses focus, and when the user is idle. Target <2 ms/frame on a mid-range laptop.
- **Fallbacks:** no WebGL → a static CSS gradient. Reduced motion → a single static frame.
- Prototype it first (Phase 0). It's the riskiest aesthetic element, and the "not like every other AI site" goal depends on tuning it by eye.

## 7. Media pipeline

- `scripts/optimize-images.ts` (using `sharp`) turns curated sources into AVIF + WebP at 640/1280/1920 widths plus a tiny blur placeholder, and writes a typed manifest. A `<Picture>` component consumes the manifest (`<picture>`, `srcset`, `sizes`, `loading="lazy"`, explicit dimensions so the layout doesn't shift). Alternative: `next-image-export-optimizer`, if we'd rather keep `next/image` ergonomics.
- **Curate:** about 4–8 photos per case study, your own photos only, plus company logos. Tech-stack logos become a text/chip list or a consistent icon set.
- **Transient download:** move `TRANSIENT-DISTRIBUTABLE.zip` to a **GitHub Release** asset and link the Download button there. This keeps 50 MB out of future commits and out of the Pages artifact.

## 8. Transient in the browser

**Approach:** CheerpJ (a WebAssembly-based JVM that runs Swing/AWT JARs unmodified) loaded from its CDN only when the user clicks **Play in browser**.

- Serve `TRANSIENT.jar`, `lib/*.jar`, and the loose assets from `public/transient/`, mounted into CheerpJ's virtual filesystem so relative file paths in the game resolve.
- UX: a poster image plus a **Play** button. On click, show a determinate loading state (~30+ MB), then run the game in a focused container with a fullscreen toggle and a keyboard-controls overlay. A "Download instead" link is always visible.
- **Known risks** (resolved by a timeboxed spike in Phase 0):
  - **Audio:** MP3 via JavaZoom/`javax.sound` may not work under CheerpJ. Fallbacks, in order: WAV-only audio, muted play, or recompiling with a different audio path (requires the source).
  - **Java version:** check the JAR's class file version against what CheerpJ supports.
  - **Performance and input:** frame pacing in a game loop, plus key capture and focus inside the canvas.
  - **License:** confirm CheerpJ's current free-use terms cover a personal, non-commercial site.
- **If the spike fails:** ship a gameplay video + screenshots + Download, and record the reason in this file. Porting the game to TypeScript is a separate, larger project.

## 9. Build, CI, deploy

- **Tooling:** TypeScript strict, ESLint (`next` config), Prettier, Vitest + Testing Library for components, Playwright for smoke tests (every route renders, nav works, reduced-motion path, axe a11y scan), Lighthouse CI budgets (Performance ≥ 95, Accessibility 100, CLS < 0.05).
- **`ci.yml`** (every PR): install, lint, typecheck, test, build, Playwright, Lighthouse.
- **`deploy.yml`** (push to `master`): build `site/`, then `actions/upload-pages-artifact`, then `actions/deploy-pages`. Switch the repo's Pages source from the `gh-pages` branch to **GitHub Actions**. This replaces the `gh-pages` npm package and the `gh-pages` branch, which is deleted after a successful deploy.
- Static export config: `output: 'export'`, `trailingSlash: true`, `images.unoptimized: true`, no `basePath` (user site at the root).

## 10. Phases

Each phase ends in a deployable state.

**Phase 0: Spikes and content prep**
- CheerpJ spike: does Transient run, with audio, at acceptable frame rate? Go/no-go.
- Background shader prototype in an isolated page. Tune it with you until it feels right.
- Fill in the open content questions (§11). Draft the new bio and the case-study outlines.
- *Exit:* spike verdict recorded; background direction approved.

**Phase 1: Foundation**
- Scaffold Next.js in `site/`. Add tooling, CI, and the Actions deploy. Make the Pages source switch.
- Ship a minimal shell (name + links + résumé) to replace "under construction" immediately.
- *Exit:* site auto-deploys from `master`; all routes return 200 on refresh.

**Phase 2: Design system and shell**
- Tokens, typography, materials, motion presets, and the primitives (Button, Link, Card, Chip, Sheet, Picture).
- Persistent layout: translucent nav with scroll-edge effect, draggable mobile sheet, footer, background canvas, View Transitions.
- *Exit:* a kitchen-sink route for review (removed before cutover); reduced-motion, transparency, and contrast variants verified.

**Phase 3: Content**
- Home, About, Work (Transient with Download, Pong embed), Experience timeline, three case studies.
- Run the image pipeline and curate photos. Move the Transient zip to a Release.
- SEO: per-route metadata, OG images, `sitemap.xml`, `robots.txt`, JSON-LD `Person`.
- *Exit:* content parity checklist (§12) is complete.

**Phase 4: Transient in the browser**
- Production integration of the spike (or the fallback).
- *Exit:* plays end-to-end on desktop Chrome, Safari, and Firefox. Mobile shows a "best on desktop" notice + Download.

**Phase 5: Polish**
- Accessibility audit, a motion review in slow motion (Apple's process step), performance pass, cross-browser and mobile QA, 404 page.
- *Exit:* Lighthouse and axe budgets green.

**Phase 6: Cutover and cleanup**
- Generate archival PDFs of `ncr.html`, `magnet1.html`, `magnet2.html` (headless Chrome print, with images) into `archive/reports/`. Move the original photos into `archive/images/`.
- Delete the legacy site files, `assets/`, `react-app/`, `navbar.md`, `README.txt`, and the `gh-pages` branch. Move `site/` to the repo root (optional).
- Update `CLAUDE.md` to describe the new architecture.
- *Exit:* the repo contains only the new site + `archive/`.

## 11. Open questions (needed before Phase 3)

1. **Current role:** employer, title, start date, and what you can publicly say. It leads the timeline.
2. **Magnet:** one case study covering both terms (same company, different teams and cities), or two?
3. **Other projects** to feature beyond Transient and Pong (GitHub repos, hackathons, design work)?
4. **Contact:** which email to publish (the `@uoguelph.ca` address is likely dead), and which socials (GitHub and LinkedIn only?)
5. **Transcript button:** drop it? It's never worked, and for an employed engineer it's unnecessary.
6. **Transient source code:** do you still have it? It's needed only if the CheerpJ audio fails and a recompile is required.
7. **Analytics:** none, or a privacy-friendly free option (e.g. GoatCounter)?
8. **Résumé:** is `react-app/public/AustinVanBraeckel-Resume.pdf` current?
9. **Photo:** keep `images/portrait.jpg`, or take a new one? A good portrait does a lot for a personal site.

## 12. Content parity checklist (gate for deleting legacy)

- [ ] Bio (rewritten for current status)
- [ ] NCR case study + timeline entry
- [ ] Magnet case study/studies + timeline entries
- [ ] Transient page: description, screenshot, Release download link, in-browser play (or fallback)
- [ ] Pong page with the Khan Academy embed and source link
- [ ] Résumé PDF linked
- [ ] GitHub + LinkedIn links
- [ ] Original reports archived as PDFs in `archive/reports/`
- [ ] Original photos preserved in `archive/images/`
- [ ] Transient zip available as a GitHub Release asset
