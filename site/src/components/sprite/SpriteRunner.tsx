"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cx } from "@/components/ui/cx";
import { sprites } from "@/sprites";
import { PixelSprite } from "./PixelSprite";
import styles from "./SpriteRunner.module.css";

export interface SpriteRunnerProps {
  /** Whole-number magnification of the art. */
  scale?: number;
  /** Travel speed in CSS pixels per second. */
  speed?: number;
  /** Place a gem along the track that the runner collects on the way out. */
  gem?: boolean;
  className?: string;
}

/** Where the gem sits, as a fraction of the runner's travel. */
export const GEM_AT = 0.7;

type TrackStyle = CSSProperties & Record<`--runner-${string}`, string>;

interface Track {
  /** Travel distance in CSS pixels, a whole number of art pixels. */
  distance: number;
  /** Duration of one there-and-back lap in seconds. */
  duration: number;
}

/** Travel for a track of the given width, or null if the sprite cannot move. */
export function measureTrack(
  width: number,
  scale: number,
  speed: number,
): Track | null {
  const spriteWidth = sprites["player-run"].frameWidth * scale;
  const pixels = Math.floor((width - spriteWidth) / scale);
  if (pixels < 1 || speed <= 0) return null;
  const distance = pixels * scale;
  return { distance, duration: (2 * distance) / speed };
}

/**
 * Transient's hero running back and forth along a strip, turning at each end.
 * Movement steps in whole art pixels, so the sprite never blurs between
 * positions. The animation pauses while the strip is off-screen or the tab is
 * hidden. Under prefers-reduced-motion, or once the visitor pauses ambient
 * animation (html[data-ambient-motion="paused"]), the character stands idle at the left
 * end. Purely decorative: hidden from assistive technology.
 */
export function SpriteRunner({
  scale = 2,
  speed = 60,
  gem = true,
  className,
}: SpriteRunnerProps) {
  const s = Math.max(1, Math.round(scale));
  const ref = useRef<HTMLDivElement>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () =>
      setTrack((prev) => {
        const next = measureTrack(el.clientWidth, s, speed);
        return prev?.distance === next?.distance &&
          prev?.duration === next?.duration
          ? prev
          : next;
      });
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [s, speed]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(entry.isIntersecting),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setTabVisible(document.visibilityState !== "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const run = sprites["player-run"];
  const gemSheet = sprites.gem;
  const style: TrackStyle = {
    height: `${run.frameHeight * s}px`,
    "--runner-width": `${run.frameWidth * s}px`,
    "--runner-distance": `${track?.distance ?? 0}px`,
    "--runner-steps": String(track ? track.distance / s : 1),
    "--runner-duration": `${track?.duration ?? 1}s`,
    // Snap the gem to the art-pixel grid like everything else.
    "--runner-gem-left": `${
      Math.round(
        (GEM_AT * (track?.distance ?? 0) +
          (run.frameWidth * s) / 2 -
          (gemSheet.frameWidth * s) / 2) /
          s,
      ) * s
    }px`,
    "--runner-gem-bottom": `${10 * s}px`,
    "--runner-gem-lift": `${-4 * s}px`,
  };

  return (
    <div
      ref={ref}
      className={cx(styles.track, className)}
      style={style}
      data-ready={track ? "true" : "false"}
      data-active={onScreen && tabVisible ? "true" : "false"}
      data-sprite-runner=""
      aria-hidden="true"
    >
      {gem && track ? (
        <span className={styles.gem}>
          <PixelSprite sprite="gem" scale={s} />
        </span>
      ) : null}
      <span className={styles.mover}>
        <span className={styles.facing}>
          <PixelSprite sprite="player-run" scale={s} className={styles.run} />
          <PixelSprite sprite="player-idle" scale={s} className={styles.idle} />
        </span>
      </span>
    </div>
  );
}
