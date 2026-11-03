#!/usr/bin/env node
/**
 * Capture screenshots of every route of the static export.
 *
 * Usage:
 *   npm run screenshot                               # serve out/ locally, discover routes
 *   npm run screenshot -- --base-url http://localhost:3000
 *   npm run screenshot -- --routes /,/projects/transient/
 *   npm run screenshot -- http://localhost:3000 / /projects/
 *   npm run screenshot -- --stitch                   # per-viewport tiles, stitched
 *   npm run screenshot -- --routes /about/ --selector "section[aria-labelledby=music]"
 *   npm run screenshot -- --viewport mobile --scheme dark
 *
 * --selector captures just that element (scrolled into view) instead of the
 * page. --viewport (desktop|mobile) and --scheme (light|dark) narrow the
 * matrix; when either is given, the reduced-motion pass runs only with
 * --reduced-motion. This script serves out/ itself (with HTTP Range), so there
 * is no need to start a server by hand.
 *
 * Before capturing, each page is scrolled through one viewport at a time so
 * lazy images load and decode and scroll-triggered reveals run, then it
 * returns to the top. A plain full-page capture renders fixed elements (the
 * living background, the nav) only once, at the top. --stitch instead
 * captures one viewport per scroll step and stitches them, so fixed layers
 * appear the way a reader sees them at each position.
 *
 * Output: .screenshots/<route>__<viewport>__<scheme>[__reduced-motion][__<selector>].png
 * Only the captured routes' files are overwritten; other files in
 * .screenshots/ (other routes, ad-hoc captures) are left alone.
 */
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const OUT_DIR = path.join(SITE_DIR, "out");
const SHOTS_DIR = path.join(SITE_DIR, ".screenshots");
const CHROMIUM_LIBS =
  "/home/avanbraeckel/.local/chromium-libs/root/usr/lib/x86_64-linux-gnu";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const SCHEMES = ["light", "dark"];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".pdf": "application/pdf",
  ".wasm": "application/wasm",
  ".jar": "application/java-archive",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

function parseArgs(argv) {
  let baseUrl = process.env.SCREENSHOT_BASE_URL || null;
  let stitch = false;
  let selector = null;
  let viewport = null;
  let scheme = null;
  let reducedMotion = false;
  let routes = process.env.SCREENSHOT_ROUTES
    ? process.env.SCREENSHOT_ROUTES.split(",")
    : null;
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--base-url" || arg === "--url") baseUrl = argv[++i];
    else if (arg.startsWith("--base-url="))
      baseUrl = arg.split("=").slice(1).join("=");
    else if (arg === "--stitch") stitch = true;
    else if (arg === "--selector") selector = argv[++i];
    else if (arg === "--viewport") viewport = argv[++i];
    else if (arg === "--scheme") scheme = argv[++i];
    else if (arg === "--reduced-motion") reducedMotion = true;
    else if (arg === "--routes") routes = argv[++i].split(",");
    else if (arg.startsWith("--routes="))
      routes = arg.slice("--routes=".length).split(",");
    else positional.push(arg);
  }
  for (const p of positional) {
    if (/^https?:\/\//.test(p)) baseUrl = p;
    else (routes ??= []).push(...p.split(","));
  }
  if (viewport && !VIEWPORTS.some((v) => v.name === viewport)) {
    throw new Error(
      `--viewport must be one of: ${VIEWPORTS.map((v) => v.name).join(", ")}`,
    );
  }
  if (scheme && !SCHEMES.includes(scheme)) {
    throw new Error(`--scheme must be one of: ${SCHEMES.join(", ")}`);
  }
  return {
    baseUrl,
    stitch,
    selector,
    viewport,
    scheme,
    reducedMotion,
    routes: routes?.map((r) => r.trim()).filter(Boolean) ?? null,
  };
}

/** Routes are the directories under out/ that contain an index.html. */
function discoverRoutes(dir, prefix = "/") {
  const routes = [];
  if (existsSync(path.join(dir, "index.html"))) routes.push(prefix);
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (
      !entry.isDirectory() ||
      entry.name.startsWith("_") ||
      entry.name.startsWith(".")
    ) {
      continue;
    }
    routes.push(
      ...discoverRoutes(path.join(dir, entry.name), `${prefix}${entry.name}/`),
    );
  }
  return routes;
}

