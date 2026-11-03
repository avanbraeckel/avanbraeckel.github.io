# Coding standards

Read at review time. Mechanical rules (formatting, lint, types) are enforced by
the pre-commit hook and CI; these are the judgement calls they can't catch.

## Styling and motion

- Style with CSS Modules and the tokens in `site/src/design/tokens.css`. No
  Tailwind, MUI, styled-components, or raw colour values where a token exists.
- Animate with `motion/react` and the spring presets in `site/src/design/motion.ts`
  (critically damped by default, interruptible). Every animation has a
  reduced-motion path; translucent surfaces have reduced-transparency and
  increased-contrast fallbacks. See `.claude/skills/AppleDesign/SKILL.md`.
- Accessible overlays (dialogs, sheets) use `radix-ui`.
- Ambient, looping motion respects the visitor's pause choice
  (`html[data-ambient-motion="paused"]`, `site/src/design/ambientMotion.ts`).

## Tests

- Tests sit next to the code (Vitest, Testing Library, vitest-axe).
- **Page and component tests assert structure, not prose.** Query by role,
  accessible name, link target, and landmark. When a test needs copy, read it
  from `site/src/content/*` (or the component's exported constant) instead of
  restating the sentence, so a copy edit never breaks a test. A short,
  stable label (a heading, a button name) is fine to assert literally.
- New interactive UI gets keyboard and axe coverage.

## Copy

- Every fact about the owner traces to `site/src/content/*`, the archived
  reports, or the owner directly. Flag any claim the diff introduces without a
  source.
- Copy reads in the owner's casual first-person voice (see the About page), and
  never claims the owner built Transient alone.
- Code comments refer to the owner as "the owner", never with a pronoun.
