import { afterEach, describe, expect, it } from "vitest";
import { FALLBACK_PALETTES, readPalette } from "./palette";

const root = document.documentElement;

afterEach(() => {
  root.removeAttribute("style");
});

describe("readPalette", () => {
  it("falls back to built-in colors when tokens are empty", () => {
    expect(readPalette()).toEqual(FALLBACK_PALETTES.light);
  });

  it("reads tokens and derives dark mode from --bg luminance", () => {
    root.style.setProperty("--bg", "#0a0a0a");
    root.style.setProperty("--fg", "#f5f5f7");
    root.style.setProperty("--accent", "rgb(255, 0, 0)");
    const palette = readPalette();
    expect(palette.dark).toBe(true);
    expect(palette.accent).toEqual([1, 0, 0]);
    expect(palette.accent2).toEqual(FALLBACK_PALETTES.dark.accent2);
  });

  it("uses the scaffold's --background when --bg is missing", () => {
    root.style.setProperty("--background", "#ffffff");
    expect(readPalette().bg).toEqual([1, 1, 1]);
  });
});
