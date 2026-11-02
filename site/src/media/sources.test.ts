import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SITE_DIR = path.resolve(__dirname, "..", "..");
const REPO_ROOT = path.resolve(SITE_DIR, "..");

const sources: { id: string; src: string }[] = JSON.parse(
  readFileSync(path.join(SITE_DIR, "media-sources.json"), "utf8"),
);

describe("media-sources.json", () => {
  it("only references existing files under archive/ or site/media-src/", () => {
    for (const { id, src } of sources) {
      expect(src, id).toMatch(/^(archive|site\/media-src)\//);
      expect(src, id).not.toMatch(/^(images|assets|react-app)\//);
      expect(existsSync(path.join(REPO_ROOT, src)), `${id}: ${src}`).toBe(true);
    }
  });
});

describe("build scripts", () => {
  it("do not reference the legacy root folders outside the documented fallback", () => {
    const dir = path.join(SITE_DIR, "scripts");
    const legacy = /["'`/](images|assets|react-app)\//;
    for (const file of readdirSync(dir).filter((f) => /\.m?js$/.test(f))) {
      const lines = readFileSync(path.join(dir, file), "utf8").split("\n");
      lines.forEach((line, i) => {
        if (line.includes("legacy-fallback")) return;
        expect(legacy.test(line), `${file}:${i + 1}: ${line.trim()}`).toBe(
          false,
        );
      });
    }
  });
});
