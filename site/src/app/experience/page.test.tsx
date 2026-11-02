import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ExperiencePage from "./page";

describe("/experience", () => {
  it("renders the page heading and the timeline", () => {
    render(<ExperiencePage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Where I’ve worked" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Read the case study/ }),
    ).toHaveLength(3);
  });
});
