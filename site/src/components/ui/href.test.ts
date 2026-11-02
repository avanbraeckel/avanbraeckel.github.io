import { describe, expect, it } from "vitest";
import { isExternalHref, resolveHref } from "./href";

describe("isExternalHref", () => {
  it.each([
    ["https://github.com", true],
    ["http://example.com", true],
    ["//cdn.example.com/x.js", true],
    ["mailto:me@example.com", true],
    ["/projects/", false],
    ["#main", false],
    ["resume.pdf", false],
  ])("%s → %s", (href, expected) => {
    expect(isExternalHref(href)).toBe(expected);
  });
});

describe("resolveHref", () => {
  it("routes in-app paths through next/link", () => {
    expect(resolveHref("/projects/")).toEqual({
      kind: "route",
      external: false,
      newTab: false,
    });
  });

  it("opens other websites in a new tab", () => {
    expect(resolveHref("https://github.com/x")).toEqual({
      kind: "anchor",
      external: true,
      newTab: true,
    });
  });

  it("keeps mailto in the same tab", () => {
    expect(resolveHref("mailto:a@b.c").newTab).toBe(false);
  });

  it("renders static files, hashes, downloads, and forced new tabs as anchors", () => {
    expect(resolveHref("/resume.pdf").kind).toBe("anchor");
    expect(resolveHref("/files/game.zip?v=2").kind).toBe("anchor");
    expect(resolveHref("#main").kind).toBe("anchor");
    expect(resolveHref("/projects/", { download: true }).kind).toBe("anchor");
    expect(resolveHref("/projects/", { newTab: true })).toMatchObject({
      kind: "anchor",
      newTab: true,
    });
  });

  it("lets callers suppress the new tab for external links", () => {
    expect(resolveHref("https://x.dev", { newTab: false }).newTab).toBe(false);
  });
});
