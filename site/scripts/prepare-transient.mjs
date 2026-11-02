#!/usr/bin/env node
/**
 * Prepares Transient for the site (runs in predev and prebuild).
 *
 * 1. Copies the distributable zip to public/transient/ (the Download link).
 * 2. Extracts what the in-browser player (CheerpJ) needs into
 *    public/transient/game/: TRANSIENT.jar, lib/*.jar, and the shipped save.
 *    The game's levels, art and music are classpath resources inside the JAR,
 *    so the loose resources/ folder is not needed.
 * 3. Writes public/transient/game/patch.jar, which holds one patched class and
 *    goes first on the classpath, so it shadows the original.
 *
 * The patch: Audio/AudioPlayer.play(String, int) spins on
 *   while (!clip.isRunning()) clip.start();
 * Under CheerpJ the clip never reports running, so the first sound effect
 * hangs the tab. The patch turns the loop's backward `goto` into three `nop`s,
 * leaving a single clip.start() call.
 *
 * Idempotent: a stamp file records the source zip and this script's version,
 * and the work is skipped when it matches.
 *
 * Usage: node scripts/prepare-transient.mjs [--optional]
 *   --optional  warn instead of failing when the zip is missing (used by predev)
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import {
  copyFile,
  mkdir,
  open,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, inflateRawSync } from "node:zlib";

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
const ZIP_NAME = "TRANSIENT-DISTRIBUTABLE.zip";
const OUT_DIR = path.join(SITE_DIR, "public", "transient");
const GAME_DIR = path.join(OUT_DIR, "game");
/** Kept outside public/ so it never ships in the static export. */
const STAMP_FILE = path.join(
  SITE_DIR,
  "node_modules",
  ".cache",
  "prepare-transient",
  "stamp",
);

/** Entries copied verbatim from the zip into GAME_DIR. */
const GAME_FILES = [
  "TRANSIENT.jar",
  "lib/jl1.0.1.jar",
  "lib/mp3spi1.9.5.jar",
  "lib/tritonus_share.jar",
  "resources/Save/GameSaves/0",
];

const PATCH_CLASS = "Audio/AudioPlayer.class";
/** goto -15 (back to the isRunning() check), then return. */
const PATCH_NEEDLE = Buffer.from([0xa7, 0xff, 0xf1, 0xb1]);
/** Bump when the extraction or patch logic changes, to invalidate the stamp. */
const SCRIPT_VERSION = 1;

const optional = process.argv.includes("--optional");

// ---------------------------------------------------------------------------
// Minimal zip reader (store + deflate, no zip64): enough for this archive.

async function readZip(file) {
  const buf = await readFile(file);
  return { buf, entries: listEntries(buf) };
}

function listEntries(buf) {
  // End of central directory: signature 0x06054b50, within the last 64 KiB.
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

function readEntry({ buf, entries }, name) {
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

/** A zip with stored (uncompressed) entries. */
function writeStoredZip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of files) {
    const nameBuf = Buffer.from(name, "utf8");
    const crc = crc32(data);
    // Fixed DOS timestamp (1980-01-01) keeps the output deterministic.
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(10, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(0, 8); // stored
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0x21, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(10, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);
    offset += 30 + nameBuf.length + data.length;
  }
  const cd = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cd.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, eocd]);
}

// ---------------------------------------------------------------------------

/** Neutralize the busy-wait in AudioPlayer.play(String, int). */
export function patchAudioPlayer(classBytes) {
  const bytes = Buffer.from(classBytes);
  const first = bytes.indexOf(PATCH_NEEDLE);
  if (first < 0 || bytes.indexOf(PATCH_NEEDLE, first + 1) >= 0) {
    throw new Error(
      `${PATCH_CLASS}: expected the clip.start() loop exactly once`,
    );
  }
  // The goto must close the loop right after `aload_2; invokeinterface ...`
  // (Clip.start), i.e. the bytes the loop body ends with.
  if (bytes[first - 6] !== 0x2c || bytes[first - 5] !== 0xb9) {
    throw new Error(`${PATCH_CLASS}: unexpected bytecode before the loop`);
  }
  bytes.fill(0x00, first, first + 3); // goto -15 -> nop nop nop
  return bytes;
}

async function findZip() {
  for (const rel of ZIP_SOURCES) {
    const file = path.join(REPO_ROOT, rel);
    if (existsSync(file)) return file;
  }
  return null;
}

async function stampFor(zipFile) {
  const { size, mtimeMs } = await stat(zipFile);
  // Hash the head and tail rather than all 50 MB; with size + mtime that is
  // plenty to notice a replaced archive.
  const fh = await open(zipFile, "r");
  const head = Buffer.alloc(Math.min(size, 65_536));
  const tail = Buffer.alloc(Math.min(size, 65_536));
  await fh.read(head, 0, head.length, 0);
  await fh.read(tail, 0, tail.length, size - tail.length);
  await fh.close();
  const hash = createHash("sha256").update(head).update(tail).digest("hex");
  return JSON.stringify({ v: SCRIPT_VERSION, size, mtimeMs, hash });
}

async function upToDate(stamp) {
  const outputs = [
    path.join(OUT_DIR, ZIP_NAME),
    path.join(GAME_DIR, "patch.jar"),
    ...GAME_FILES.map((f) => path.join(GAME_DIR, f)),
  ];
  if (!outputs.every((f) => existsSync(f))) return false;
  try {
    return (await readFile(STAMP_FILE, "utf8")) === stamp;
  } catch {
    return false;
  }
}

async function main() {
  const zipFile = await findZip();
  if (!zipFile) {
    const msg = `prepare-transient: no zip found (looked in ${ZIP_SOURCES.join(", ")})`;
    if (optional) {
      console.warn(`${msg}; the Download and in-browser player will 404.`);
      return;
    }
    throw new Error(msg);
  }

  const stamp = await stampFor(zipFile);
  if (await upToDate(stamp)) {
    console.log("prepare-transient: up to date");
    return;
  }

  const started = Date.now();
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(GAME_DIR, { recursive: true });
  await copyFile(zipFile, path.join(OUT_DIR, ZIP_NAME));

  const zip = await readZip(zipFile);
  let jar = null;
  for (const name of GAME_FILES) {
    const data = readEntry(zip, name);
    if (name === "TRANSIENT.jar") jar = data;
    const out = path.join(GAME_DIR, name);
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, data);
  }

  const jarZip = { buf: jar, entries: listEntries(jar) };
  const patched = patchAudioPlayer(readEntry(jarZip, PATCH_CLASS));
  await writeFile(
    path.join(GAME_DIR, "patch.jar"),
    writeStoredZip([{ name: PATCH_CLASS, data: patched }]),
  );

  await mkdir(path.dirname(STAMP_FILE), { recursive: true });
  await writeFile(STAMP_FILE, stamp);
  console.log(
    `prepare-transient: extracted from ${path.relative(REPO_ROOT, zipFile)} in ${Date.now() - started} ms`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
