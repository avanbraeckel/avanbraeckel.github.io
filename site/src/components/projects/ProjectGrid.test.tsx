import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { projects } from "@/content/projects";
import { ProjectGrid } from "./ProjectGrid";

describe("ProjectGrid", () => {
  it("renders one linked card per project", () => {
    const { container } = render(<ProjectGrid projects={projects} />);
    expect(container.querySelectorAll("ul > li > a")).toHaveLength(
      projects.length,
    );
    for (const project of projects) {
      expect(
        screen.getByRole("link", { name: new RegExp(project.title, "i") }),
      ).toBeInTheDocument();
    }
  });

  it("gives a lone project the full-row layout", () => {
    const { container } = render(
      <ProjectGrid projects={projects.slice(0, 1)} />,
    );
    expect(container.querySelector("ul")).toHaveClass("single");
    expect(container.querySelector("a")).toHaveClass("wide");
  });
});
