import { afterEach, describe, expect, it, vi } from "vitest";
import {
  THEME_INIT_SCRIPT,
  THEME_KEY,
  getTheme,
  setTheme,
  subscribeTheme,
} from "./theme";

function mockSystemDark(matches: boolean) {
  const listeners = new Set<() => void>();
  const mql = {
    matches,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mql),
  );
  return {
    set(next: boolean) {
      mql.matches = next;
      listeners.forEach((fn) => fn());
    },
  };
}

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  vi.unstubAllGlobals();
});

describe("theme store", () => {
  it("follows the system preference until the visitor chooses", () => {
    mockSystemDark(true);
    expect(getTheme()).toBe("dark");
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("persists an explicit choice and mirrors it to <html data-theme>", () => {
    mockSystemDark(true);
    setTheme("light");
    expect(window.localStorage.getItem(THEME_KEY)).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(getTheme()).toBe("light");
  });

  it("notifies subscribers on change and on system changes", () => {
    const system = mockSystemDark(false);
    const listener = vi.fn();
    const unsubscribe = subscribeTheme(listener);

    setTheme("dark");
    expect(listener).toHaveBeenCalledTimes(1);

    window.localStorage.clear();
    system.set(true);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(getTheme()).toBe("dark");

    unsubscribe();
    system.set(false);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("syncs a choice made in another tab", () => {
    mockSystemDark(false);
    const listener = vi.fn();
    const unsubscribe = subscribeTheme(listener);
    window.localStorage.setItem(THEME_KEY, "dark");
    window.dispatchEvent(new StorageEvent("storage", { key: THEME_KEY }));
    expect(listener).toHaveBeenCalled();
    expect(document.documentElement.dataset.theme).toBe("dark");
    unsubscribe();
  });

  it("still switches for this page view when storage throws", () => {
    mockSystemDark(false);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => setTheme("dark")).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe("dark");
    vi.restoreAllMocks();
  });

  it("init script applies a saved theme and ignores junk", () => {
    window.localStorage.setItem(THEME_KEY, "dark");
    new Function(THEME_INIT_SCRIPT)();
    expect(document.documentElement.dataset.theme).toBe("dark");

    delete document.documentElement.dataset.theme;
    window.localStorage.setItem(THEME_KEY, "purple");
    new Function(THEME_INIT_SCRIPT)();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });
});
