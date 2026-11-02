// Kept free of React imports so the root layout (a server component) can use it.

/** localStorage key holding the visitor's explicit theme (`"light"` or `"dark"`). */
export const THEME_KEY = "avb:theme";

/**
 * Inline script for `<head>`: applies a saved theme to `<html data-theme>`
 * before first paint, so a visitor who chose a theme never sees a flash of
 * the system one. Keep it in step with {@link setTheme}.
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(
  THEME_KEY,
)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
