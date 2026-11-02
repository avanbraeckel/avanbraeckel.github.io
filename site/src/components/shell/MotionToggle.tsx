"use client";

import { Icon } from "@/components/ui";
import { cx } from "@/components/ui/cx";
import {
  setAmbientMotionPaused,
  useAmbientMotionPaused,
} from "@/design/ambientMotion";
import styles from "./MotionToggle.module.css";

export interface MotionToggleProps {
  /** `icon` is the compact nav-bar button; `row` is the labelled sheet row. */
  variant?: "icon" | "row";
  className?: string;
}

const LABEL = "Pause animations";

/**
 * Pauses or resumes all ambient animation (the background field and the
 * looping sprites), satisfying WCAG 2.2.2. A toggle button: the name stays
 * constant and `aria-pressed` carries the state. Hidden under
 * prefers-reduced-motion, where nothing moves.
 */
export function MotionToggle({
  variant = "icon",
  className,
}: MotionToggleProps) {
  const paused = useAmbientMotionPaused();
  return (
    <button
      type="button"
      className={cx(styles.toggle, styles[variant], className)}
      aria-pressed={paused}
      title={variant === "icon" ? LABEL : undefined}
      aria-label={variant === "icon" ? LABEL : undefined}
      onClick={() => setAmbientMotionPaused(!paused)}
    >
      {variant === "icon" ? (
        <Icon name={paused ? "play" : "pause"} size="1rem" />
      ) : (
        <>
          <span className={styles.text}>{LABEL}</span>
          <span className={styles.switch} aria-hidden="true">
            <span className={styles.knob} />
          </span>
        </>
      )}
    </button>
  );
}
