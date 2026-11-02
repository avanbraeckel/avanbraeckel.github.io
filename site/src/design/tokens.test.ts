import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * WCAG contrast of the text tokens against every surface they sit on,
 * computed from tokens.css itself (jsdom can't compute rendered contrast).
 */

// Vitest runs from the site root (import.meta.url isn't file: under jsdom).
const css = readFileSync(
  path.join(process.cwd(), "src/design/tokens.css"),
  "utf8",
);

/** Hex custom properties declared in the first block matching `selector`. */
function hexTokens(selector: RegExp): Record<string, string> {
  const match = selector.exec(css);
  if (!match) throw new Error(`No block for ${selector}`);
  const body = css.slice(match.index, css.indexOf("}", match.index));
  return Object.fromEntries(
    Array.from(body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi), (m) => [
      m[1],
      m[2],
    ]),
  );
}

type Rgba = [r: number, g: number, b: number, a: number];

/** rgba() custom properties declared in the first block matching `selector`. */
function rgbaTokens(selector: RegExp): Record<string, Rgba> {
  const match = selector.exec(css);
  if (!match) throw new Error(`No block for ${selector}`);
  const body = css.slice(match.index, css.indexOf("}", match.index));
  return Object.fromEntries(
    Array.from(
      body.matchAll(
        /--([\w-]+):\s*rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)\s*;/gi,
      ),
      (m) => [m[1], [+m[2], +m[3], +m[4], +m[5]] as Rgba],
    ),
  );
}

const toRgb = (hex: string): Rgba => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
  1,
];

/** `top` composited over an opaque `under`, as hex. */
function over(top: Rgba, under: string): string {
  const base = toRgb(under);
  const channel = (i: number) =>
    Math.round(top[i] * top[3] + base[i] * (1 - top[3]));
  return `#${[0, 1, 2].map((i) => channel(i).toString(16).padStart(2, "0")).join("")}`;
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const themes = {
  light: hexTokens(/:root,\s*\[data-theme="light"\]\s*\{/),
  dark: hexTokens(/\[data-theme="dark"\]\s*\{/),
  "dark (media query)": hexTokens(/:root:not\(\[data-theme="light"\]\)\s*\{/),
};

const TEXT = ["fg", "fg-secondary", "fg-tertiary", "accent"];
const SURFACES = ["bg", "bg-elevated", "surface", "surface-secondary"];

describe.each(Object.entries(themes))("%s tokens", (_name, tokens) => {
  it.each(TEXT.flatMap((fg) => SURFACES.map((bg) => [fg, bg])))(
    "--%s on --%s meets 4.5:1",
    (fg, bg) => {
      expect(tokens[fg]).toBeDefined();
      expect(tokens[bg]).toBeDefined();
      expect(contrast(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("--on-accent on --accent meets 4.5:1", () => {
    expect(contrast(tokens["on-accent"], tokens.accent)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it("--focus-ring on --bg meets 3:1 (non-text)", () => {
    expect(contrast(tokens["focus-ring"], tokens.bg)).toBeGreaterThanOrEqual(3);
  });
});

/*
 * Translucent materials show whatever is behind them, blurred.
 *
 * - Nav bar (--material-regular): a thin strip whose 28px blur averages the
 *   content scrolling under it, so the worst case is a mid-tone halfway
 *   between --bg and --fg (dense text or a photo, blurred). Pixel sampling in
 *   scripts/a11y-audit's needs-review pass confirmed it (lowest 5.2:1).
 * - Nav sheet (--material-thick): a large panel over the scrim, so it must
 *   hold up over the darkest content a page renders: solid --fg on light
 *   pages (photos, body text) and the mid-tone on dark pages, which have no
 *   full-bleed bright regions.
 */
const rgbaThemes = {
  light: rgbaTokens(/:root,\s*\[data-theme="light"\]\s*\{/),
  dark: rgbaTokens(/\[data-theme="dark"\]\s*\{/),
};

describe.each(["light", "dark"] as const)("%s material surfaces", (name) => {
  const tokens = themes[name];
  const fills = rgbaThemes[name];
  const midTone = over(
    [...toRgb(tokens.fg).slice(0, 3), 0.5] as Rgba,
    tokens.bg,
  );
  const sheetContent = name === "light" ? tokens.fg : midTone;
  const surfaces = {
    "nav bar (--material-regular)": over(fills["material-regular"], midTone),
    "nav sheet (--material-thick)": over(
      fills["material-thick"],
      over(fills.scrim, sheetContent),
    ),
  };

  describe.each(Object.entries(surfaces))("%s", (_label, material) => {
    it.each(["fg", "fg-secondary", "fg-tertiary", "accent"])(
      "--%s meets 4.5:1",
      (fg) => {
        expect(contrast(tokens[fg], material)).toBeGreaterThanOrEqual(4.5);
      },
    );

    it("--accent on --accent-fill (tinted button) meets 4.5:1", () => {
      const fill = over(fills["accent-fill"], material);
      expect(contrast(tokens.accent, fill)).toBeGreaterThanOrEqual(4.5);
    });
  });
});

it("both dark blocks declare the same values", () => {
  expect(themes["dark (media query)"]).toEqual(themes.dark);
});
