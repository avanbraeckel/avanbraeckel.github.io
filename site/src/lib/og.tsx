import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/content/site";
import { OG_SIZE, type OgCard } from "@/lib/seo";

/**
 * Open Graph cards, rendered at build time by src/app/og/[image]/route.tsx.
 *
 * Satori can't load network fonts or woff2, and ignores variable-font axes, so
 * the cards use static Inter TTFs from src/design/fonts/og (OFL, Inter 4.1).
 * They are read at build time only and never shipped to the browser.
 */

// Light-scheme tokens from src/design/tokens.css.
const color = {
  bg: "#fbfbf9",
  fg: "#1c1c1e",
  secondary: "#6b6b70",
  accent: "#0b6f6a",
  apricot: "#e2915a",
};

const fontDir = path.join(process.cwd(), "src/design/fonts/og");

async function loadFonts() {
  const [regular, semibold] = await Promise.all([
    readFile(path.join(fontDir, "Inter-Regular.ttf")),
    readFile(path.join(fontDir, "Inter-SemiBold.ttf")),
  ]);
  return [
    {
      name: "Inter",
      data: regular,
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Inter",
      data: semibold,
      weight: 600 as const,
      style: "normal" as const,
    },
  ];
}

/** The monogram from src/app/icon.svg, as a data URI for <img>. */
export async function monogramDataUri(): Promise<string> {
  const svg = await readFile(path.join(process.cwd(), "src/app/icon.svg"));
  return `data:image/svg+xml;base64,${svg.toString("base64")}`;
}

export async function renderOgCard({ eyebrow, title, subtitle }: OgCard) {
  const [fonts, monogram] = await Promise.all([loadFonts(), monogramDataUri()]);
  const host = new URL(site.url).host;
  const titleSize = title.length > 28 ? 76 : 96;
  // The home card's title is the name itself; don't repeat it in the header.
  const showName = title !== site.name;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        backgroundColor: color.bg,
        // Echo of the living background: lagoon and apricot glows.
        backgroundImage: `radial-gradient(circle at 92% 8%, rgba(11, 111, 106, 0.22), rgba(11, 111, 106, 0) 46%), radial-gradient(circle at 78% 100%, rgba(226, 145, 90, 0.22), rgba(226, 145, 90, 0) 42%)`,
        fontFamily: "Inter",
        color: color.fg,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori, not the DOM */}
        <img src={monogram} width={56} height={56} alt="" />
        {showName ? (
          <div
            style={{
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            {site.name}
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            fontSize: 30,
            fontWeight: 600,
            color: color.accent,
            letterSpacing: "-0.01em",
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 600,
            lineHeight: 1.04,
            letterSpacing: "-0.035em",
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              fontSize: 34,
              lineHeight: 1.3,
              color: color.secondary,
              letterSpacing: "-0.012em",
              maxWidth: 940,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          fontSize: 24,
          color: color.secondary,
        }}
      >
        {host}
      </div>
    </div>,
    { ...OG_SIZE, fonts },
  );
}
