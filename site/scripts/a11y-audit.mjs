#!/usr/bin/env node
/**
 * Real-browser accessibility audit (axe-core) of every route of the static export.
 *
 * Usage:
 *   npm run a11y                                   # serve out/ locally, discover routes
 *   npm run a11y -- --base-url http://localhost:4202
 *   npm run a11y -- --routes /,/about/
 *
 * Matrix: {desktop 1440x900, mobile 390x844} x {light, dark}, plus one
 * forced-colors smoke pass (desktop, light). The mobile passes also audit the
 * open nav sheet. Each page is scrolled through first so lazy and reveal
 * content renders, then checked against WCAG 2.0-2.2 A/AA rules.
 *
 * Violations fail the run (exit 1). `incomplete` results (axe could not decide,
 * e.g. text over the animated canvas) are listed as "needs review" and do not.
 * Text over the canvas is verified analytically in
 * src/background/contrast.test.ts.
 *
 * Output: console summary and .a11y/report.json.
 */
import AxeBuilder from "@axe-core/playwright";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const OUT_DIR = path.join(SITE_DIR, "out");
const REPORT_DIR = path.join(SITE_DIR, ".a11y");
const CHROMIUM_LIBS =
  "/home/avanbraeckel/.local/chromium-libs/root/usr/lib/x86_64-linux-gnu";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const SCHEMES = ["light", "dark"];
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

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
  let baseUrl = process.env.A11Y_BASE_URL || null;
  let routes = process.env.A11Y_ROUTES
    ? process.env.A11Y_ROUTES.split(",")
    : null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--base-url" || arg === "--url") baseUrl = argv[++i];
    else if (arg.startsWith("--base-url="))
      baseUrl = arg.slice("--base-url=".length);
    else if (arg === "--routes") routes = argv[++i].split(",");
    else if (arg.startsWith("--routes="))
      routes = arg.slice("--routes=".length).split(",");
    else if (/^https?:\/\//.test(arg)) baseUrl = arg;
    else (routes ??= []).push(...arg.split(","));
  }
  return {
    baseUrl,
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

/**
 * Minimal static server that mirrors GitHub Pages' resolution for a
 * trailingSlash export. Supports single-range requests.
 */
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
    const size = statSync(file).size;
    const headers = {
      "Content-Type":
        MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream",
      "Accept-Ranges": "bytes",
    };
    const range =
      status === 200 && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
    if (range) {
      const start = range[1]
        ? Number(range[1])
        : Math.max(0, size - Number(range[2]));
      const end =
        range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
      if (start > end || start >= size) {
        res.writeHead(416, { "Content-Range": `bytes */${size}` }).end();
        return;
      }
      res.writeHead(206, {
        ...headers,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": end - start + 1,
      });
      createReadStream(file, { start, end }).pipe(res);
      return;
    }
    res.writeHead(status, { ...headers, "Content-Length": size });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

/** Scroll one viewport at a time so lazy images and reveals render, then return to the top. */
async function scrollThrough(page) {
  await page.evaluate(async () => {
    const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
    const settle = (ms) => new Promise((r) => setTimeout(r, ms));
    const root = document.scrollingElement ?? document.documentElement;
    for (let y = 0; ; y += innerHeight) {
      root.scrollTo({ top: y, behavior: "instant" });
      await frame();
      await settle(150);
      if (y + innerHeight >= root.scrollHeight) break;
    }
    root.scrollTo({ top: 0, behavior: "instant" });
    await frame();
  });
  await Promise.all(
    (await page.$$("img")).map((img) =>
      img.evaluate((el) => el.decode().catch(() => {})),
    ),
  );
  // Let reveal springs triggered on the way down finish.
  await page.waitForTimeout(800);
}

const summarize = (node) => ({
  target: node.target.join(" "),
  html: node.html.length > 160 ? `${node.html.slice(0, 160)}...` : node.html,
  summary: (node.failureSummary ?? "").replace(/\s+/g, " ").trim(),
  // Why axe could not decide, for "needs review" items (e.g. bgOverlap).
  reason: [...node.any, ...node.all, ...node.none]
    .map((check) => check.data?.messageKey ?? check.message)
    .filter(Boolean)
    .join("; "),
});

const toEntries = (results) => ({
  violations: results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map(summarize),
  })),
  review: results.incomplete.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map(summarize),
  })),
});

