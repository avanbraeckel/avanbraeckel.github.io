import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  decelerationRate,
  project,
  projectedSnapPoint,
  reducedTransition,
  rubberband,
  rubberbandClamp,
  spring,
  useMotionPreference,
} from "./motion";

describe("spring presets", () => {
  it("are critically damped except momentum", () => {
    expect(spring.default).toMatchObject({ bounce: 0, duration: 0.4 });
    expect(spring.snappy).toMatchObject({ bounce: 0, duration: 0.3 });
    expect(spring.momentum).toMatchObject({ bounce: 0.2, duration: 0.4 });
  });
});

describe("project", () => {
  it("matches Apple's exponential-decay projection", () => {
    // 1000 px/s at 0.998 → 1 * 0.998 / 0.002 = 499
    expect(project(1000)).toBeCloseTo(499, 6);
    expect(project(1000, decelerationRate.fast)).toBeCloseTo(99, 6);
  });

  it("keeps the sign of the velocity and is zero at rest", () => {
    expect(project(-500)).toBeCloseTo(-249.5, 6);
    expect(project(0)).toBe(0);
  });

  it("rejects rates outside (0, 1)", () => {
    expect(() => project(100, 1)).toThrow(RangeError);
    expect(() => project(100, 0)).toThrow(RangeError);
  });
});

describe("rubberband", () => {
  it("is zero with no overshoot", () => {
    expect(rubberband(0, 400)).toBe(0);
  });

  it("follows the formula and preserves sign", () => {
    // (100 * 400 * 0.55) / (400 + 0.55 * 100) = 22000 / 455
    expect(rubberband(100, 400)).toBeCloseTo(22000 / 455, 6);
    expect(rubberband(-100, 400)).toBeCloseTo(-22000 / 455, 6);
  });

  it("always resists and never exceeds the dimension", () => {
    for (const x of [1, 10, 100, 1000]) {
      expect(Math.abs(rubberband(x, 400))).toBeLessThan(x);
    }
    expect(rubberband(1e9, 400)).toBeLessThan(400);
    expect(rubberband(1e9, 400)).toBeCloseTo(400, 2);
  });

  it("grows monotonically with overshoot", () => {
    expect(rubberband(50, 400)).toBeLessThan(rubberband(100, 400));
  });
});

describe("rubberbandClamp", () => {
  it("passes values within bounds through", () => {
    expect(rubberbandClamp(50, 0, 100, 400)).toBe(50);
  });

  it("rubber-bands past either bound", () => {
    expect(rubberbandClamp(150, 0, 100, 400)).toBeCloseTo(
      100 + rubberband(50, 400),
    );
    expect(rubberbandClamp(-50, 0, 100, 400)).toBeCloseTo(rubberband(-50, 400));
  });
});

describe("projectedSnapPoint", () => {
  const points = [0, 200, 400];

  it("snaps to the nearest point when at rest", () => {
    expect(projectedSnapPoint(90, 0, points)).toBe(0);
    expect(projectedSnapPoint(110, 0, points)).toBe(200);
  });

  it("follows the flick, not the release position", () => {
    // 90 + project(1000) ≈ 589 → 400
    expect(projectedSnapPoint(90, 1000, points)).toBe(400);
    expect(projectedSnapPoint(310, -600, points)).toBe(0);
  });

  it("requires at least one snap point", () => {
    expect(() => projectedSnapPoint(0, 0, [])).toThrow(RangeError);
  });
});

describe("useMotionPreference", () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubReducedMotion(reduce: boolean) {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: reduce && query.includes("reduce"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  }

  it("returns springs when motion is allowed", () => {
    stubReducedMotion(false);
    const { result } = renderHook(() => useMotionPreference());
    expect(result.current.reduced).toBe(false);
    expect(result.current.spring.default).toBe(spring.default);
    expect(result.current.pressScale).toBe(0.97);
  });

  it("returns cross-fade tweens under reduced motion", () => {
    stubReducedMotion(true);
    const { result } = renderHook(() => useMotionPreference());
    expect(result.current.reduced).toBe(true);
    expect(result.current.spring.momentum).toBe(reducedTransition);
    expect(result.current.pressScale).toBe(1);
  });
});
