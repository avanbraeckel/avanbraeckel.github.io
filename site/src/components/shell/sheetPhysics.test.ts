import { describe, expect, it } from "vitest";
import {
  FLICK_VELOCITY,
  VelocityTracker,
  dragOffset,
  releaseDecision,
} from "./sheetPhysics";

describe("VelocityTracker", () => {
  it("is zero with fewer than two samples", () => {
    const tracker = new VelocityTracker();
    expect(tracker.velocity()).toBe(0);
    tracker.add(0, 10);
    expect(tracker.velocity()).toBe(0);
  });

  it("measures px/s over the recent window", () => {
    const tracker = new VelocityTracker();
    for (let t = 0; t <= 160; t += 16) tracker.add(t, t * 2); // 2 px/ms
    expect(tracker.velocity()).toBeCloseTo(2000);
  });

  it("ignores samples older than the window", () => {
    const tracker = new VelocityTracker();
    tracker.add(0, 0);
    tracker.add(500, 0); // held still for a long time
    tracker.add(520, 20);
    tracker.add(540, 40);
    expect(tracker.velocity()).toBeCloseTo(1000);
  });

  it("reports no velocity when the pointer sat still before release", () => {
    const tracker = new VelocityTracker();
    tracker.add(0, 0);
    tracker.add(16, 30);
    expect(tracker.velocity(20)).toBeGreaterThan(0);
    expect(tracker.velocity(200)).toBe(0);
  });

  it("resets", () => {
    const tracker = new VelocityTracker();
    tracker.add(0, 0);
    tracker.add(16, 30);
    tracker.reset();
    expect(tracker.velocity()).toBe(0);
  });
});

describe("dragOffset", () => {
  it("tracks 1:1 between open and below", () => {
    expect(dragOffset(0, 400)).toBe(0);
    expect(dragOffset(123, 400)).toBe(123);
    expect(dragOffset(600, 400)).toBe(600);
  });

  it("rubber-bands above the open position with growing resistance", () => {
    const a = dragOffset(-50, 400);
    const b = dragOffset(-200, 400);
    expect(a).toBeLessThan(0);
    expect(a).toBeGreaterThan(-50);
    expect(b).toBeGreaterThan(-200);
    // Resistance grows: the second 150px moves the sheet less than the first 50px ratio.
    expect((b - a) / -150).toBeLessThan(a / -50);
    expect(dragOffset(-1e6, 400)).toBeGreaterThan(-400);
  });
});

describe("releaseDecision", () => {
  const closed = 400;

  it("stays open after a short, slow drag", () => {
    expect(releaseDecision(80, 0, closed)).toEqual({
      open: true,
      momentum: false,
    });
  });

  it("closes after dragging most of the way, even slowly", () => {
    expect(releaseDecision(260, 0, closed).open).toBe(false);
  });

  it("closes on a downward flick from near the top (momentum projection)", () => {
    const decision = releaseDecision(40, 1200, closed);
    expect(decision).toEqual({ open: false, momentum: true });
  });

  it("reopens on an upward flick from near the bottom", () => {
    expect(releaseDecision(320, -1200, closed)).toEqual({
      open: true,
      momentum: true,
    });
  });

  it("uses the momentum spring only above the flick threshold", () => {
    expect(releaseDecision(0, FLICK_VELOCITY - 1, closed).momentum).toBe(false);
    expect(releaseDecision(0, -FLICK_VELOCITY, closed).momentum).toBe(true);
  });
});
