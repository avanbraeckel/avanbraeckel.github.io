import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const shader = vi.hoisted(() => ({
  createFieldRenderer: vi.fn(),
}));
vi.mock("./shader", () => shader);

import { setAmbientMotionPaused } from "@/design/ambientMotion";
import { LivingBackground } from "./LivingBackground";

function mockMatchMedia(matching: string[] = []) {
  window.matchMedia = vi.fn((query: string) => ({
    matches: matching.includes(query),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function fakeRenderer() {
  return {
    gl: {} as WebGL2RenderingContext,
    resize: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
  };
}

let rafSpy: ReturnType<typeof vi.spyOn>;
let cafSpy: ReturnType<typeof vi.spyOn>;
let frames: Map<number, FrameRequestCallback>;

beforeEach(() => {
  frames = new Map();
  let id = 1;
  rafSpy = vi
    .spyOn(window, "requestAnimationFrame")
    .mockImplementation((cb) => {
      frames.set(id, cb);
      return id++;
    });
  cafSpy = vi
    .spyOn(window, "cancelAnimationFrame")
    .mockImplementation((h) => void frames.delete(h));
  mockMatchMedia();
});

afterEach(() => {
  act(() => setAmbientMotionPaused(false));
  window.localStorage.clear();
  vi.restoreAllMocks();
  shader.createFieldRenderer.mockReset();
});

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("LivingBackground", () => {
  it("renders the CSS fallback, hidden from assistive tech, when WebGL2 is unavailable", () => {
    shader.createFieldRenderer.mockReturnValue(null);
    const { container } = render(<LivingBackground className="extra" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveClass("root", "extra");
    expect(root.dataset.mode).toBe("fallback");
    expect(root.querySelector(".fallback")).toBeInTheDocument();
    expect(root.querySelector("canvas")).toHaveAttribute("data-ready", "false");
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it("does not crash with the real WebGL probe in jsdom (no WebGL)", async () => {
    const real = await vi.importActual<typeof import("./shader")>("./shader");
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    shader.createFieldRenderer.mockImplementation(real.createFieldRenderer);
    const { container } = render(<LivingBackground />);
    expect((container.firstElementChild as HTMLElement).dataset.mode).toBe(
      "fallback",
    );
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it("renders one static frame and starts no rAF loop under reduced motion", () => {
    mockMatchMedia(["(prefers-reduced-motion: reduce)"]);
    const renderer = fakeRenderer();
    shader.createFieldRenderer.mockReturnValue(renderer);
    const { container } = render(<LivingBackground />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.mode).toBe("static");
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(root.querySelector("canvas")).toHaveAttribute("data-ready", "true");
    expect(rafSpy).not.toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new PointerEvent("pointermove"));
      window.dispatchEvent(new Event("scroll"));
    });
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it("animates, pauses while the tab is hidden, and resumes when visible", () => {
    const renderer = fakeRenderer();
    shader.createFieldRenderer.mockReturnValue(renderer);
    const { container, unmount } = render(<LivingBackground />);
    expect((container.firstElementChild as HTMLElement).dataset.mode).toBe(
      "animated",
    );
    expect(frames.size).toBe(1);

    act(() => setVisibility("hidden"));
    expect(frames.size).toBe(0);
    expect(cafSpy).toHaveBeenCalled();

    act(() => setVisibility("visible"));
    expect(frames.size).toBe(1);

    act(() => window.dispatchEvent(new Event("blur")));
    expect(frames.size).toBe(0);
    act(() => window.dispatchEvent(new Event("focus")));
    expect(frames.size).toBe(1);

    unmount();
    expect(frames.size).toBe(0);
    expect(renderer.dispose).toHaveBeenCalled();
  });

  it("freezes on the visitor's pause, keeps redrawing on resize, and resumes", () => {
    const renderer = fakeRenderer();
    shader.createFieldRenderer.mockReturnValue(renderer);
    render(<LivingBackground />);
    expect(frames.size).toBe(1);

    act(() => setAmbientMotionPaused(true));
    expect(frames.size).toBe(0);
    expect(cafSpy).toHaveBeenCalled();

    // Other pause reasons clearing must not restart a user-paused loop.
    act(() => window.dispatchEvent(new Event("blur")));
    act(() => window.dispatchEvent(new Event("focus")));
    act(() => window.dispatchEvent(new PointerEvent("pointermove")));
    expect(frames.size).toBe(0);

    const draws = renderer.render.mock.calls.length;
    act(() => window.dispatchEvent(new Event("resize")));
    expect(renderer.resize).toHaveBeenCalled();
    expect(renderer.render.mock.calls.length).toBe(draws + 1);

    act(() => setAmbientMotionPaused(false));
    expect(frames.size).toBe(1);
  });

  it("starts frozen when the visitor already paused", () => {
    const renderer = fakeRenderer();
    shader.createFieldRenderer.mockReturnValue(renderer);
    act(() => setAmbientMotionPaused(true));
    render(<LivingBackground />);
    expect(frames.size).toBe(0);
    expect(renderer.render).toHaveBeenCalledTimes(1);
  });
});
