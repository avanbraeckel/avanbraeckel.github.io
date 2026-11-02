import { projectedSnapPoint, rubberbandClamp } from "@/design/motion";

/**
 * Pure gesture math for the draggable nav sheet. The sheet's offset `y` is 0
 * when fully open and `closedY` (its height plus a margin) when fully closed.
 */

interface Sample {
  t: number;
  y: number;
}

/** Only samples this recent count toward the release velocity (ms). */
const VELOCITY_WINDOW = 100;
/** A pointer that sat still this long before release has no velocity (ms). */
const STALE_AFTER = 50;

/**
 * Release velocity from a short history of positions. Using a window of
 * samples rather than the last two events smooths out uneven event timing.
 */
export class VelocityTracker {
  private samples: Sample[] = [];

  reset(): void {
    this.samples = [];
  }

  add(t: number, y: number): void {
    this.samples.push({ t, y });
    const cutoff = t - VELOCITY_WINDOW;
    while (this.samples.length > 2 && this.samples[0].t < cutoff) {
      this.samples.shift();
    }
  }

  /** Velocity in px/s at time `now` (defaults to the last sample's time). */
  velocity(now?: number): number {
    const n = this.samples.length;
    if (n < 2) return 0;
    const last = this.samples[n - 1];
    if (now !== undefined && now - last.t > STALE_AFTER) return 0;
    const first = this.samples[0];
    const dt = last.t - first.t;
    if (dt <= 0) return 0;
    return ((last.y - first.y) / dt) * 1000;
  }
}

/**
 * Displayed offset for a raw drag offset: 1:1 between open and closed,
 * rubber-banding when pulled above the open position.
 */
export function dragOffset(raw: number, closedY: number): number {
  return rubberbandClamp(raw, 0, Number.POSITIVE_INFINITY, closedY);
}

/** Above this release speed (px/s) the gesture counts as a flick. */
export const FLICK_VELOCITY = 400;

export interface ReleaseDecision {
  open: boolean;
  /** Use the momentum (slight bounce) spring: only after a flick. */
  momentum: boolean;
}

/**
 * Where a released sheet should go: project the release velocity forward and
 * pick the nearer of open (0) and closed (closedY) to the projected point.
 */
export function releaseDecision(
  y: number,
  velocity: number,
  closedY: number,
): ReleaseDecision {
  const target = projectedSnapPoint(y, velocity, [0, closedY]);
  return {
    open: target === 0,
    momentum: Math.abs(velocity) >= FLICK_VELOCITY,
  };
}
