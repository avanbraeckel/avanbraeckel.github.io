#!/usr/bin/env node
/**
 * Extracts a few pixel-art sprite strips from Transient (the owner's 2019
 * game) for use as accents on the site. Run manually with `npm run sprites`;
 * the output is committed, so builds do not need the game archive.
 *
 * Reads TRANSIENT.jar out of the distributable zip, pulls the chosen sheets
 * out of the jar, crops each animation to a single horizontal strip of
 * equal-sized frames at the original pixel size, and writes:
 *
 *   src/sprites/<name>.png    one strip per animation
 *   src/sprites/sprites.json  frame size, frame count and strip size per strip
 *
 * Frames in one `cell` group share a crop box (the union of their opaque
 * pixels), so switching between, say, idle and run never shifts the
 * character. Scaling happens in CSS (`image-rendering: pixelated`).
 *
 * Usage: node scripts/extract-sprites.mjs
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";
import sharp from "sharp";

const SITE_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const REPO_ROOT = path.resolve(SITE_DIR, "..");
/** Where to find the distributable, in order of preference. */
const ZIP_SOURCES = [
  "archive/transient/TRANSIENT-DISTRIBUTABLE.zip",
  "assets/TRANSIENT-DISTRIBUTABLE.zip", // legacy-fallback: remove with the legacy folders
];
const OUT_DIR = path.join(SITE_DIR, "src", "sprites");

const PLAYER_SHEET = "Sprites/Player/AdventurerAVBFinal.png";

/**
 * Each strip: a source sheet inside the jar, the source frame size, the row,
 * and how many frames (left to right) the animation has.
 */
const STRIPS = [
  // The player character (50x37 cells in a 20x13 grid).
  {
    name: "player-idle",
    sheet: PLAYER_SHEET,
    frame: [50, 37],
    row: 0,
    frames: 4,
    cell: "player",
  },
  {
    name: "player-run",
    sheet: PLAYER_SHEET,
    frame: [50, 37],
    row: 2,
    frames: 6,
    cell: "player",
  },
  {
    name: "player-jump",
    sheet: PLAYER_SHEET,
    frame: [50, 37],
    row: 3,
    frames: 8,
    cell: "player",
  },
  // Enemies.
  {
    name: "slime",
    sheet: "Sprites/Enemies/slime-Sheet.png",
    frame: [32, 25],
    row: 0,
    frames: 8,
  },
  {
    name: "spider",
    sheet: "Sprites/Enemies/spider-Sheet.png",
    frame: [32, 32],
    row: 0,
    frames: 3,
  },
  // Collectible and the level-exit portal.
  {
    name: "gem",
    sheet: "Sprites/Gem.png",
    frame: [12, 12],
    row: 0,
    frames: 10,
  },
  {
    name: "portal",
    sheet: "Sprites/Portal.png",
    frame: [32, 32],
    row: 0,
    frames: 5,
  },
];

// ---------------------------------------------------------------------------
// Minimal zip reader (store + deflate, no zip64), as in prepare-transient.mjs.

function listEntries(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a zip file (no end of central directory)");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) {
      throw new Error("Corrupt zip central directory");
    }
    const method = buf.readUInt16LE(p + 10);
    const compressedSize = buf.readUInt32LE(p + 20);
    const size = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    entries.set(name, { method, compressedSize, size, localOffset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function readEntry(buf, entries, name) {
  const entry = entries.get(name);
  if (!entry) throw new Error(`Missing ${name} in archive`);
  const p = entry.localOffset;
  if (buf.readUInt32LE(p) !== 0x04034b50) {
    throw new Error(`Corrupt local header for ${name}`);
  }
  const start = p + 30 + buf.readUInt16LE(p + 26) + buf.readUInt16LE(p + 28);
  const raw = buf.subarray(start, start + entry.compressedSize);
  let data;
  if (entry.method === 0) data = raw;
  else if (entry.method === 8) data = inflateRawSync(raw);
  else throw new Error(`Unsupported compression ${entry.method} for ${name}`);
  if (data.length !== entry.size) throw new Error(`Size mismatch for ${name}`);
  return data;
}

// ---------------------------------------------------------------------------

/** Decoded RGBA pixels for a sheet. */
async function decode(png) {
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/** Bounding box of opaque pixels in one frame, or null if it is empty. */
function frameBounds(img, strip, index) {
  const [fw, fh] = strip.frame;
  const ox = index * fw;
  const oy = strip.row * fh;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < fh; y++) {
    for (let x = 0; x < fw; x++) {
      if (img.data[((oy + y) * img.width + ox + x) * 4 + 3] === 0) continue;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

function union(a, b) {
  if (!a) return b;
  if (!b) return a;
  return {
    x0: Math.min(a.x0, b.x0),
    y0: Math.min(a.y0, b.y0),
    x1: Math.max(a.x1, b.x1),
    y1: Math.max(a.y1, b.y1),
  };
}

async function main() {
  const zipRel = ZIP_SOURCES.find((rel) =>
    existsSync(path.join(REPO_ROOT, rel)),
  );
  if (!zipRel) {
    throw new Error(
      `Transient distributable not found (looked in ${ZIP_SOURCES.join(", ")})`,
    );
  }
  const zip = await readFile(path.join(REPO_ROOT, zipRel));
  const jar = readEntry(zip, listEntries(zip), "TRANSIENT.jar");
  const jarEntries = listEntries(jar);

  const sheets = new Map();
  for (const { sheet } of STRIPS) {
    if (!sheets.has(sheet)) {
      sheets.set(sheet, await decode(readEntry(jar, jarEntries, sheet)));
    }
  }

  // Crop box per strip; strips in the same cell group share one.
  const boxes = new Map();
  for (const strip of STRIPS) {
    const img = sheets.get(strip.sheet);
    let box = null;
    for (let i = 0; i < strip.frames; i++) {
      const b = frameBounds(img, strip, i);
      if (!b) throw new Error(`${strip.name}: frame ${i} is empty`);
      box = union(box, b);
    }
    const key = strip.cell ?? strip.name;
    boxes.set(key, union(boxes.get(key), box));
  }

  await mkdir(OUT_DIR, { recursive: true });
  const manifest = {};
  let total = 0;
  for (const strip of STRIPS) {
    const img = sheets.get(strip.sheet);
    const box = boxes.get(strip.cell ?? strip.name);
    const w = box.x1 - box.x0 + 1;
    const h = box.y1 - box.y0 + 1;
    const out = Buffer.alloc(w * strip.frames * h * 4);
    for (let i = 0; i < strip.frames; i++) {
      const sx = i * strip.frame[0] + box.x0;
      const sy = strip.row * strip.frame[1] + box.y0;
      for (let y = 0; y < h; y++) {
        const src = ((sy + y) * img.width + sx) * 4;
        const dst = (y * w * strip.frames + i * w) * 4;
        img.data.copy(out, dst, src, src + w * 4);
      }
    }
    const png = await sharp(out, {
      raw: { width: w * strip.frames, height: h, channels: 4 },
    })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer();
    await writeFile(path.join(OUT_DIR, `${strip.name}.png`), png);
    total += png.length;
    manifest[strip.name] = {
      frameWidth: w,
      frameHeight: h,
      frames: strip.frames,
    };
    console.log(
      `${strip.name}.png: ${strip.frames} x ${w}x${h} (${png.length} bytes)`,
    );
  }
  await writeFile(
    path.join(OUT_DIR, "sprites.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(`Wrote ${STRIPS.length} strips (${total} bytes) to src/sprites/`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
