"use client";

import { Icon } from "@/components/ui";
import { cx } from "@/components/ui/cx";
import { setTheme, useTheme } from "@/design/theme";
// The nav-bar button and sheet row share their look with MotionToggle.
import shared from "./MotionToggle.module.css";
import styles from "./ThemeToggle.module.css";

export interface ThemeToggleProps {
  /** `icon` is the compact nav-bar button; `row` is the labelled sheet row. */
  variant?: "icon" | "row";
  className?: string;
}

/**
 * Switches between light and dark mode and remembers the choice. The nav-bar
 * button shows a moon in light mode and a sun in dark mode, and is named for
 * the action it takes. The sheet row is a "Dark mode" switch with
 * `aria-pressed`, like the animation row above it.
 */
export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const theme = useTheme();
  const dark = theme === "dark";
  const toggle = () => setTheme(dark ? "light" : "dark");

  if (variant === "row") {
    return (
      <button
        type="button"
        className={cx(styles.toggle, shared.row, className)}
        aria-pressed={dark}
        onClick={toggle}
      >
        <span className={shared.text}>Dark mode</span>
        <span className={shared.switch} aria-hidden="true">
          <span className={shared.knob} />
        </span>
      </button>
    );
  }

  const label = dark ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button
      type="button"
      className={cx(styles.toggle, shared.icon, className)}
      aria-label={label}
      title={label}
      onClick={toggle}
    >
      {/* Both glyphs render; CSS shows the one for the current theme, so the
          right icon is there before hydration. */}
      <span className={styles.moon}>
        <Icon name="moon" size="1rem" />
      </span>
      <span className={styles.sun}>
        <Icon name="sun" size="1rem" />
      </span>
    </button>
  );
}
