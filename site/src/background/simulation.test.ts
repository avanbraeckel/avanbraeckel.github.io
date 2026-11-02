import { describe, expect, it } from "vitest";
import { FALLBACK_PALETTES } from "./palette";
import { BACKGROUND_PARAMS, BackgroundSimulation } from "./simulation";

const run = (
  sim: BackgroundSimulation,
  seconds: number,
  input: Parameters<BackgroundSimulation["step"]>[1],
) => {
  let settled = false;
  for (let t = 0; t < seconds; t += 1 / 60) settled = sim.step(1 / 60, input);
  return settled;
};

describe("BackgroundSimulation", () => {
  it("keeps drifting while active and never reports settled", () => {
    const sim = new BackgroundSimulation(FALLBACK_PALETTES.light);
    const settled = run(sim, 5, { pointer: null, scroll: 0, idle: false });
    expect(settled).toBe(false);
    expect(sim.time).toBeCloseTo(5 * BACKGROUND_PARAMS.driftSpeed, 1);
  });

  it("eases the drift to a stop and settles when idle", () => {
    const sim = new BackgroundSimulation(FALLBACK_PALETTES.light);
    run(sim, 1, { pointer: null, scroll: 0, idle: false });
    const settled = run(sim, 15, { pointer: null, scroll: 0, idle: true });
    expect(settled).toBe(true);
    const frozen = sim.time;
    sim.step(1 / 60, { pointer: null, scroll: 0, idle: true });
    expect(sim.time - frozen).toBeLessThan(1e-4);
  });

  it("follows the pointer smoothly and flips y into GL space", () => {
    const sim = new BackgroundSimulation(FALLBACK_PALETTES.light);
    sim.step(1 / 60, { pointer: { x: 0.9, y: 0.2 }, scroll: 0, idle: false });
    const first = sim.uniforms().pointer;
    expect(first[0]).toBeGreaterThan(0.5);
    expect(first[0]).toBeLessThan(0.6);
    expect(sim.pointerMoving).toBe(true);
    run(sim, 6, { pointer: { x: 0.9, y: 0.2 }, scroll: 0, idle: false });
    const [x, y, presence] = sim.uniforms().pointer;
    expect(x).toBeCloseTo(0.9, 3);
    expect(y).toBeCloseTo(0.8, 3);
    expect(presence).toBeCloseTo(1, 3);
    expect(sim.pointerMoving).toBe(false);
  });

  it("maps scroll progress to a hue shift that is 0 at the top", () => {
    const sim = new BackgroundSimulation(FALLBACK_PALETTES.light);
    expect(sim.uniforms().hue).toBe(0);
    run(sim, 5, { pointer: null, scroll: 1, idle: false });
    expect(sim.uniforms().hue).toBeCloseTo(BACKGROUND_PARAMS.hueRange, 3);
  });

  it("cross-fades to a new palette, or snaps when immediate", () => {
    const sim = new BackgroundSimulation(FALLBACK_PALETTES.light);
    sim.setPalette(FALLBACK_PALETTES.dark);
    sim.step(1 / 60, { pointer: null, scroll: 0, idle: false });
    const mid = sim.uniforms().bg[0];
    expect(mid).toBeLessThan(FALLBACK_PALETTES.light.bg[0]);
    expect(mid).toBeGreaterThan(FALLBACK_PALETTES.dark.bg[0]);
    run(sim, 3, { pointer: null, scroll: 0, idle: false });
    expect(sim.uniforms().bg).toEqual(FALLBACK_PALETTES.dark.bg);

    sim.setPalette(FALLBACK_PALETTES.light, true);
    expect(sim.uniforms().bg).toEqual(FALLBACK_PALETTES.light.bg);
  });

  it("softens the field under prefers-contrast: more", () => {
    const sim = new BackgroundSimulation(FALLBACK_PALETTES.dark);
    const normal = sim.uniforms();
    sim.setMoreContrast(true);
    const reduced = sim.uniforms();
    expect(reduced.intensity).toBeLessThan(normal.intensity);
    expect(reduced.lines).toBeLessThan(normal.lines);
  });
});
