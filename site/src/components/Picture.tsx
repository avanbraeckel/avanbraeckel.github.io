import type { CSSProperties } from "react";
import { getMedia, toSrcSet, type MediaId } from "@/media";
import styles from "./Picture.module.css";

export interface PictureProps {
  /** Id from `media-sources.json`. */
  id: MediaId;
  /** Rendered width hint for the browser, e.g. "(min-width: 768px) 50vw, 100vw". */
  sizes?: string;
  /** Above-the-fold image: eager load with high fetch priority. */
  priority?: boolean;
  /** Overrides the manifest alt text. Pass "" for decorative images. */
  alt?: string;
  /** Fill the parent box with object-fit: cover; the parent must be positioned and sized. */
  fill?: boolean;
  className?: string;
  imgClassName?: string;
}

/**
 * Responsive `<picture>` for an optimized image: AVIF and WebP sources,
 * explicit dimensions to prevent layout shift, lazy by default, and a blur
 * placeholder background while the image loads.
 */
export function Picture({
  id,
  sizes = "100vw",
  priority = false,
  alt,
  fill = false,
  className,
  imgClassName,
}: PictureProps) {
  const image = getMedia(id);
  const style: CSSProperties | undefined = image.blurDataURL
    ? { backgroundImage: `url("${image.blurDataURL}")` }
    : undefined;
  const imgClasses = [
    styles.img,
    image.blurDataURL ? styles.placeholder : undefined,
    fill ? styles.fill : undefined,
    imgClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <picture className={[styles.picture, className].filter(Boolean).join(" ")}>
      {image.sources.map((source) => (
        <source
          key={source.type}
          type={source.type}
          srcSet={toSrcSet(source)}
          sizes={sizes}
        />
      ))}
      <img
        src={image.fallback}
        alt={alt ?? image.alt}
        width={image.width}
        height={image.height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : undefined}
        className={imgClasses}
        style={style}
      />
    </picture>
  );
}
