import type { Transition } from "motion/react";
import { useSyncExternalStore } from "react";

/**
 * Spring presets (Motion's bounce + duration API maps onto Apple's
 * damping ratio + response).
 *
 * - default: critically damped. Use for nearly everything.
 * - snappy:  critically damped, quicker. Small UI (toggles, indicators).
 * - momentum: slight overshoot. Only after a flick or drag release.
 */
export const spring = {
  default: { type: "spring", bounce: 0, duration: 0.4 },
  snappy: { type: "spring", bounce: 0, duration: 0.3 },
  momentum: { type: "spring", bounce: 0.2, duration: 0.4 },
} as const satisfies Record<string, Transition>;

export type SpringName = keyof typeof spring;

/** The reduced-motion replacement for every spring: a short cross-fade. */
export const reducedTransition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
} as const satisfies Transition;

/** Deceleration rates for `project`. */
export const decelerationRate = {
  normal: 0.998,
  fast: 0.99,
} as const;

/**
 * Distance a released gesture would travel before coming to rest, using
 * Apple's exponential-decay projection (Designing Fluid Interfaces, WWDC18).
 *
 * @param velocity release velocity in px/s
 * @param rate deceleration rate per millisecond (0 < rate < 1)
 * @returns projected distance in px (same sign as velocity)
 */
export function project(
  velocity: number,
  rate: number = decelerationRate.normal,
): number {
  if (!(rate > 0 && rate < 1)) {
    throw new RangeError(`decelerationRate must be in (0, 1), got ${rate}`);
  }
  return ((velocity / 1000) * rate) / (1 - rate);
}

/**
 * Rubber-band resistance past a boundary: follows nearly 1:1 at first, then
 * resists more the further it goes, never exceeding `dimension`.
 *
 * @param overshoot distance past the boundary in px (signed)
 * @param dimension size of the dragged axis (e.g. the sheet height) in px
 * @param constant resistance; 0.55 matches iOS scroll views
 * @returns the displayed offset past the boundary (same sign as overshoot)
 */
export function rubberband(
  overshoot: number,
  dimension: number,
  constant = 0.55,
): number {
  if (overshoot === 0 || dimension <= 0) return 0;
  return (
    (overshoot * dimension * constant) /
    (dimension + constant * Math.abs(overshoot))
  );
}

/**
 * Clamp `value` to [min, max], rubber-banding the part that falls outside.
 */
export function rubberbandClamp(
  value: number,
  min: number,
  max: number,
  dimension: number,
  constant = 0.55,
): number {
  if (value < min) return min + rubberband(value - min, dimension, constant);
  if (value > max) return max + rubberband(value - max, dimension, constant);
  return value;
}

/**
 * Pick the snap point nearest to where a gesture is heading: project the
 * release velocity forward, then snap to the closest point to that projection.
 */
export function projectedSnapPoint(
  position: number,
  velocity: number,
  snapPoints: readonly number[],
  rate: number = decelerationRate.normal,
): number {
  if (snapPoints.length === 0) {
    throw new RangeError("snapPoints must not be empty");
  }
  const projected = position + project(velocity, rate);
  let best = snapPoints[0];
  for (const point of snapPoints) {
    if (Math.abs(point - projected) < Math.abs(best - projected)) best = point;
  }
  return best;
}

export interface MotionPreference {
  /** True when the user asked for reduced motion. */
  reduced: boolean;
  /** Spring presets, or the cross-fade replacement under reduced motion. */
  spring: Record<SpringName, Transition>;
  /** Scale applied on pointer-down (1 = none under reduced motion). */
  pressScale: number;
}

const fullMotion: MotionPreference = {
  reduced: false,
  spring,
  pressScale: 0.97,
};

const reducedMotion: MotionPreference = {
  reduced: true,
  spring: {
    default: reducedTransition,
    snappy: reducedTransition,
    momentum: reducedTransition,
  },
  pressScale: 1,
};

/**
 * Motion settings that respect prefers-reduced-motion. Under reduced motion,
 * every spring becomes a short ease-out tween; callers should also swap
 * transforms (slides, scales) for opacity.
 */
export function useMotionPreference(): MotionPreference {
  return usePrefersReducedMotion() ? reducedMotion : fullMotion;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Live prefers-reduced-motion. The server snapshot is false, so the
 * prerendered HTML assumes motion and the client corrects after hydration
 * without a mismatch warning.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false,
    () => false,
  );
}
