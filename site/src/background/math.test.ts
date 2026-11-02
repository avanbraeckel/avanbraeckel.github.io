import { describe, expect, it } from "vitest";
import {
  approach,
  isSettled,
  mixRgb,
  parseCssColor,
  relativeLuminance,
  renderSize,
  scrollProgress,
  springStep,
} from "./math";

describe("springStep", () => {
  it("converges to the target without overshoot (critically damped)", () => {
    let x = 0;
    let v = 0;
    let max = 0;
    for (let i = 0; i < 600; i++) {
      [x, v] = springStep(x, v, 1, 6, 1 / 60);
      max = Math.max(max, x);
    }
    expect(x).toBeCloseTo(1, 4);
    expect(max).toBeLessThanOrEqual(1 + 1e-9);
    expect(isSettled(x, v, 1)).toBe(true);
  });

  it("is frame-rate independent", () => {
    let a: [number, number] = [0, 0];
    for (let i = 0; i < 60; i++) a = springStep(a[0], a[1], 1, 4, 1 / 60);
    let b: [number, number] = [0, 0];
    for (let i = 0; i < 120; i++) b = springStep(b[0], b[1], 1, 4, 1 / 120);
    const c = springStep(0, 0, 1, 4, 1);
    expect(a[0]).toBeCloseTo(b[0], 9);
    expect(a[0]).toBeCloseTo(c[0], 9);
  });

  it("is a no-op for dt <= 0", () => {
    expect(springStep(0.3, 2, 1, 4, 0)).toEqual([0.3, 2]);
  });
});

describe("renderSize", () => {
  it("renders at half CSS resolution at DPR 1", () => {
    expect(renderSize(1440, 900, 1)).toEqual({ width: 720, height: 450 });
  });
  it("caps DPR at 1.5", () => {
    expect(renderSize(1000, 500, 3)).toEqual({ width: 750, height: 375 });
  });
  it("never exceeds 0.5 scale and never returns 0", () => {
    expect(renderSize(1000, 500, 1, 2)).toEqual({ width: 500, height: 250 });
    expect(renderSize(0, 0, 1)).toEqual({ width: 1, height: 1 });
  });
});

describe("scrollProgress", () => {
  it("maps scroll to 0..1 and clamps", () => {
    expect(scrollProgress(0, 2000, 1000)).toBe(0);
    expect(scrollProgress(500, 2000, 1000)).toBe(0.5);
    expect(scrollProgress(5000, 2000, 1000)).toBe(1);
    expect(scrollProgress(-50, 2000, 1000)).toBe(0);
  });
  it("is 0 when the page does not scroll", () => {
    expect(scrollProgress(0, 800, 1000)).toBe(0);
  });
});

describe("parseCssColor", () => {
  it.each([
    ["#fff", [1, 1, 1]],
    ["#000000", [0, 0, 0]],
    ["#ff000080", [1, 0, 0]],
    ["rgb(255, 0, 0)", [1, 0, 0]],
    ["rgba(0,255,0,0.5)", [0, 1, 0]],
    ["rgb(0 0 255 / 50%)", [0, 0, 1]],
    ["  #0071E3 ", [0, 113 / 255, 227 / 255]],
  ])("parses %s", (input, expected) => {
    const rgb = parseCssColor(input);
    expect(rgb).not.toBeNull();
    rgb!.forEach((c, i) => expect(c).toBeCloseTo(expected[i], 5));
  });
  it.each(["", "blue", "oklch(0.6 0.2 250)", "#12345", "rgb(1,2)"])(
    "rejects %s",
    (input) => expect(parseCssColor(input)).toBeNull(),
  );
});

describe("color helpers", () => {
  it("computes relative luminance", () => {
    expect(relativeLuminance([1, 1, 1])).toBeCloseTo(1);
    expect(relativeLuminance([0, 0, 0])).toBe(0);
  });
  it("mixes linearly", () => {
    expect(mixRgb([0, 0, 0], [1, 0.5, 0], 0.5)).toEqual([0.5, 0.25, 0]);
  });
  it("approach is 0..1 and 1 for zero time constant", () => {
    expect(approach(0.016, 0)).toBe(1);
    const k = approach(0.016, 0.2);
    expect(k).toBeGreaterThan(0);
    expect(k).toBeLessThan(1);
  });
});
