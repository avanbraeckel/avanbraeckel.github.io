import { ViewTransition, type CSSProperties } from "react";
import { Picture } from "@/components/Picture";
import { cx } from "@/components/ui/cx";
import type { ExperienceEntry } from "@/content/experience";
import styles from "./CoverArt.module.css";
import "./viewTransitions.css";

export interface CoverArtProps {
  entry: ExperienceEntry;
  /** card: timeline thumbnail. hero: case-study banner. */
  variant: "card" | "hero";
  /** `sizes` hint for the cover photo. */
  sizes: string;
  priority?: boolean;
  className?: string;
}

/** Shared view-transition name, so the card's art morphs into the hero. */
export function coverTransitionName(slug: string): string {
  return `experience-cover-${slug}`;
}

/**
 * The visual for an entry: its cover photo, or the company logo on a dark
 * brand-tinted plate (the logos are white-on-transparent). The same name is
 * used on the timeline card and the case-study hero, so navigating between
 * them morphs one into the other.
 */
export function CoverArt({
  entry,
  variant,
  sizes,
  priority,
  className,
}: CoverArtProps) {
  const art = entry.cover ? (
    <Picture
      id={entry.cover}
      sizes={sizes}
      priority={priority}
      fill
      className={styles.photo}
    />
  ) : entry.logo ? (
    <div className={styles.plate} aria-hidden="true">
      <Picture
        id={entry.logo}
        alt=""
        sizes={variant === "hero" ? "24rem" : "12rem"}
        priority={priority}
        className={styles.logo}
      />
    </div>
  ) : null;

  if (!art) return null;

  return (
    <ViewTransition
      name={coverTransitionName(entry.slug)}
      share="experience-morph"
    >
      <div
        className={cx(styles.frame, styles[variant], className)}
        style={
          entry.accent
            ? ({ "--brand": entry.accent } as CSSProperties)
            : undefined
        }
      >
        {art}
      </div>
    </ViewTransition>
  );
}
