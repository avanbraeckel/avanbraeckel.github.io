import type { CSSProperties } from "react";
import { cx } from "@/components/ui/cx";
import { sprites, type SpriteName } from "@/sprites";
import styles from "./PixelSprite.module.css";

export interface PixelSpriteProps {
  /** Which strip to show. */
  sprite: SpriteName;
  /** Whole-number magnification; keeps every art pixel the same size. */
  scale?: number;
  /** Playback rate. Defaults to the rate the animation was drawn for. */
  fps?: number;
  /** When false, holds the sprite's still frame. */
  playing?: boolean;
  /** Mirror horizontally. */
  flip?: boolean;
  /** Accessible name. Without one the sprite is decorative and hidden. */
  label?: string;
  className?: string;
}

type SpriteStyle = CSSProperties & Record<`--sprite-${string}`, string>;

/**
 * One animated sprite from Transient, drawn by stepping a CSS background
 * through a horizontal strip, so no JavaScript runs per frame. Under
 * prefers-reduced-motion, or when ambient animation is paused, it shows a
 * single still frame.
 */
export function PixelSprite({
  sprite,
  scale = 2,
  fps,
  playing = true,
  flip = false,
  label,
  className,
}: PixelSpriteProps) {
  const sheet = sprites[sprite];
  const s = Math.max(1, Math.round(scale));
  const rate = fps ?? sheet.fps;
  const width = sheet.frameWidth * s;
  const height = sheet.frameHeight * s;

  const style: SpriteStyle = {
    width: `${width}px`,
    height: `${height}px`,
    backgroundImage: `url(${sheet.src})`,
    backgroundSize: `${width * sheet.frames}px ${height}px`,
    "--sprite-end": `${-width * sheet.frames}px`,
    "--sprite-still": `${-width * sheet.still}px`,
    "--sprite-steps": String(sheet.frames),
    "--sprite-duration": `${sheet.frames / rate}s`,
  };

  const a11y = label
    ? { role: "img" as const, "aria-label": label }
    : { "aria-hidden": true as const };

  return (
    <span
      className={cx(styles.sprite, flip && styles.flip, className)}
      style={style}
      data-sprite={sprite}
      data-playing={playing && sheet.frames > 1 ? "true" : "false"}
      {...a11y}
    />
  );
}
