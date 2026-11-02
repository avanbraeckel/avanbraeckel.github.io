import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { sprites } from "@/sprites";
import { PixelSprite } from "./PixelSprite";

function spriteEl(container: HTMLElement) {
  const el = container.querySelector<HTMLElement>("[data-sprite]");
  if (!el) throw new Error("sprite not rendered");
  return el;
}

describe("sprite sheets", () => {
  it("describe whole-number frames that fit the strip", () => {
    for (const sheet of Object.values(sprites)) {
      expect(Number.isInteger(sheet.frameWidth)).toBe(true);
      expect(Number.isInteger(sheet.frameHeight)).toBe(true);
      expect(sheet.frames).toBeGreaterThan(0);
      expect(sheet.still).toBeGreaterThanOrEqual(0);
      expect(sheet.still).toBeLessThan(sheet.frames);
      expect(sheet.src).toBeTruthy();
    }
  });
});

describe("PixelSprite", () => {
  it("sizes the box to one frame at the given scale", () => {
    const { container } = render(<PixelSprite sprite="player-run" scale={3} />);
    const sheet = sprites["player-run"];
    const el = spriteEl(container);
    expect(el.style.width).toBe(`${sheet.frameWidth * 3}px`);
    expect(el.style.height).toBe(`${sheet.frameHeight * 3}px`);
    expect(el.style.backgroundSize).toBe(
      `${sheet.frameWidth * sheet.frames * 3}px ${sheet.frameHeight * 3}px`,
    );
    expect(el.style.getPropertyValue("--sprite-steps")).toBe(
      String(sheet.frames),
    );
    expect(el.style.getPropertyValue("--sprite-end")).toBe(
      `${-sheet.frameWidth * sheet.frames * 3}px`,
    );
  });

  it("rounds the scale to a whole number so pixels stay square", () => {
    const { container } = render(<PixelSprite sprite="gem" scale={2.4} />);
    expect(spriteEl(container).style.width).toBe(
      `${sprites.gem.frameWidth * 2}px`,
    );
  });

  it("derives the cycle length from fps", () => {
    const { container } = render(<PixelSprite sprite="gem" fps={5} />);
    expect(
      spriteEl(container).style.getPropertyValue("--sprite-duration"),
    ).toBe(`${sprites.gem.frames / 5}s`);
  });

  it("is decorative without a label", () => {
    const { container } = render(<PixelSprite sprite="slime" />);
    expect(spriteEl(container)).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("is an image when labelled", async () => {
    const { container } = render(
      <PixelSprite sprite="player-idle" label="Transient's hero" />,
    );
    expect(screen.getByRole("img", { name: "Transient's hero" })).toBe(
      spriteEl(container),
    );
    expect(await axe(container)).toHaveProperty("violations", []);
  });

  it("holds the still frame when not playing", () => {
    const { container, rerender } = render(<PixelSprite sprite="portal" />);
    expect(spriteEl(container)).toHaveAttribute("data-playing", "true");
    rerender(<PixelSprite sprite="portal" playing={false} />);
    expect(spriteEl(container)).toHaveAttribute("data-playing", "false");
  });

  it("mirrors when flipped", () => {
    const { container } = render(<PixelSprite sprite="slime" flip />);
    expect(spriteEl(container).className).toMatch(/flip/);
  });
});
