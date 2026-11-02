import { describe, expect, it } from "vitest";
import manifest from "@/media/manifest.json";
import { getProject, projects } from "./projects";

describe("projects", () => {
  it("has unique slugs", () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("links each project to /projects/<slug>/", () => {
    for (const project of projects) {
      expect(project.href).toBe(`/projects/${project.slug}/`);
    }
  });

  it("only uses cover images that exist in the media manifest", () => {
    for (const project of projects) {
      if (project.cover) expect(manifest.images).toHaveProperty(project.cover);
    }
  });

  it("finds Transient by slug", () => {
    expect(getProject("transient").title).toBe("Transient");
  });

  it("throws for an unknown slug", () => {
    expect(() => getProject("nope")).toThrow();
  });
});
