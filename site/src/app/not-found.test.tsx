import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound, { metadata } from "./not-found";

describe("404 page", () => {
  it("explains the miss and links home, to Projects, and to Experience", () => {
    render(<NotFound />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
    for (const [name, href] of [
      ["Home", "/"],
      ["Projects", "/projects/"],
      ["Experience", "/experience/"],
    ]) {
      // next/link drops the trailing slash outside a Next build.
      expect(
        screen
          .getByRole("link", { name })
          .getAttribute("href")
          ?.replace(/\/?$/, "/"),
      ).toBe(href);
    }
  });

  it("doesn't add a second main landmark (the layout owns it)", () => {
    render(<NotFound />);
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });

  it("has its own title", () => {
    expect(metadata.title).toBe("Page not found");
  });
});