/** Minimal static server that mirrors GitHub Pages' resolution for a trailingSlash export. */
function serveOut() {
  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = path.join(OUT_DIR, urlPath);
    if (!file.startsWith(OUT_DIR)) {
      res.writeHead(403).end();
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory())
      file = path.join(file, "index.html");
    else if (!existsSync(file) && existsSync(`${file}.html`))
      file = `${file}.html`;

    let status = 200;
    if (!existsSync(file)) {
      status = 404;
      file = path.join(OUT_DIR, "404.html");
      if (!existsSync(file)) {
        res.writeHead(404).end("Not found");
        return;
      }
    }
    res.writeHead(status, {
      "Content-Type":
        MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream",
    });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

/**
 * Scroll through the page one viewport at a time, waiting at each step for
 * images in view to load and decode, then return to the top.
 */
async function scrollThrough(page) {
  await page.evaluate(async () => {
    const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
    const settle = (ms) => new Promise((r) => setTimeout(r, ms));
    const decodeVisible = async () => {
      const pending = Array.from(document.images)
        .filter((img) => {
          const box = img.getBoundingClientRect();
          return box.bottom > -innerHeight && box.top < innerHeight * 2;
        })
        .map((img) =>
          img.complete
            ? img.decode().catch(() => {})
            : new Promise((r) => {
                img.addEventListener("load", r, { once: true });
                img.addEventListener("error", r, { once: true });
              }).then(() => img.decode().catch(() => {})),
        );
      await Promise.race([Promise.all(pending), settle(5000)]);
    };
    const root = document.scrollingElement ?? document.documentElement;
    for (let y = 0; ; y += innerHeight) {
      root.scrollTo({ top: y, behavior: "instant" });
      await frame();
      await decodeVisible();
      await settle(150);
      if (y + innerHeight >= root.scrollHeight) break;
    }
    root.scrollTo({ top: 0, behavior: "instant" });
    await frame();
  });
  // Let reveal springs triggered on the way down finish.
  await page.waitForTimeout(800);
}

/** One viewport-sized capture per scroll step, stitched top to bottom. */
async function stitchedScreenshot(page, file, viewport) {
  const sharp = (await import("sharp")).default;
  const total = await page.evaluate(
    () => (document.scrollingElement ?? document.documentElement).scrollHeight,
  );
  const tiles = [];
  for (let y = 0; y < total; y += viewport.height) {
    const top = Math.min(y, Math.max(0, total - viewport.height));
    await page.evaluate((t) => {
      (document.scrollingElement ?? document.documentElement).scrollTo({
        top: t,
        behavior: "instant",
      });
    }, top);
    await page.waitForTimeout(250);
    tiles.push({ input: await page.screenshot(), top, left: 0 });
  }
  await sharp({
    create: {
      width: viewport.width,
      height: total,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(tiles)
    .png()
    .toFile(file);
  await page.evaluate(() =>
    (document.scrollingElement ?? document.documentElement).scrollTo({
      top: 0,
      behavior: "instant",
    }),
  );
}

function slug(route) {
  const trimmed = route.replace(/^\/+|\/+$/g, "");
  return trimmed ? trimmed.replace(/[^a-zA-Z0-9-]+/g, "_") : "home";
}

async function main() {
  // Chromium's missing system libraries are extracted locally on the dev machine.
  if (existsSync(CHROMIUM_LIBS)) {
    const current = process.env.LD_LIBRARY_PATH;
    if (!current?.split(":").includes(CHROMIUM_LIBS)) {
      process.env.LD_LIBRARY_PATH = current
        ? `${CHROMIUM_LIBS}:${current}`
        : CHROMIUM_LIBS;
    }
  }
  const { chromium } = await import("playwright");

  const args = parseArgs(process.argv.slice(2));
  let { baseUrl, routes } = args;
  const { stitch, selector } = args;
  const filtered = Boolean(args.viewport || args.scheme);
  let server = null;

  if (!baseUrl || !routes) {
    if (!existsSync(OUT_DIR)) {
      console.error(
        `No ${path.relative(process.cwd(), OUT_DIR) || "out"}/ directory. Run \`npm run build\` first, or pass --base-url and --routes.`,
      );
      process.exit(1);
    }
  }
  if (!routes) routes = discoverRoutes(OUT_DIR).sort();
  if (!baseUrl) {
    ({ server, baseUrl } = await serveOut());
  }
  baseUrl = baseUrl.replace(/\/+$/, "");

  mkdirSync(SHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });

  const viewports = VIEWPORTS.filter(
    (v) => !args.viewport || v.name === args.viewport,
  );
  const schemes = SCHEMES.filter((s) => !args.scheme || s === args.scheme);
  const passes = [];
  for (const viewport of viewports) {
    for (const colorScheme of schemes) {
      passes.push({ viewport, colorScheme, reducedMotion: "no-preference" });
    }
  }
  if (!filtered || args.reducedMotion) {
    passes.push({
      viewport: viewports[0],
      colorScheme: schemes[0],
      reducedMotion: "reduce",
    });
  }

  let count = 0;
  let failures = 0;
  try {
    for (const { viewport, colorScheme, reducedMotion } of passes) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        colorScheme,
        reducedMotion,
      });
      const page = await context.newPage();
      for (const route of routes) {
        const url = `${baseUrl}${route.startsWith("/") ? route : `/${route}`}`;
        const suffix =
          (reducedMotion === "reduce" ? "__reduced-motion" : "") +
          (selector ? `__${slug(selector)}` : "");
        const file = path.join(
          SHOTS_DIR,
          `${slug(route)}__${viewport.name}__${colorScheme}${suffix}.png`,
        );
        try {
          const response = await page.goto(url, { waitUntil: "networkidle" });
          if (response && !response.ok() && slug(route) !== "404") {
            console.warn(`  ${response.status()} ${url}`);
          }
          await page.evaluate(() => document.fonts?.ready);
          await scrollThrough(page);
          if (selector) {
            const element = page.locator(selector).first();
            await element.scrollIntoViewIfNeeded();
            // Let reveals and lazy images settle after the scroll.
            await page.waitForTimeout(600);
            await element.screenshot({ path: file });
          } else if (stitch) await stitchedScreenshot(page, file, viewport);
          else await page.screenshot({ path: file, fullPage: true });
          count++;
          console.log(`  ${path.relative(SITE_DIR, file)}`);
        } catch (error) {
          failures++;
          console.error(`  FAILED ${url}: ${error.message}`);
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
    server?.close();
  }

  console.log(
    `Wrote ${count} screenshot(s) to ${path.relative(process.cwd(), SHOTS_DIR) || SHOTS_DIR}/`,
  );
  if (failures > 0 || count === 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
