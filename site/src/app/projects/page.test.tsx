import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProjectsPage from "@/app/projects/page";
import { projects } from "@/content/projects";

/** next/link only keeps the trailing slash when next.config sets trailingSlash. */
const route = (path: string) =>
  expect.stringMatching(new RegExp(`^${path.replace(/\/$/, "")}/?$`));

describe("Projects page", () => {
  it("renders its h1", () => {
    render(<ProjectsPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Projects" }),
    ).toBeInTheDocument();
  });

  it("links every project to its page", () => {
    render(<ProjectsPage />);
    for (const project of projects) {
      const heading = screen.getByRole("heading", {
        level: 2,
        name: project.title,
      });
      expect(heading.closest("a")).toHaveAttribute("href", route(project.href));
    }
  });
});
