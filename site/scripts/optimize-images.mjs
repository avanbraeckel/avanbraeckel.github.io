#!/usr/bin/env node
/**
 * Media pipeline.
 *
 * Reads media-sources.json, encodes each source to AVIF + WebP at the
 * configured widths (never upscaling) into public/media/, and writes a
 * deterministic manifest to src/media/manifest.json.
 *
 * Output filenames embed a hash of the source bytes and encoder settings, so
 * a variant that already exists is up to date and is skipped. Files in
 * public/media/ that no longer belong to any entry are removed.
 */
import { createHash } from "node:crypto";
import {
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SITE_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REPO_ROOT = path.resolve(SITE_DIR, "..");
const SOURCES_FILE = path.join(SITE_DIR, "media-sources.json");
const OUT_DIR = path.join(SITE_DIR, "public", "media");
const MANIFEST_FILE = path.join(SITE_DIR, "src", "media", "manifest.json");
const PUBLIC_PREFIX = "/media/";

const WIDTHS = [640, 1280, 1920];
/** Portrait images skip widths whose height would exceed this. */
const MAX_HEIGHT = 1920;
const CONCURRENCY = 4;
const GROUPS = ["general", "ncr", "magnet-review", "magnet-axiom-cyber"];
const KINDS = ["photo", "logo", "portrait", "screenshot"];

/**
 * Encoder settings. Changing these changes every output hash.
 * WebP is the fallback for browsers without AVIF, so it stops at 1280px to
 * keep the total payload under budget; AVIF covers every width.
 */
const FORMATS = {
  avif: {
    mime: "image/avif",
    maxWidth: Infinity,
    options: { quality: 45, effort: 4 },
  },
  webp: {
    mime: "image/webp",
    maxWidth: 1280,
    options: { quality: 68, effort: 4 },
  },
};
const BLUR_WIDTH = 16;
const PIPELINE_VERSION = 1;

function fail(message) {
  throw new Error(`[optimize-images] ${message}`);
}

function validate(entries) {
  if (!Array.isArray(entries)) fail("media-sources.json must be an array");
  const seen = new Set();
  for (const [i, e] of entries.entries()) {
    const where = `entry ${i} (${e?.id ?? "no id"})`;
    if (typeof e?.id !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id)) {
      fail(`${where}: id must be kebab-case`);
    }
    if (seen.has(e.id)) fail(`${where}: duplicate id`);
    seen.add(e.id);
    if (typeof e.src !== "string" || !e.src) fail(`${where}: src is required`);
    if (typeof e.alt !== "string")
      fail(`${where}: alt is required (use "" for decorative)`);
    if (typeof e.caption !== "string") fail(`${where}: caption is required`);
    if (!GROUPS.includes(e.group))
      fail(`${where}: group must be one of ${GROUPS.join(", ")}`);
    if (!KINDS.includes(e.kind))
      fail(`${where}: kind must be one of ${KINDS.join(", ")}`);
    if (e.credit !== undefined && typeof e.credit !== "string")
      fail(`${where}: credit must be a string`);
  }
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

/**
 * Target widths: configured widths that neither upscale nor exceed MAX_HEIGHT.
 * Falls back to the smallest that does not upscale, or the intrinsic width.
 */
function targetWidths(sourceWidth, sourceHeight) {
  const noUpscale = WIDTHS.filter((w) => w <= sourceWidth);
  if (noUpscale.length === 0) return [sourceWidth];
  const fitting = noUpscale.filter(
    (w) => (w * sourceHeight) / sourceWidth <= MAX_HEIGHT,
  );
  return fitting.length > 0 ? fitting : [noUpscale[0]];
}

async function processEntry(entry, written) {
  const srcPath = path.resolve(REPO_ROOT, entry.src);
  const input = await readFile(srcPath).catch(() =>
    fail(`${entry.id}: cannot read ${entry.src}`),
  );

  // Apply EXIF orientation once; all later work uses the upright pixels.
  const meta = await sharp(input).metadata();
  const swap = (meta.orientation ?? 1) >= 5;
  const width = swap ? meta.height : meta.width;
  const height = swap ? meta.width : meta.height;
  const hasAlpha =
    Boolean(meta.hasAlpha) && !(await sharp(input).stats()).isOpaque;

  const hash = createHash("sha256")
    .update(input)
    .update(JSON.stringify({ PIPELINE_VERSION, FORMATS, WIDTHS, MAX_HEIGHT }))
    .digest("hex")
    .slice(0, 10);

  const widths = targetWidths(width, height);
  const sources = {};
  let encoded = 0;
  for (const [ext, { mime, maxWidth, options }] of Object.entries(FORMATS)) {
    sources[ext] = { type: mime, srcSet: [] };
    const formatWidths = widths.filter((w) => w <= maxWidth);
    for (const w of formatWidths.length > 0 ? formatWidths : [widths[0]]) {
      const name = `${entry.id}-${w}.${hash}.${ext}`;
      const out = path.join(OUT_DIR, name);
      written.add(name);
      if (!(await exists(out))) {
        await sharp(input)
          .rotate()
          .resize({ width: w, withoutEnlargement: true })
          [ext](options)
          .toFile(out);
        encoded++;
      }
      sources[ext].srcSet.push({ src: PUBLIC_PREFIX + name, width: w });
    }
  }

  // Transparent images (logos) get no placeholder; it would show through.
  let blurDataURL = null;
  if (!hasAlpha) {
    const blur = await sharp(input)
      .rotate()
      .resize({ width: BLUR_WIDTH })
      .webp({ quality: 40 })
      .toBuffer();
    blurDataURL = `data:image/webp;base64,${blur.toString("base64")}`;
  }

  const largest = widths[widths.length - 1];
  const record = {
    id: entry.id,
    group: entry.group,
    kind: entry.kind,
    alt: entry.alt,
    caption: entry.caption,
    ...(entry.credit ? { credit: entry.credit } : {}),
    width: largest,
    height: Math.round((height * largest) / width),
    hasAlpha,
    blurDataURL,
    sources: [sources.avif, sources.webp],
    fallback: sources.webp.srcSet[sources.webp.srcSet.length - 1].src,
  };
  return { record, encoded };
}

async function main() {
  const started = Date.now();
  const entries = JSON.parse(await readFile(SOURCES_FILE, "utf8"));
  validate(entries);
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(path.dirname(MANIFEST_FILE), { recursive: true });

  const written = new Set();
  const results = new Array(entries.length);
  let next = 0;
  const worker = async () => {
    while (next < entries.length) {
      const i = next++;
      results[i] = await processEntry(entries[i], written);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // Manifest order follows media-sources.json, independent of completion order.
  const images = {};
  let encoded = 0;
  for (const { record, encoded: n } of results) {
    images[record.id] = record;
    encoded += n;
  }

  let removed = 0;
  for (const name of await readdir(OUT_DIR)) {
    if (!written.has(name)) {
      await rm(path.join(OUT_DIR, name), { recursive: true, force: true });
      removed++;
    }
  }

  const manifest = `${JSON.stringify({ version: PIPELINE_VERSION, images }, null, 2)}\n`;
  const previous = await readFile(MANIFEST_FILE, "utf8").catch(() => null);
  if (previous !== manifest) await writeFile(MANIFEST_FILE, manifest);

  let bytes = 0;
  for (const name of written)
    bytes += (await stat(path.join(OUT_DIR, name))).size;
  console.log(
    `[optimize-images] ${entries.length} images, ${written.size} files ` +
      `(${encoded} encoded, ${written.size - encoded} up to date, ${removed} removed), ` +
      `${(bytes / 1024 / 1024).toFixed(2)} MB in ${((Date.now() - started) / 1000).toFixed(1)}s`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
