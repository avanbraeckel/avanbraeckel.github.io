// Kept free of React imports so the root layout (a server component) can use it.

/** localStorage key holding the visitor's choice (`"paused"`, or absent). */
export const AMBIENT_MOTION_KEY = "avb:ambient-motion";

/**
 * Inline script for `<head>`: applies a saved pause to `<html>` before first
 * paint, so a paused visitor never sees a flash of motion on reload. Keep it
 * in step with {@link setAmbientMotionPaused}.
 */
export const AMBIENT_MOTION_INIT_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(
  AMBIENT_MOTION_KEY,
)})==="paused")document.documentElement.dataset.ambientMotion="paused"}catch(e){}`;
