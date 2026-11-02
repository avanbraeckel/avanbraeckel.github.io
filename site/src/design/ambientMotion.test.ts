import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const KEY = "avb:ambient-motion";

async function load() {
  vi.resetModules();
  return import("./ambientMotion");
}

beforeEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.ambientMotion;
  vi.restoreAllMocks();
});

describe("ambientMotion store", () => {
  it("defaults to playing", async () => {
    const store = await load();
    expect(store.getAmbientMotionPaused()).toBe(false);
    expect(document.documentElement.dataset.ambientMotion).toBeUndefined();
  });

  it("persists the choice and mirrors it to <html>", async () => {
    const store = await load();
    store.setAmbientMotionPaused(true);
    expect(window.localStorage.getItem(KEY)).toBe("paused");
    expect(document.documentElement.dataset.ambientMotion).toBe("paused");
    store.setAmbientMotionPaused(false);
    expect(window.localStorage.getItem(KEY)).toBeNull();
    expect(document.documentElement.dataset.ambientMotion).toBeUndefined();
  });

  it("restores a saved pause on first read", async () => {
    window.localStorage.setItem(KEY, "paused");
    const store = await load();
    expect(store.getAmbientMotionPaused()).toBe(true);
    expect(document.documentElement.dataset.ambientMotion).toBe("paused");
  });

  it("notifies subscribers only on change and stops after unsubscribe", async () => {
    const store = await load();
    const cb = vi.fn();
    const off = store.subscribeAmbientMotion(cb);
    store.setAmbientMotionPaused(true);
    store.setAmbientMotionPaused(true);
    expect(cb).toHaveBeenCalledTimes(1);
    off();
    store.setAmbientMotionPaused(false);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("syncs from other tabs via the storage event", async () => {
    const store = await load();
    const cb = vi.fn();
    store.subscribeAmbientMotion(cb);
    window.localStorage.setItem(KEY, "paused");
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
    expect(store.getAmbientMotionPaused()).toBe(true);
    expect(document.documentElement.dataset.ambientMotion).toBe("paused");

    window.dispatchEvent(new StorageEvent("storage", { key: "unrelated" }));
    expect(cb).toHaveBeenCalledTimes(1);

    window.localStorage.clear();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
    expect(store.getAmbientMotionPaused()).toBe(false);
  });

  it("survives localStorage throwing", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const store = await load();
    expect(store.getAmbientMotionPaused()).toBe(false);
    expect(() => store.setAmbientMotionPaused(true)).not.toThrow();
    expect(store.getAmbientMotionPaused()).toBe(true);
    expect(document.documentElement.dataset.ambientMotion).toBe("paused");
  });

  it("drives the hook", async () => {
    const store = await load();
    const { result } = renderHook(() => store.useAmbientMotionPaused());
    expect(result.current).toBe(false);
    act(() => store.setAmbientMotionPaused(true));
    expect(result.current).toBe(true);
  });

  it("init script applies a saved pause and tolerates storage errors", async () => {
    const { AMBIENT_MOTION_INIT_SCRIPT } = await load();
    window.localStorage.setItem(KEY, "paused");
    new Function(AMBIENT_MOTION_INIT_SCRIPT)();
    expect(document.documentElement.dataset.ambientMotion).toBe("paused");

    delete document.documentElement.dataset.ambientMotion;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => new Function(AMBIENT_MOTION_INIT_SCRIPT)()).not.toThrow();
    expect(document.documentElement.dataset.ambientMotion).toBeUndefined();
  });
});
