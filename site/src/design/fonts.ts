import localFont from "next/font/local";

/**
 * Inter Variable (OFL, see Inter-LICENSE.txt), self-hosted.
 *
 * It sits after the Apple system fonts in --font-sans, so Apple devices never
 * download it. preload is off for the same reason; it loads on demand elsewhere.
 * Exposes --font-inter on the element that receives `inter.variable`.
 *
 * The woff2 files are subsets of Inter 4: Google Fonts' "latin" range plus
 * the arrows and "≈" the copy uses, the weight axis limited to 400–700 (the
 * range the type scale uses), optical size kept, and the common OpenType
 * features kept. About 70 KB each instead of 350 KB.
 */
export const inter = localFont({
  src: [
    { path: "./fonts/InterVariable.woff2", style: "normal", weight: "400 700" },
    {
      path: "./fonts/InterVariable-Italic.woff2",
      style: "italic",
      weight: "400 700",
    },
  ],
  variable: "--font-inter",
  display: "swap",
  preload: false,
  // The rest of the stack lives in --font-sans (typography.css).
  fallback: [],
});

/**
 * Display face for large headings: Mona Sans (OFL, see AVBDisplay-LICENSE.txt),
 * self-hosted. Mona Sans has the Reserved Font Name "Mona", so this modified
 * file (subset to Latin plus curly quotes, dashes, arrows and "€"; width axis
 * pinned at 110; weight axis limited to 600–800) is renamed "AVB Display".
 *
 * Unlike Inter it is first in --font-display on every platform, Apple
 * included, so it is preloaded. The generated fallback face
 * (Arial with size-adjust and metric overrides) keeps the swap from shifting
 * layout. Exposes --font-avb-display.
 */
export const avbDisplay = localFont({
  src: [
    { path: "./fonts/AVBDisplay.woff2", style: "normal", weight: "600 800" },
  ],
  variable: "--font-avb-display",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
  // The rest of the stack lives in --font-display (typography.css).
  fallback: [],
});