async function analyze(page) {
  return toEntries(await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze());
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

  let { baseUrl, routes } = parseArgs(process.argv.slice(2));
  let server = null;
  if (!baseUrl || !routes) {
    if (!existsSync(OUT_DIR)) {
      console.error(
        "No out/ directory. Run `npm run build` first, or pass --base-url and --routes.",
      );
      process.exit(1);
    }
  }
  if (!routes) routes = discoverRoutes(OUT_DIR).sort();
  if (!baseUrl) ({ server, baseUrl } = await serveOut());
  baseUrl = baseUrl.replace(/\/+$/, "");

  const passes = [];
  for (const viewport of VIEWPORTS)
    for (const colorScheme of SCHEMES)
      passes.push({ viewport, colorScheme, forcedColors: "none" });
  passes.push({
    viewport: VIEWPORTS[0],
    colorScheme: "light",
    forcedColors: "active",
  });

  const browser = await chromium.launch({
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });

  const cells = [];
  try {
    for (const { viewport, colorScheme, forcedColors } of passes) {
      const matrix = `${viewport.name}/${colorScheme}${forcedColors === "active" ? "/forced-colors" : ""}`;
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        colorScheme,
        forcedColors,
      });
      const page = await context.newPage();
      for (const route of routes) {
        const url = `${baseUrl}${route.startsWith("/") ? route : `/${route}`}`;
        try {
          await page.goto(url, { waitUntil: "networkidle" });
          await page.evaluate(() => document.fonts?.ready);
          await scrollThrough(page);
          const entry = {
            route,
            matrix,
            state: "page",
            ...(await analyze(page)),
          };
          cells.push(entry);
          report(entry);

          // The mobile nav sheet only exists once opened.
          if (viewport.name === "mobile" && route === routes[0]) {
            const menu = page.getByRole("button", { name: "Menu" });
            if (await menu.count()) {
              await menu.click();
              await page.getByRole("dialog").waitFor();
              await page.waitForTimeout(800);
              const sheet = {
                route,
                matrix,
                state: "nav sheet",
                ...(await analyze(page)),
              };
              cells.push(sheet);
              report(sheet);
            }
          }
        } catch (error) {
          const entry = {
            route,
            matrix,
            state: "page",
            violations: [
              {
                id: "audit-error",
                impact: "critical",
                help: error.message,
                nodes: [],
              },
            ],
            review: [],
          };
          cells.push(entry);
          report(entry);
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
    server?.close();
  }

  const violations = cells.flatMap((c) => c.violations.map((v) => ({ c, v })));
  const review = new Map();
  for (const { route, matrix, review: items } of cells) {
    for (const item of items) {
      for (const node of item.nodes) {
        const key = `${item.id} | ${node.target}`;
        const prev = review.get(key) ?? { id: item.id, node, cells: [] };
        prev.cells.push(`${route} ${matrix}`);
        review.set(key, prev);
      }
    }
  }

  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(
    path.join(REPORT_DIR, "report.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl,
        routes,
        violationCount: violations.length,
        cells,
      },
      null,
      2,
    ),
  );

  console.log(
    `\n${cells.length} cell(s) audited across ${routes.length} route(s).`,
  );
  if (review.size > 0) {
    console.log(`\nNeeds review (${review.size} unique, not failing):`);
    for (const { id, node, cells: where } of review.values()) {
      console.log(
        `  [${id}] ${node.target}${node.reason ? ` - ${node.reason}` : ""} (${where.length} cell(s), e.g. ${where[0]})`,
      );
    }
  }
  console.log(
    violations.length === 0
      ? "\n0 violations."
      : `\n${violations.length} violation(s). Report: .a11y/report.json`,
  );
  if (violations.length > 0) process.exit(1);
}

function report({ route, matrix, state, violations }) {
  const label = `${route} [${matrix}${state === "page" ? "" : `, ${state}`}]`;
  if (violations.length === 0) {
    console.log(`  ok   ${label}`);
    return;
  }
  console.log(`  FAIL ${label}`);
  for (const v of violations) {
    console.log(`    ${v.id} (${v.impact}): ${v.help}`);
    for (const node of v.nodes) {
      console.log(`      ${node.target}`);
      if (node.summary) console.log(`        ${node.summary.slice(0, 240)}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
