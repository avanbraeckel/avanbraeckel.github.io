import { describe, expect, it, vi } from "vitest";
import { createFrameLoop } from "./loop";

function fakeRaf() {
  let next = 1;
  const pending = new Map<number, FrameRequestCallback>();
  let now = 0;
  return {
    raf: (cb: FrameRequestCallback) => {
      pending.set(next, cb);
      return next++;
    },
    caf: (h: number) => void pending.delete(h),
    pending,
    /** Run one frame for every pending callback. */
    flush(ms = 16) {
      now += ms;
      const cbs = [...pending.values()];
      pending.clear();
      cbs.forEach((cb) => cb(now));
    },
  };
}

describe("createFrameLoop", () => {
  it("runs every frame until tick returns false, then sleeps until woken", () => {
    const f = fakeRaf();
    let keep = true;
    const tick = vi.fn(() => keep);
    const loop = createFrameLoop({ tick, raf: f.raf, caf: f.caf });
    expect(loop.running).toBe(true);
    f.flush();
    f.flush();
    expect(tick).toHaveBeenCalledTimes(2);
    keep = false;
    f.flush();
    expect(loop.running).toBe(false);
    f.flush();
    expect(tick).toHaveBeenCalledTimes(3);
    keep = true;
    loop.wake();
    expect(loop.running).toBe(true);
    f.flush();
    expect(tick).toHaveBeenCalledTimes(4);
  });

  it("pauses while any reason is set and resumes when all clear", () => {
    const f = fakeRaf();
    const tick = vi.fn(() => true);
    const loop = createFrameLoop({ tick, raf: f.raf, caf: f.caf });
    loop.setPaused("hidden", true);
    loop.setPaused("blur", true);
    expect(loop.running).toBe(false);
    expect(f.pending.size).toBe(0);
    f.flush();
    expect(tick).not.toHaveBeenCalled();
    loop.setPaused("hidden", false);
    expect(loop.running).toBe(false);
    loop.setPaused("blur", false);
    expect(loop.running).toBe(true);
    f.flush();
    expect(tick).toHaveBeenCalledTimes(1);
  });

  it("caps dt so a resume after a long pause does not jump", () => {
    const f = fakeRaf();
    const dts: number[] = [];
    const loop = createFrameLoop({
      tick: (dt) => (dts.push(dt), true),
      raf: f.raf,
      caf: f.caf,
    });
    f.flush(16);
    f.flush(5000);
    expect(dts[1]).toBeCloseTo(1 / 20);
    loop.setPaused("hidden", true);
    f.flush(10_000);
    loop.setPaused("hidden", false);
    f.flush(10_000);
    expect(dts[2]).toBeCloseTo(1 / 60);
    loop.dispose();
    expect(loop.running).toBe(false);
  });
});
