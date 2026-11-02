import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sortedExperience } from "@/content/experience";
import { Timeline } from "./Timeline";

describe("Timeline", () => {
  it("renders every entry in reverse chronological order", () => {
    render(<Timeline entries={sortedExperience()} />);
    const items = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);
    expect(items).toEqual([
      "Magnet Forensics",
      "Magnet Forensics",
      "Magnet Forensics",
      "NCR Corporation",
      "University of Guelph",
    ]);
  });

  it("links each work entry to its case study", () => {
    render(<Timeline entries={sortedExperience()} />);
    const links = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(links).toEqual([
      expect.stringMatching(/^\/experience\/magnet-axiom-cyber\/?$/),
      expect.stringMatching(/^\/experience\/magnet-review\/?$/),
      expect.stringMatching(/^\/experience\/ncr\/?$/),
    ]);
    expect(
      screen.getByRole("link", {
        name: /NCR Corporation.*Read the case study/,
      }),
    ).toBeInTheDocument();
  });

  it("shows the current role first, from its start to 'Present', without a link", () => {
    render(<Timeline entries={sortedExperience()} />);
    const nexus = screen.getByRole("article", { name: "Magnet Forensics" });
    expect(nexus).toHaveTextContent("Magnet Nexus");
    expect(within(nexus).queryByRole("link")).toBeNull();
    const first = screen.getAllByRole("listitem")[0];
    expect(first).toHaveAttribute("data-slug", "magnet-nexus");
    expect(within(first).getByText("Jul 2024 – Present")).toBeInTheDocument();
    expect(nexus).toHaveTextContent("Waterloo, ON");
  });

  it("shows dates and stack, and does not link the education entry", () => {
    render(<Timeline entries={sortedExperience()} />);
    expect(screen.getByText("Jan – Aug 2023")).toHaveAttribute(
      "dateTime",
      "2023-01",
    );
    expect(screen.getAllByRole("list", { name: "Stack" })).toHaveLength(4);
    const guelph = screen.getByRole("article", {
      name: "University of Guelph",
    });
    expect(within(guelph).queryByRole("link")).toBeNull();
  });
});
