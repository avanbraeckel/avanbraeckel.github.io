import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TransientPage from "@/app/projects/transient/page";

describe("Transient page", () => {
  it("renders its h1", () => {
    render(<TransientPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Transient" }),
    ).toBeInTheDocument();
  });

  it("downloads the game zip", () => {
    render(<TransientPage />);
    const download = screen.getByRole("link", { name: /^download$/i });
    expect(download).toHaveAttribute(
      "href",
      "/transient/TRANSIENT-DISTRIBUTABLE.zip",
    );
    expect(download).toHaveAttribute("download");
  });

  it("shows the in-browser player", () => {
    render(<TransientPage />);
    expect(
      screen.getByRole("button", { name: /play in browser/i }),
    ).toBeEnabled();
    expect(
      screen.getByRole("img", { name: /transient title screen/i }),
    ).toBeInTheDocument();
  });

  it("lists the keyboard controls", () => {
    render(<TransientPage />);
    expect(screen.getByText("Flash step")).toBeInTheDocument();
    expect(screen.getByText("Shift")).toBeInTheDocument();
  });

  it("explains how to leave the game with the keyboard", () => {
    render(<TransientPage />);
    expect(
      screen.getByText(/press tab to leave the game/i),
    ).toBeInTheDocument();
  });
});
