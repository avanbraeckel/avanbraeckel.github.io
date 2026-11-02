import type { ReactNode } from "react";
import { Picture } from "@/components/Picture";
import { cx } from "@/components/ui/cx";
import { getMedia, type MediaId } from "@/media";
import styles from "./Prose.module.css";

export interface FigureProps {
  id: MediaId;
  /** Overrides the manifest caption. */
  caption?: ReactNode;
  /** wide: breaks out of the reading column. */
  size?: "column" | "wide";
}

/** A captioned photo inside a case study. */
export function Figure({ id, caption, size = "wide" }: FigureProps) {
  const image = getMedia(id);
  return (
    <figure className={cx(styles.figure, styles[size])}>
      <div className={styles.media}>
        <Picture
          id={id}
          sizes={
            size === "wide"
              ? "(min-width: 60rem) 56rem, calc(100vw - 2.5rem)"
              : "(min-width: 48rem) 42rem, calc(100vw - 2.5rem)"
          }
        />
      </div>
      <figcaption className={cx("t-footnote", styles.caption)}>
        {caption ?? image.caption}
      </figcaption>
    </figure>
  );
}

export interface FigureRowProps {
  ids: MediaId[];
  /** One caption for the row; defaults to each image's own caption. */
  caption?: ReactNode;
}

/** Two or three photos side by side, cropped to a shared aspect ratio. */
export function FigureRow({ ids, caption }: FigureRowProps) {
  return (
    <figure className={cx(styles.figure, styles.wide)}>
      <div className={styles.row} data-count={ids.length}>
        {ids.map((id) => (
          <div key={id} className={cx(styles.media, styles.cell)}>
            <Picture
              id={id}
              fill
              sizes={`(min-width: 60rem) ${Math.round(56 / ids.length)}rem, calc(100vw - 2.5rem)`}
            />
          </div>
        ))}
      </div>
      <figcaption className={cx("t-footnote", styles.caption)}>
        {caption ?? ids.map((id) => getMedia(id).caption).join(" · ")}
      </figcaption>
    </figure>
  );
}
