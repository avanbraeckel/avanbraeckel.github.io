import { useSyncExternalStore } from "react";

import { AMBIENT_MOTION_KEY } from "./ambientMotionScript";

export {
  AMBIENT_MOTION_INIT_SCRIPT,
  AMBIENT_MOTION_KEY,
} from "./ambientMotionScript";

type Listener = () => void;

const listeners = new Set<Listener>();
/** Null until first read, so module load never touches storage (SSR-safe). */
let paused: boolean | null = null;
let storageBound = false;

function readStored(): boolean {
  try {
    return window.localStorage.getItem(AMBIENT_MOTION_KEY) === "paused";
  } catch {
    return false;
  }
}

function writeStored(next: boolean) {
  try {
    if (next) window.localStorage.setItem(AMBIENT_MOTION_KEY, "paused");
    else window.localStorage.removeItem(AMBIENT_MOTION_KEY);
  } catch {
    // Storage blocked: the choice still holds for this page view.
  }
}

/** Mirrors the state to `<html data-ambient-motion>` so CSS can react. */
function mirror(next: boolean) {
  if (typeof document === "undefined") return;
  if (next) document.documentElement.dataset.ambientMotion = "paused";
  else delete document.documentElement.dataset.ambientMotion;
}

function commit(next: boolean) {
  if (next === paused) return;
  paused = next;
  mirror(next);
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent) {
  // `key === null` means the whole storage area was cleared.
  if (event.key !== null && event.key !== AMBIENT_MOTION_KEY) return;
  commit(readStored());
}

/** Whether the visitor has paused ambient animation. False on the server. */
export function getAmbientMotionPaused(): boolean {
  if (typeof window === "undefined") return false;
  if (paused === null) {
    paused = readStored();
    mirror(paused);
  }
  return paused;
}

/** Pause or resume ambient animation, persist the choice, and notify subscribers. */
export function setAmbientMotionPaused(next: boolean): void {
  if (typeof window === "undefined") return;
  getAmbientMotionPaused();
  writeStored(next);
  commit(next);
}

/** Subscribe to changes, including ones made in other tabs. Returns an unsubscribe. */
export function subscribeAmbientMotion(callback: Listener): () => void {
  listeners.add(callback);
  if (!storageBound && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
    storageBound = true;
  }
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && storageBound) {
      window.removeEventListener("storage", onStorage);
      storageBound = false;
    }
  };
}

/** React binding for the store. Server snapshot is `false`. */
export function useAmbientMotionPaused(): boolean {
  return useSyncExternalStore(
    subscribeAmbientMotion,
    getAmbientMotionPaused,
    () => false,
  );
}
