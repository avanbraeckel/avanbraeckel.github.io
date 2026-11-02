import { useSyncExternalStore } from "react";

import { THEME_KEY } from "./themeScript";

export { THEME_INIT_SCRIPT, THEME_KEY } from "./themeScript";

export type Theme = "light" | "dark";

type Listener = () => void;

const DARK_QUERY = "(prefers-color-scheme: dark)";
const listeners = new Set<Listener>();
/** The bound system-preference query, so unsubscribing removes the same listener. */
let systemQuery: MediaQueryList | null = null;
let bound = false;

function readStored(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia?.(DARK_QUERY).matches ? "dark" : "light";
}

/** Mirrors the explicit choice to `<html data-theme>`, which tokens.css keys off. */
function mirror(theme: Theme | null) {
  if (theme) document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}

function notify() {
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent) {
  // `key === null` means the whole storage area was cleared.
  if (event.key !== null && event.key !== THEME_KEY) return;
  mirror(readStored());
  notify();
}

/**
 * The theme the page is showing: the visitor's explicit choice, else the
 * system preference. Null on the server, where neither is known.
 */
export function getTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  return readStored() ?? systemTheme();
}

/** Switch to `next`, persist the choice, and notify subscribers. */
export function setTheme(next: Theme): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_KEY, next);
  } catch {
    // Storage blocked: the choice still holds for this page view.
  }
  mirror(next);
  notify();
}

/**
 * Subscribe to theme changes: explicit choices (including other tabs) and,
 * while there is no explicit choice, system preference changes.
 */
export function subscribeTheme(callback: Listener): () => void {
  listeners.add(callback);
  if (!bound) {
    window.addEventListener("storage", onStorage);
    systemQuery = window.matchMedia?.(DARK_QUERY) ?? null;
    systemQuery?.addEventListener?.("change", notify);
    bound = true;
  }
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && bound) {
      window.removeEventListener("storage", onStorage);
      systemQuery?.removeEventListener?.("change", notify);
      systemQuery = null;
      bound = false;
    }
  };
}

/** React binding for the store. Server snapshot is `null`. */
export function useTheme(): Theme | null {
  return useSyncExternalStore(subscribeTheme, getTheme, () => null);
}
