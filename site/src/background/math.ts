/** Pure helpers for the living background. No DOM access here. */

export type Rgb = readonly [number, number, number];

/**
 * Advance a critically damped spring by `dt` seconds using the exact
 * closed-form solution, so it is stable for any frame time.
 * `omega` is the natural frequency (rad/s); higher settles faster.
 */
export function springStep(
  value: number,
  velocity: number,
  target: number,
  omega: number,
  dt: number,
): [value: number, velocity: number] {
  if (dt <= 0) return [value, velocity];
  const x0 = value - target;
  const decay = Math.exp(-omega * dt);
  const c = velocity + omega * x0;
  const x = (x0 + c * dt) * decay;
  const v = (velocity - omega * c * dt) * decay;
  return [target + x, v];
}

export function isSettled(
  value: number,
  velocity: number,
  target: number,
  epsilon = 1e-3,
): boolean {
  return Math.abs(value - target) < epsilon && Math.abs(velocity) < epsilon;
}

/**
 * Backing-store size for the canvas. The field is a blur, so it renders at a
 * fraction of CSS resolution and the browser upscales it.
 */
export function renderSize(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
  scale = 0.5,
  maxDpr = 1.5,
): { width: number; height: number } {
  const dpr = Math.min(Math.max(devicePixelRatio || 1, 1), maxDpr);
  const factor = dpr * Math.min(Math.max(scale, 0.05), 0.5);
  return {
    width: Math.max(1, Math.round(cssWidth * factor)),
    height: Math.max(1, Math.round(cssHeight * factor)),
  };
}

/** Scroll position as 0..1 of the scrollable range (0 when nothing scrolls). */
export function scrollProgress(
  scrollY: number,
  scrollHeight: number,
  viewportHeight: number,
): number {
  const range = scrollHeight - viewportHeight;
  if (!(range > 0)) return 0;
  return Math.min(Math.max(scrollY / range, 0), 1);
}

/**
 * Parse the CSS color forms a design token is likely to use: #rgb, #rgba,
 * #rrggbb, #rrggbbaa, rgb()/rgba() in comma or space syntax. Returns sRGB in
 * 0..1, ignoring alpha, or null when the string is not one of those forms.
 */
export function parseCssColor(input: string): Rgb | null {
  const s = input.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3,8})$/.exec(s);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) {
      h = h
        .slice(0, 3)
        .split("")
        .map((c) => c + c)
        .join("");
    } else if (h.length === 6 || h.length === 8) {
      h = h.slice(0, 6);
    } else {
      return null;
    }
    const n = parseInt(h, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const fn = /^rgba?\(([^)]*)\)$/.exec(s);
  if (fn) {
    const parts = fn[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .slice(0, 3);
    if (parts.length < 3) return null;
    const channels = parts.map((p) =>
      p.endsWith("%") ? parseFloat(p) / 100 : parseFloat(p) / 255,
    );
    if (channels.some((c) => !Number.isFinite(c))) return null;
    return channels.map((c) => Math.min(Math.max(c, 0), 1)) as unknown as Rgb;
  }
  return null;
}

/** WCAG relative luminance of an sRGB color. */
export function relativeLuminance([r, g, b]: Rgb): number {
  const lin = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Move `from` toward `to` by fraction `t` (0..1). */
export function mixRgb(from: Rgb, to: Rgb, t: number): Rgb {
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t,
  ];
}

/** Frame-rate independent exponential approach factor for a time constant. */
export function approach(dt: number, timeConstant: number): number {
  if (timeConstant <= 0) return 1;
  return 1 - Math.exp(-dt / timeConstant);
}
