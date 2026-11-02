import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sprites } from "@/sprites";
import { measureTrack, SpriteRunner } from "./SpriteRunner";

const runWidth = sprites["player-run"].frameWidth;

function track(container: HTMLElement) {
  const el = container.firstElementChild as HTMLElement | null;
  if (!el) throw new Error("runner not rendered");
  return el;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("measureTrack", () => {
  it("travels a whole number of art pixels", () => {
    const result = measureTrack(runWidth * 2 + 101, 2, 50);
    expect(result).not.toBeNull();
    expect(result!.distance % 2).toBe(0);
    expect(result!.distance).toBe(100);
    expect(result!.duration).toBe(4);
  });

  it("does not move when the track is narrower than the sprite", () => {
    expect(measureTrack(runWidth, 1, 50)).toBeNull();
    expect(measureTrack(10, 2, 50)).toBeNull();
  });
});

describe("SpriteRunner", () => {
  it("is decorative", () => {
    const { container } = render(<SpriteRunner />);
    expect(track(container)).toHaveAttribute("aria-hidden", "true");
  });

  it("idles until the track is measured", () => {
    const { container } = render(<SpriteRunner />);
    expect(track(container)).toHaveAttribute("data-ready", "false");
  });

  it("starts running once it has room, and drops in the gem", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(600);
    const { container } = render(<SpriteRunner scale={2} speed={40} />);
    const el = track(container);
    expect(el).toHaveAttribute("data-ready", "true");
    const distance = Math.floor((600 - runWidth * 2) / 2) * 2;
    expect(el.style.getPropertyValue("--runner-distance")).toBe(
      `${distance}px`,
    );
    expect(el.style.getPropertyValue("--runner-steps")).toBe(
      String(distance / 2),
    );
    expect(el.querySelector('[data-sprite="gem"]')).not.toBeNull();
  });

  it("can leave out the gem", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(600);
    const { container } = render(<SpriteRunner gem={false} />);
    expect(container.querySelector('[data-sprite="gem"]')).toBeNull();
  });

  it("pauses while the tab is hidden", () => {
    let state: DocumentVisibilityState = "visible";
    vi.spyOn(document, "visibilityState", "get").mockImplementation(
      () => state,
    );
    const { container } = render(<SpriteRunner />);
    expect(track(container)).toHaveAttribute("data-active", "true");
    act(() => {
      state = "hidden";
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(track(container)).toHaveAttribute("data-active", "false");
  });

  it("pauses while off-screen", () => {
    let notify: (
      entries: Partial<IntersectionObserverEntry>[],
    ) => void = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: typeof notify) {
          notify = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    const { container } = render(<SpriteRunner />);
    act(() => notify([{ isIntersecting: false }]));
    expect(track(container)).toHaveAttribute("data-active", "false");
    act(() => notify([{ isIntersecting: true }]));
    expect(track(container)).toHaveAttribute("data-active", "true");
  });
});
