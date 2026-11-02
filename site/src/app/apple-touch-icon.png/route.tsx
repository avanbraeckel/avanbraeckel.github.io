import { ImageResponse } from "next/og";

// Served at /apple-touch-icon.png, the path iOS requests by default. A route
// handler rather than the apple-icon.tsx convention, which exports without a
// file extension (GitHub Pages would serve it as application/octet-stream).
export const dynamic = "force-static";

const SIZE = 180;

/**
 * Full-bleed version of src/app/icon.svg: iOS applies its own corner mask, so
 * the square is left unrounded. Keep the glyph paths in step with icon.svg.
 */
export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundImage: "linear-gradient(180deg, #0e7f79, #095c58)",
      }}
    >
      <svg width={SIZE} height={SIZE} viewBox="0 0 64 64">
        <path fill="#fff" d="M16 50 28.5 14h7L48 50h-7.5L32 25.5 23.5 50z" />
        <path fill="#fff" d="M23 35h18v5.5H23z" />
      </svg>
    </div>,
    { width: SIZE, height: SIZE },
  );
}
