import { afterEach, describe, expect, it } from "vitest";
import {
  NARROW_DISPLAY_WIDTH,
  WIDE_DISPLAY_WIDTH,
  createSession,
  displayWidthFor,
  layoutFor,
  resetSessionForTests,
  visibleHeight,
} from "./transientRuntime";

describe("display layout", () => {
  it("puts the centered window flush against the notice", () => {
    const notice = 23;
    const layout = layoutFor(760, notice);
    const windowTop = (layout.height - 500) / 2;
    // Window bottom meets the notice top exactly: no dead band, no overlap.
    expect(windowTop + 500).toBe(layout.height - notice);
  });

  it("crops the space above the window and the title bar, not the notice", () => {
    const layout = layoutFor(760, 23);
    // What remains visible is the 480px game plus the full notice.
    expect(visibleHeight(layout)).toBe(480 + 23);
  });

  it("makes room for a notice that wraps to two lines", () => {
    expect(visibleHeight(layoutFor(644, 42))).toBe(480 + 42);
  });

  it("uses the one-line width when the column allows it", () => {
    expect(displayWidthFor(1024)).toBe(WIDE_DISPLAY_WIDTH);
    expect(displayWidthFor(360)).toBe(NARROW_DISPLAY_WIDTH);
  });
});

describe("session display", () => {
  afterEach(() => resetSessionForTests());

  it("sizes and shifts the display element by the layout", () => {
    const session = createSession(1024);
    const { layout } = session.getState();
    expect(session.host.style.width).toBe(`${WIDE_DISPLAY_WIDTH}px`);
    expect(session.host.style.height).toBe(`${layout.height}px`);
    expect(session.host.style.marginTop).toBe(`${-layout.cropTop}px`);
  });
});
