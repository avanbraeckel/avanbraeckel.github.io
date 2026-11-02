import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { mixRgb, parseCssColor, relativeLuminance, type Rgb } from "./math";
import { BACKGROUND_PARAMS } from "./simulation";

/**
 * Text drawn directly over the living background sits on whatever the shader
 * paints, which axe can only report as "needs review". This computes the
 * field's extreme colors from the shader's own mixing rules (shader.ts main())
 * and checks the text tokens against every one of them.
 *
 * The shader mixes in sRGB, so the same arithmetic is done here. Weights are
 * swept over their full reachable range rather than read from noise, so the
 * result bounds every frame, scroll position and pointer position:
 *   col = mix(bg, a1, w1*I); col = mix(col, a2, w2*I), w2 <= 1 - 0.75*w1
 *   col = mix(col, mix(fg, a1, 0.35), line*region*L), line*region <= 1
 * with hue rotation of a1 by h and a2 by -0.6h for h in [0, hueRange].
 * prefers-contrast: more only lowers I and L (moreContrastFactor < 1).
 */

const css = readFileSync(
  path.join(process.cwd(), "src/design/tokens.css"),
  "utf8",
);

function hexTokens(selector: RegExp): Record<string, Rgb> {
  const match = selector.exec(css);
  if (!match) throw new Error(`No block for ${selector}`);
  const body = css.slice(match.index, css.indexOf("}", match.index));
  return Object.fromEntries(
    Array.from(body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi), (m) => [
      m[1],
      parseCssColor(m[2]) as Rgb,
    ]),
  );
}

/** GLSL hueRotate(): rotation in YIQ space, clamped to 0..1. */
function hueRotate([r, g, b]: Rgb, angle: number): Rgb {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const i = 0.596 * r - 0.274 * g - 0.322 * b;
  const q = 0.211 * r - 0.523 * g + 0.312 * b;
  const s = Math.sin(angle);
  const k = Math.cos(angle);
  const i2 = k * i - s * q;
  const q2 = s * i + k * q;
  const clamp = (v: number) => Math.min(Math.max(v, 0), 1);
  return [
    clamp(y + 0.956 * i2 + 0.621 * q2),
    clamp(y - 0.272 * i2 - 0.647 * q2),
    clamp(y - 1.106 * i2 + 1.703 * q2),
  ];
}

/** Every color the field can reach for a theme (sampled densely over its weights). */
function fieldColors(
  tokens: Record<string, Rgb>,
  theme: "light" | "dark",
  withLines: boolean,
): Rgb[] {
  const { bg, fg, accent } = tokens;
  const accent2 = tokens["accent-2"];
  const intensity = BACKGROUND_PARAMS.intensity[theme];
  const lines = BACKGROUND_PARAMS.lines[theme];
  const colors: Rgb[] = [];
  const steps = 10;
  const hueSteps = 4;
  for (let hi = 0; hi <= hueSteps; hi++) {
    const hue = (hi / hueSteps) * BACKGROUND_PARAMS.hueRange;
    const a1 = hueRotate(accent, hue);
    const a2 = hueRotate(accent2, -hue * 0.6);
    const lineColor = mixRgb(fg, a1, 0.35);
    for (let i = 0; i <= steps; i++) {
      const w1 = i / steps;
      const w2Max = 1 - 0.75 * w1;
      for (let j = 0; j <= steps; j++) {
        const w2 = (j / steps) * w2Max;
        const tint = mixRgb(mixRgb(bg, a1, w1 * intensity), a2, w2 * intensity);
        colors.push(tint);
        if (withLines) colors.push(mixRgb(tint, lineColor, lines));
      }
    }
  }
  return colors;
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (hi + 0.05) / (lo + 0.05);
}

const themes = {
  light: hexTokens(/:root,\s*\[data-theme="light"\]\s*\{/),
  dark: hexTokens(/\[data-theme="dark"\]\s*\{/),
} as const;

/** Lines are 1-2px strokes, so stacking one on the darkest tint is held to a softer bound. */
const LINE_MINIMUM = 3;

describe.each(Object.entries(themes))(
  "text over the living background (%s)",
  (name, tokens) => {
    const theme = name as "light" | "dark";
    const tints = fieldColors(tokens, theme, false);
    const withLines = fieldColors(tokens, theme, true);
    const worst = (token: string, set: Rgb[]) =>
      Math.min(...set.map((color) => contrastRatio(tokens[token], color)));
    const TEXT = [
      "fg",
      "fg-secondary",
      "fg-tertiary",
      "accent",
      "accent-hover",
    ];

    it.each(TEXT)(
      "--%s keeps 4.5:1 against every tint the field can reach",
      (token) => {
        expect(worst(token, tints)).toBeGreaterThanOrEqual(4.5);
      },
    );

    it.each(TEXT)(
      "--%s keeps 3:1 where a contour line crosses the darkest tint",
      (token) => {
        expect(worst(token, withLines)).toBeGreaterThanOrEqual(LINE_MINIMUM);
      },
    );
  },
);
