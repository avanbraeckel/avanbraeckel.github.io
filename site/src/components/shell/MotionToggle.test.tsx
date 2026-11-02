import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { setAmbientMotionPaused } from "@/design/ambientMotion";
import { MotionToggle } from "./MotionToggle";

afterEach(() => {
  act(() => setAmbientMotionPaused(false));
  window.localStorage.clear();
});

describe("MotionToggle", () => {
  it("is a toggle button with a stable name", () => {
    render(<MotionToggle />);
    const button = screen.getByRole("button", { name: "Pause animations" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).toHaveAttribute("title", "Pause animations");
  });

  it("flips aria-pressed on click, keeps its name, swaps the icon, and persists", async () => {
    const user = userEvent.setup();
    render(<MotionToggle />);
    const button = screen.getByRole("button", { name: "Pause animations" });
    expect(button.querySelector("[data-icon='pause']")).not.toBeNull();

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveAccessibleName("Pause animations");
    expect(button.querySelector("[data-icon='play']")).not.toBeNull();
    expect(window.localStorage.getItem("avb:ambient-motion")).toBe("paused");
    expect(document.documentElement.dataset.ambientMotion).toBe("paused");

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(window.localStorage.getItem("avb:ambient-motion")).toBeNull();
  });

  it("works from the keyboard (Enter and Space)", async () => {
    const user = userEvent.setup();
    render(<MotionToggle />);
    const button = screen.getByRole("button", { name: "Pause animations" });
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-pressed", "true");
    await user.keyboard(" ");
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("the row variant is named by its visible text", async () => {
    const user = userEvent.setup();
    render(<MotionToggle variant="row" />);
    const button = screen.getByRole("button", { name: "Pause animations" });
    expect(button).toHaveTextContent("Pause animations");
    expect(button).not.toHaveAttribute("aria-label");
    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("stays in sync across instances", async () => {
    const user = userEvent.setup();
    render(
      <>
        <MotionToggle />
        <MotionToggle variant="row" />
      </>,
    );
    const [a, b] = screen.getAllByRole("button", { name: "Pause animations" });
    await user.click(a);
    expect(b).toHaveAttribute("aria-pressed", "true");
  });
});
