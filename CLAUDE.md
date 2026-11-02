# CLAUDE.md

## Repository layout

Personal portfolio site (`https://avanbraeckel.github.io`). See `PLAN.md` for the design/architecture rationale and `TICKETS.md` for the iteration-1 work breakdown.

- **`site/`**: the live site. Next.js 16 (App Router, TypeScript strict) statically exported (`output: 'export'`, `trailingSlash: true`) and deployed to GitHub Pages by `.github/workflows/deploy.yml`. This is where active development happens.
- **`archive/`**: not deployed, not linked from the site (but public on GitHub). Original co-op reports as PDFs, full-resolution legacy photos, the original Transient zip, and a runnable copy of the legacy site. See `archive/README.md`.
- **Legacy (pending deletion):** the HTML5 UP "Photon" pages at the repo root (`index.html`, `magnet1.html`, `magnet2.html`, `ncr.html`, `transient.html`, `pong.html`, plus `assets/`, `images/`, `navbar.md`, `README.txt`, `LICENSE.txt`) and the abandoned CRA app in `react-app/`. Everything has been ported to `site/` or copied into `archive/`. The build no longer depends on them: `site/media-sources.json` points at `archive/images/` (or `site/media-src/`), and the Transient scripts read `archive/transient/` first, keeping `assets/` only as a marked fallback (`legacy-fallback`) that goes away with the legacy folders. `site/src/media/sources.test.ts` guards this.

## Commands

All commands run from `site/`. The system npm 9 on this machine is broken; use npm 10 (`~/.local/bin/npm`).

```bash
npm install
npm run dev               # dev server at http://localhost:3000 (predev prepares Transient files)
npm run build             # prebuild: optimize images + prepare Transient; then static export → site/out/
npm start                 # serve site/out/ (supports HTTP Range, needed by CheerpJ)
npm run lint
npm run typecheck         # next typegen && tsc --noEmit
npm test                  # Vitest, single run (npm run test:watch for watch mode)
npx vitest run -t "name"  # run tests matching a name
npm run format            # Prettier (format:check in CI)
npm run screenshot        # headless Playwright screenshots of every route → site/.screenshots/
npm run a11y              # axe (WCAG 2.2 AA) audit of every route in a real browser; needs a build first
```

Headless Chromium needs extra libraries that are not installed system-wide. `scripts/screenshot.mjs` sets `LD_LIBRARY_PATH=/home/avanbraeckel/.local/chromium-libs/root/usr/lib/x86_64-linux-gnu` itself; other Playwright scripts must set it too.

## Deployment

`.github/workflows/deploy.yml` builds `site/` and publishes `site/out/` with `actions/deploy-pages` on every push to `master`. The repo's Pages source must be set to **GitHub Actions** (Settings → Pages). The old `gh-pages` branch and the `gh-pages` npm flow are obsolete. `ci.yml` runs lint, typecheck, test and build on PRs.

## Site architecture (`site/src/`)

- `app/`: routes. `layout.tsx` holds the persistent shell: skip link, `LivingBackground`, `SiteNav`, `<main id="main">` wrapped in `PageTransition`, `SiteFooter`, Person JSON-LD. Routes: `/`, `/about/`, `/projects/`, `/projects/transient/`, `/experience/`, `/experience/[slug]/`. SEO lives in `sitemap.ts`, `robots.ts`, `manifest.ts`, `og/[image]/route.tsx` (build-time PNG OG cards), and `lib/seo.ts` (`pageMetadata()`; every page's metadata goes through it).
- `content/`: single sources of truth. `site.ts` (name, nav, socials, résumé; `tagline`/`email` are `null` until the owner fills them, and the UI hides them), `experience.ts` (timeline + case-study entries), `projects.ts`, `case-studies/*.mdx` (rendered via `@next/mdx`).
- `design/`: `tokens.css` (semantic colors light/dark, materials, spacing, radii, z-index, reduced-transparency/contrast overrides), `typography.css`, `motion.ts` (spring presets, `project()`, `rubberband()`, reduced-motion hooks), self-hosted Inter.
- `components/ui/`: primitives (Button, Link, Card, Chip, Container, Section, Icon, VisuallyHidden). `components/shell/`: nav, draggable mobile sheet (`sheetPhysics.ts`), footer, page transitions. `components/{home,projects,experience}/`: page sections. `components/Picture.tsx` renders optimized images by manifest id.
- `background/`: the WebGL2 "living background" (topographic field). Tuning knobs are in `simulation.ts` `BACKGROUND_PARAMS`.
- `media/` + `scripts/optimize-images.mjs`: curated images listed in `site/media-sources.json` are encoded to AVIF/WebP in `public/media/` (gitignored, generated at build). `src/media/manifest.json` is committed.
- Transient: `scripts/prepare-transient.mjs` copies the zip and extracts the game into `public/transient/` (gitignored), including a tiny `patch.jar` that fixes an audio busy-loop which hangs CheerpJ. `components/projects/TransientPlayer.tsx` loads CheerpJ 5 from its CDN only on click (required by the free Community license; keep the "Built with CheerpJ" credit and the on-screen notice).

Conventions: CSS Modules + design tokens (no Tailwind/MUI/styled-components), `motion/react` for animation, `radix-ui` for accessible overlays, Vitest + Testing Library (+ vitest-axe) tests next to the code. Design follows `.claude/skills/AppleDesign/SKILL.md`: critically damped springs by default, interruptible motion, and respect for reduced motion/transparency/contrast. Never invent facts about the owner in copy.
