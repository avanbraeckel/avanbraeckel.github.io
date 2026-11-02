import { parseCssColor, relativeLuminance, type Rgb } from "./math";

export interface Palette {
  bg: Rgb;
  fg: Rgb;
  accent: Rgb;
  accent2: Rgb;
  /** True when the background is dark (derived from --bg, not the media query). */
  dark: boolean;
}

/** Used when a token is missing or unparseable. Mirrors src/design/tokens.css. */
export const FALLBACK_PALETTES: Record<"light" | "dark", Palette> = {
  light: {
    bg: [0.984, 0.984, 0.976],
    fg: [0.11, 0.11, 0.118],
    accent: [0.039, 0.412, 0.396],
    accent2: [0.886, 0.569, 0.353],
    dark: false,
  },
  dark: {
    bg: [0.043, 0.043, 0.047],
    fg: [0.961, 0.961, 0.969],
    accent: [0.298, 0.788, 0.733],
    accent2: [0.788, 0.478, 0.275],
    dark: true,
  },
};

/** Token names, in order of preference. The legacy names keep the scaffold working. */
const TOKENS = {
  bg: ["--bg", "--background"],
  fg: ["--fg", "--foreground"],
  accent: ["--accent"],
  accent2: ["--accent-2"],
} as const;

let probeCtx: CanvasRenderingContext2D | null | undefined;

/**
 * Convert any CSS color the browser understands (oklch, color(), named…) to
 * sRGB by painting one pixel. Only used when the cheap parser fails.
 */
function colorViaCanvas(value: string): Rgb | null {
  if (typeof CSS === "undefined" || !CSS.supports?.("color", value)) {
    return null;
  }
  if (probeCtx === undefined) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      probeCtx = canvas.getContext("2d", { willReadFrequently: true });
    } catch {
      probeCtx = null;
    }
  }
  if (!probeCtx) return null;
  probeCtx.clearRect(0, 0, 1, 1);
  probeCtx.fillStyle = "#000";
  probeCtx.fillStyle = value;
  probeCtx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = probeCtx.getImageData(0, 0, 1, 1).data;
  if (a === 0) return null;
  return [r / 255, g / 255, b / 255];
}

export function toRgb(value: string): Rgb | null {
  if (!value || value.includes("var(")) return null;
  return parseCssColor(value) ?? colorViaCanvas(value);
}

function prefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/**
 * Read the palette from CSS custom properties on `root`, falling back to
 * built-in colors for anything empty. Safe to call repeatedly.
 */
export function readPalette(root: Element = document.documentElement): Palette {
  const style = getComputedStyle(root);
  const read = (names: readonly string[]): Rgb | null => {
    for (const name of names) {
      const rgb = toRgb(style.getPropertyValue(name).trim());
      if (rgb) return rgb;
    }
    return null;
  };

  const bg = read(TOKENS.bg);
  const dark = bg ? relativeLuminance(bg) < 0.2 : prefersDark();
  const fallback = FALLBACK_PALETTES[dark ? "dark" : "light"];
  return {
    bg: bg ?? fallback.bg,
    fg: read(TOKENS.fg) ?? fallback.fg,
    accent: read(TOKENS.accent) ?? fallback.accent,
    accent2: read(TOKENS.accent2) ?? fallback.accent2,
    dark,
  };
}
