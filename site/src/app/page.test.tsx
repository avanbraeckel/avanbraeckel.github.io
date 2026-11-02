import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

/** next/link only keeps the trailing slash when next.config sets trailingSlash. */
const route = (path: string) =>
  expect.stringMatching(new RegExp(`^${path.replace(/\/$/, "")}/?$`));

describe("Home page", () => {
  it("greets with the name as the only h1", () => {
    render(<Home />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Hi! I’m Austin Van Braeckel");
  });

  it("mentions the current role", () => {
    render(<Home />);
    expect(
      screen.getByText(/Software Engineer at Magnet Forensics/),
    ).toBeInTheDocument();
  });

  it("has one primary action, to Experience", () => {
    render(<Home />);
    expect(
      screen.getByRole("link", { name: /see my experience/i }),
    ).toHaveAttribute("href", route("/experience/"));
    expect(
      screen.getByRole("link", { name: /more about me/i }),
    ).toHaveAttribute("href", route("/about/"));
  });

  it("features Transient once, linking to its page", () => {
    render(<Home />);
    const section = screen.getByRole("region", {
      name: /i even made my own game/i,
    });
    const links = within(section).getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName("Play Transient");
    expect(links[0]).toHaveAttribute("href", route("/projects/transient/"));
  });

  it("points to the full timeline instead of repeating it", () => {
    render(<Home />);
    const section = screen.getByRole("region", { name: /where i’ve worked/i });
    expect(within(section).queryByRole("list")).toBeNull();
    expect(
      within(section).getByRole("link", { name: /full timeline/i }),
    ).toHaveAttribute("href", route("/experience/"));
  });

  it("does not use the old student framing", () => {
    const { container } = render(<Home />);
    expect(container.textContent).not.toMatch(/fifth-year|student at/i);
  });
});
