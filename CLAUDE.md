# CLAUDE.md

## Repository layout

Personal portfolio site (`https://avanbraeckel.github.io`). Design rationale: `PLAN.md`. Review rules: `CODING_STANDARDS.md`.

- **`site/`**: the live site. Next.js 16 (App Router, TypeScript strict) statically exported (`output: 'export'`, `trailingSlash: true`). All commands run from here; see `package.json` scripts.
- **`archive/`**: not deployed or linked, but public on GitHub: co-op report PDFs, full-resolution photos, the Transient zip, a runnable legacy site. The build reads images and the zip from here.
- **Legacy (pending the owner's approval to delete):** the HTML5 UP pages and folders at the repo root and `react-app/`. Nothing depends on them except lines marked `legacy-fallback`; `site/src/media/sources.test.ts` guards this.

## Gotchas

- Headless Chromium needs `LD_LIBRARY_PATH=/home/avanbraeckel/.local/chromium-libs/root/usr/lib/x86_64-linux-gnu`. The repo's Playwright scripts set it themselves.
- Capture UI with `npm run screenshot -- --routes /about/ --selector "<css>" --viewport mobile --scheme dark` after a build; it serves `out/` itself, so never start ad-hoc servers (and never `pkill -f`, which kills the agent's own shell).
- CheerpJ (Transient in the browser) needs HTTP Range; `npm start` and the scripts' servers support it. Keep the "Built with CheerpJ" credit and the on-screen license notice untouched (free Community license).
- Parallel agents: build with `npm run sandbox -- <name>` (private copy under `~/.cache/avb-sandboxes/`), never `npm run build` in `site/` while others work; `npm run sandbox -- --clean` afterwards.
- Never invent facts about the owner in copy; sources are `site/src/content/*`, `archive/`, or the owner.

## Deployment and CI

Every push to `master` runs `deploy.yml`, which calls `ci.yml` (lint, format, typecheck, tests, build, axe audit) and publishes to Pages only if it passes. Other branches and PRs run `ci.yml` alone. A pre-commit hook (husky + lint-staged, in `site/.husky/`) formats, lints and typechecks staged files. Check runs with `gh run list` / `gh run view <id> --log-failed`.

## Site architecture (`site/src/`)

- `app/layout.tsx`: the persistent shell (skip link, `LivingBackground`, `SiteNav`, `PageTransition`, `SiteFooter`) and the pre-paint init scripts for theme and paused motion. Every page's metadata goes through `lib/seo.ts` `pageMetadata()`.
- `content/`: single sources of truth for copy and facts (`site.ts`, `experience.ts`, `projects.ts`, `case-studies/*.mdx`).
- `design/`: tokens, typography, motion presets, and the visitor-choice stores (`theme.ts`, `ambientMotion.ts`).
- `background/`: the WebGL2 topographic background; tuning knobs in `simulation.ts` `BACKGROUND_PARAMS`.
- Images: list sources in `site/media-sources.json`; `scripts/optimize-images.mjs` encodes them at build and `components/Picture.tsx` renders them by id.
- Transient: `scripts/prepare-transient.mjs` extracts the game (plus a `patch.jar` that fixes an audio busy-loop that hangs CheerpJ); `components/projects/TransientPlayer.tsx` loads CheerpJ only on click.
