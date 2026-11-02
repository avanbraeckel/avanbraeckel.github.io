import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { ThemeToggle } from "./ThemeToggle";

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("ThemeToggle", () => {
  it("is named for the action it takes, with a matching tooltip", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "Switch to dark mode" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("title", "Switch to dark mode");
    expect(button).not.toHaveAttribute("aria-pressed");
    expect(button.querySelector("[data-icon='moon']")).not.toBeNull();
    expect(button.querySelector("[data-icon='sun']")).not.toBeNull();
  });

  it("switches theme, persists it, and renames itself", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    );
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("avb:theme")).toBe("dark");

    const button = screen.getByRole("button", { name: "Switch to light mode" });
    expect(button).toHaveAttribute("title", "Switch to light mode");
    await user.click(button);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("works from the keyboard", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.tab();
    expect(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    ).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(document.documentElement.dataset.theme).toBe("dark");
    await user.keyboard(" ");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("row variant is a 'Dark mode' switch with aria-pressed", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle variant="row" />);
    const row = screen.getByRole("button", { name: "Dark mode" });
    expect(row).toHaveAttribute("aria-pressed", "false");
    await user.click(row);
    expect(row).toHaveAttribute("aria-pressed", "true");
    expect(row).toHaveAccessibleName("Dark mode");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <ThemeToggle />
        <ThemeToggle variant="row" />
      </>,
    );
    expect(await axe(container)).toHaveProperty("violations", []);
  });
});
