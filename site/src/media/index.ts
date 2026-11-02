import manifest from "./manifest.json";

/**
 * Typed access to the generated media manifest.
 *
 * The manifest is produced by `scripts/optimize-images.mjs` from
 * `media-sources.json`. Add an image there, then run `npm run prebuild`.
 */

export type MediaGroup =
  "general" | "ncr" | "magnet-review" | "magnet-axiom-cyber";
export type MediaKind = "photo" | "logo" | "portrait" | "screenshot";

export interface MediaSourceSet {
  type: string;
  srcSet: { src: string; width: number }[];
}

export interface MediaImage {
  id: string;
  group: MediaGroup;
  kind: MediaKind;
  alt: string;
  caption: string;
  credit?: string;
  width: number;
  height: number;
  hasAlpha: boolean;
  /** Tiny inline WebP for the loading placeholder; null for transparent images. */
  blurDataURL: string | null;
  /** Ordered by preference (AVIF first). */
  sources: MediaSourceSet[];
  /** Largest WebP, used as the plain `<img src>`. */
  fallback: string;
}

export type MediaId = keyof typeof manifest.images;

const images = manifest.images as unknown as Record<MediaId, MediaImage>;

export function getMedia(id: MediaId): MediaImage {
  const image = images[id];
  if (!image) throw new Error(`Unknown media id: ${id}`);
  return image;
}

/** Images in a group, in `media-sources.json` order. */
export function getMediaByGroup(
  group: MediaGroup,
  kind?: MediaKind,
): MediaImage[] {
  return Object.values(images).filter(
    (image) =>
      image.group === group && (kind === undefined || image.kind === kind),
  );
}

export function toSrcSet(set: MediaSourceSet): string {
  return set.srcSet.map(({ src, width }) => `${src} ${width}w`).join(", ");
}
