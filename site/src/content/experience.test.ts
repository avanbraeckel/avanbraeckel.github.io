import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseMonth } from "@/components/experience/format";
import { getMedia } from "@/media";
import {
  caseStudyEntries,
  experience,
  getExperience,
  sortedExperience,
} from "./experience";

const CASE_STUDY_DIR = path.resolve(__dirname, "case-studies");

describe("experience data", () => {
  it("has unique slugs", () => {
    const slugs = experience.map((entry) => entry.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(experience.map((entry) => [entry.slug, entry] as const))(
    "%s has valid dates",
    (_slug, entry) => {
      // Past work needs a start date; the current role and education may
      // leave it unpublished.
      if (entry.kind === "work" && !entry.current) {
        expect(parseMonth(entry.start)).not.toBeNull();
      }
      if (entry.start !== null) {
        expect(parseMonth(entry.start)).not.toBeNull();
      }
      if (entry.current) expect(entry.end).toBeNull();
      if (entry.end !== null) {
        expect(parseMonth(entry.end)).not.toBeNull();
        expect(entry.end >= (entry.start ?? "")).toBe(true);
      }
    },
  );

  it("has exactly one current role", () => {
    expect(
      experience.filter((entry) => entry.current).map((entry) => entry.slug),
    ).toEqual(["magnet-nexus"]);
  });

  it.each(experience.map((entry) => [entry.slug, entry] as const))(
    "%s references media that exists in the manifest",
    (_slug, entry) => {
      for (const id of [entry.cover, entry.logo]) {
        if (id) expect(() => getMedia(id)).not.toThrow();
      }
    },
  );

  it("gives every work entry a summary and a stack", () => {
    for (const entry of experience.filter((e) => e.kind === "work")) {
      expect(entry.summary.length).toBeGreaterThan(40);
      expect(entry.stack.length).toBeGreaterThan(0);
    }
  });

  it("gives every past work entry a case study", () => {
    for (const entry of experience.filter(
      (e) => e.kind === "work" && !e.current,
    )) {
      expect(entry.href).toBe(`/experience/${entry.slug}/`);
      expect(existsSync(path.join(CASE_STUDY_DIR, `${entry.slug}.mdx`))).toBe(
        true,
      );
    }
  });

  it("includes the University of Guelph education entry", () => {
    const guelph = experience.find((entry) => entry.kind === "education");
    expect(guelph?.company).toBe("University of Guelph");
    expect(guelph?.role).toMatch(/Software Engineering/);
  });
});

describe("sortedExperience", () => {
  it("puts the current role first, then reverse chronological, with undated education last", () => {
    expect(sortedExperience().map((entry) => entry.slug)).toEqual([
      "magnet-nexus",
      "magnet-axiom-cyber",
      "magnet-review",
      "ncr",
      "guelph",
    ]);
  });

  it("does not mutate the source array", () => {
    const before = experience.map((entry) => entry.slug);
    sortedExperience();
    expect(experience.map((entry) => entry.slug)).toEqual(before);
  });
});

describe("lookups", () => {
  it("finds entries by slug", () => {
    expect(getExperience("ncr")?.company).toBe("NCR Corporation");
    expect(getExperience("nope")).toBeUndefined();
  });

  it("lists only entries with case studies, in timeline order", () => {
    expect(caseStudyEntries().map((entry) => entry.slug)).toEqual([
      "magnet-axiom-cyber",
      "magnet-review",
      "ncr",
    ]);
  });
});
