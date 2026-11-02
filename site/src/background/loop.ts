/**
 * A requestAnimationFrame loop that can be paused for independent reasons
 * (tab hidden, window blurred) and goes to sleep when the frame callback
 * reports it has nothing left to animate. `wake()` restarts a sleeping loop.
 */
export interface FrameLoop {
  /** Pause or resume for a named reason; the loop runs only with no reasons set. */
  setPaused(reason: string, paused: boolean): void;
  /** Resume after the tick callback put the loop to sleep. */
  wake(): void;
  readonly running: boolean;
  dispose(): void;
}

export interface FrameLoopOptions {
  /** Called once per frame with seconds since the previous frame. Return false to sleep. */
  tick(dt: number, now: number): boolean;
  raf?: (cb: FrameRequestCallback) => number;
  caf?: (handle: number) => void;
  /** Longest step passed to tick, so a stalled tab doesn't produce a jump. */
  maxDt?: number;
}

export function createFrameLoop({
  tick,
  raf = (cb) => requestAnimationFrame(cb),
  caf = (h) => cancelAnimationFrame(h),
  maxDt = 1 / 20,
}: FrameLoopOptions): FrameLoop {
  const reasons = new Set<string>();
  let handle: number | null = null;
  let last: number | null = null;
  let asleep = false;
  let disposed = false;

  const frame = (now: number) => {
    handle = null;
    const dt = last === null ? 1 / 60 : Math.min((now - last) / 1000, maxDt);
    last = now;
    const keepGoing = tick(Math.max(dt, 0), now);
    if (!keepGoing) {
      asleep = true;
      last = null;
      return;
    }
    schedule();
  };

  function schedule() {
    if (disposed || handle !== null || asleep || reasons.size > 0) return;
    handle = raf(frame);
  }

  function cancel() {
    if (handle !== null) caf(handle);
    handle = null;
    last = null;
  }

  schedule();

  return {
    setPaused(reason, paused) {
      if (paused) {
        reasons.add(reason);
        cancel();
      } else if (reasons.delete(reason)) {
        schedule();
      }
    },
    wake() {
      asleep = false;
      schedule();
    },
    get running() {
      return handle !== null;
    },
    dispose() {
      disposed = true;
      cancel();
    },
  };
}
