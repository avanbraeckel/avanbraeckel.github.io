import type { Metadata, Viewport } from "next";
import { LivingBackground } from "@/background";
import {
  PageTransition,
  SiteFooter,
  SiteNav,
  SkipLink,
} from "@/components/shell";
import { site } from "@/content/site";
import { AMBIENT_MOTION_INIT_SCRIPT } from "@/design/ambientMotionScript";
import { avbDisplay, inter } from "@/design/fonts";
import {
  DEFAULT_DESCRIPTION,
  baseOpenGraph,
  ogImage,
  personJsonLd,
} from "@/lib/seo";
import "./globals.css";
import "@/components/shell/shell.css";

// Defaults for routes without their own (e.g. 404). Public pages
// build theirs with pageMetadata() from @/lib/seo. No canonical here, so
// those routes don't claim to be the home page.
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  // Setting `icons` drops the file-based icon.svg link (favicon.ico stays),
  // so the SVG is listed here too.
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/apple-touch-icon.png",
  },
  openGraph: { ...baseOpenGraph, images: [ogImage("/")] },
  twitter: { card: "summary_large_image", images: [ogImage("/")] },
};

// --bg per scheme, from src/design/tokens.css.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the init script sets data-ambient-motion
    // before React hydrates, so the attribute differs from the server HTML.
    <html
      lang="en"
      className={`${inter.variable} ${avbDisplay.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          // Constant string (no user input); runs before first paint.
          dangerouslySetInnerHTML={{ __html: AMBIENT_MOTION_INIT_SCRIPT }}
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          // JSON.stringify output with "<" escaped cannot close the script tag.
          dangerouslySetInnerHTML={{ __html: personJsonLd() }}
        />
        <SkipLink targetId="main" />
        <LivingBackground />
        <SiteNav />
        <main id="main" tabIndex={-1}>
          <PageTransition>
            <div>{children}</div>
          </PageTransition>
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
