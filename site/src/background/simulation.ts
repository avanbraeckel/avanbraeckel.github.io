import { approach, isSettled, mixRgb, springStep, type Rgb } from "./math";
import type { Palette } from "./palette";
import type { FieldUniforms } from "./shader";

/** Tuning knobs. Everything visual about the background is set here. */
export const BACKGROUND_PARAMS = {
  /** Feature size of the noise field; higher = smaller, busier features. */
  scale: 0.75,
  /** Multiplier on the drift clock. At 1 contours visibly reshape within a few seconds; 0.2 is a slow creep. */
  driftSpeed: 0.2,
  /** How strongly the accent fields tint the background (0..1). */
  intensity: { light: 0.2, dark: 0.2 },
  /** Contour line opacity (0..1). */
  lines: { light: 0.15, dark: 0.13 },
  /** Strength of the pinch toward the pointer (0..~0.8). */
  pull: 0.35,
  /** Hue rotation (radians) at the bottom of the page; 0 at the top. */
  hueRange: 0.25,
  /** Spring natural frequencies (rad/s). Lower = lazier. */
  pointerOmega: 2.6,
  presenceOmega: 2,
  scrollOmega: 3,
  /** The drift clock eases in/out with this spring when going idle/active. */
  timeScaleOmega: 1.1,
  /** Palette cross-fade time constant (s), e.g. on a light/dark switch. */
  paletteTimeConstant: 0.22,
  /**
   * No input for this long → let the drift settle and stop rendering.
   * Infinity keeps it drifting forever (it still pauses on hidden tab / blur).
   */
  idleAfterMs: Infinity,
  /** Frame cap while only drifting (the pointer spring is at rest). */
  driftFps: 30,
  /** Scales intensity and lines under prefers-contrast: more. */
  moreContrastFactor: 0.45,
  /** Backing-store scale relative to CSS pixels, and the DPR cap. */
  resolutionScale: 0.5,
  maxDpr: 1.5,
} as const;

export interface SimulationInput {
  /** Pointer in 0..1 viewport coordinates (y down, as in the DOM), or null when absent. */
  pointer: { x: number; y: number } | null;
  /** Scroll progress 0..1. */
  scroll: number;
  /** True when there has been no input for `idleAfterMs`. */
  idle: boolean;
}

interface Spring {
  x: number;
  v: number;
}

const springTo = (s: Spring, target: number, omega: number, dt: number) => {
  [s.x, s.v] = springStep(s.x, s.v, target, omega, dt);
};

const rgbClose = (a: Rgb, b: Rgb) =>
  Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 1e-3;

/**
 * Owns the animated state (springs, drift clock, palette cross-fade). Pure: no
 * DOM, no timers; the component feeds it input and frame times.
 */
export class BackgroundSimulation {
  readonly params = BACKGROUND_PARAMS;
  time: number;
  readonly seed: readonly [number, number];
  private px: Spring = { x: 0.5, v: 0 };
  private py: Spring = { x: 0.5, v: 0 };
  private targetX = 0.5;
  private targetY = 0.5;
  private presenceTarget = 0;
  private presence: Spring = { x: 0, v: 0 };
  private scroll: Spring = { x: 0, v: 0 };
  private timeScale: Spring = { x: 1, v: 0 };
  private palette: Palette;
  private target: Palette;
  private contrastFactor = 1;

  constructor(palette: Palette, seed: readonly [number, number] = [0, 0]) {
    this.palette = palette;
    this.target = palette;
    this.seed = seed;
    this.time = 0;
  }

  setPalette(palette: Palette, immediate = false) {
    this.target = palette;
    if (immediate) this.palette = palette;
  }

  setMoreContrast(more: boolean) {
    this.contrastFactor = more ? this.params.moreContrastFactor : 1;
  }

  /** True while the pointer spring is still moving (worth rendering at full rate). */
  get pointerMoving(): boolean {
    return !(
      isSettled(this.px.x, this.px.v, this.targetX, 2e-4) &&
      isSettled(this.py.x, this.py.v, this.targetY, 2e-4) &&
      isSettled(this.presence.x, this.presence.v, this.presenceTarget, 2e-3)
    );
  }

  /** Advance by `dt` seconds. Returns true when nothing is left to animate. */
  step(dt: number, input: SimulationInput): boolean {
    const p = this.params;
    if (input.pointer) {
      this.targetX = input.pointer.x;
      this.targetY = 1 - input.pointer.y;
    }
    springTo(this.px, this.targetX, p.pointerOmega, dt);
    springTo(this.py, this.targetY, p.pointerOmega, dt);
    this.presenceTarget = input.pointer ? 1 : 0;
    springTo(this.presence, this.presenceTarget, p.presenceOmega, dt);
    springTo(this.scroll, input.scroll, p.scrollOmega, dt);
    const timeTarget = input.idle ? 0 : 1;
    springTo(this.timeScale, timeTarget, p.timeScaleOmega, dt);
    this.time += dt * p.driftSpeed * Math.max(this.timeScale.x, 0);

    const k = approach(dt, p.paletteTimeConstant);
    const paletteSettled =
      rgbClose(this.palette.bg, this.target.bg) &&
      rgbClose(this.palette.fg, this.target.fg) &&
      rgbClose(this.palette.accent, this.target.accent) &&
      rgbClose(this.palette.accent2, this.target.accent2);
    this.palette = paletteSettled
      ? this.target
      : {
          bg: mixRgb(this.palette.bg, this.target.bg, k),
          fg: mixRgb(this.palette.fg, this.target.fg, k),
          accent: mixRgb(this.palette.accent, this.target.accent, k),
          accent2: mixRgb(this.palette.accent2, this.target.accent2, k),
          dark: this.target.dark,
        };

    return (
      input.idle &&
      paletteSettled &&
      isSettled(this.timeScale.x, this.timeScale.v, 0, 2e-3) &&
      isSettled(this.scroll.x, this.scroll.v, input.scroll, 2e-4) &&
      !this.pointerMoving
    );
  }

  uniforms(): FieldUniforms {
    const p = this.params;
    const mode = this.palette.dark ? "dark" : "light";
    return {
      time: this.time,
      pointer: [this.px.x, this.py.x, this.presence.x],
      bg: this.palette.bg,
      fg: this.palette.fg,
      accent: this.palette.accent,
      accent2: this.palette.accent2,
      hue: this.scroll.x * p.hueRange,
      intensity: p.intensity[mode] * this.contrastFactor,
      lines: p.lines[mode] * this.contrastFactor,
      scale: p.scale,
      pull: p.pull,
      seed: this.seed,
    };
  }
}
