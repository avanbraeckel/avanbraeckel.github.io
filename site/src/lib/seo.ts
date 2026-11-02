import type { Metadata } from "next";
import { formatRange } from "@/components/experience/format";
import { caseStudyEntries } from "@/content/experience";
import { site } from "@/content/site";

/**
 * Per-route metadata, Open Graph cards, and the list of public routes (the
 * sitemap's source).
 *
 * Next merges metadata shallowly per top-level key, so a page that sets
 * `openGraph` replaces the layout's `openGraph` entirely. `pageMetadata` builds
 * the full object so every route gets the same Open Graph fields.
 *
 * OG images are PNGs rendered at build time by src/app/og/[image]/route.tsx.
 * They are not file-based `opengraph-image.tsx` routes because those export
 * without a file extension, and GitHub Pages would serve them as
 * application/octet-stream, which link unfurlers reject.
 */

export const DEFAULT_DESCRIPTION =
  "Hi! I’m Austin Van Braeckel, a Software Engineer on the Nexus team at Magnet Forensics. Take a look at my projects, my co-op work at NCR and Magnet Forensics, and a bit about me.";

export const OG_SIZE = { width: 1200, height: 630 } as const;

/** Indexable static routes. Keep in step with src/app/**\/page.tsx. */
export const staticRoutes = [
  "/",
  "/projects/",
  "/projects/transient/",
  "/experience/",
  "/about/",
] as const;

/** Every public, indexable route, with trailing slashes. */
export function publicRoutes(): string[] {
  return [
    ...staticRoutes,
    ...caseStudyEntries().flatMap((entry) => (entry.href ? [entry.href] : [])),
  ];
}

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}

export interface OgCard {
  /** Small accent line above the title, e.g. "Case study". */
  eyebrow: string;
  title: string;
  /** Supporting line under the title. */
  subtitle?: string;
  /** Alt text for the rendered image. */
  alt: string;
}

const staticCards: Record<(typeof staticRoutes)[number], OgCard> = {
  "/": {
    eyebrow: "Software engineer",
    title: site.name,
    subtitle:
      "Software Engineer on the Nexus team at Magnet Forensics. My projects, plus write-ups from my co-op terms.",
    alt: `${site.name}, software engineer`,
  },
  "/projects/": {
    eyebrow: "Projects",
    title: "Things I’ve made for fun",
    subtitle:
      "Transient, a Java platformer you can play right in your browser.",
    alt: `Projects by ${site.name}`,
  },
  "/projects/transient/": {
    eyebrow: "Java platformer",
    title: "Transient",
    subtitle: "A keyboard-only 2D platformer made from scratch in Java.",
    alt: "Transient, a 2D platformer",
  },
  "/experience/": {
    eyebrow: "Experience",
    title: "Where I’ve worked",
    subtitle:
      "My role on the Nexus team at Magnet Forensics, and my co-op terms at NCR and Magnet Forensics.",
    alt: `Experience of ${site.name}`,
  },
  "/about/": {
    eyebrow: "About",
    title: "Hi! I’m Austin.",
    subtitle:
      "Software Engineering at the University of Guelph, with an area of application in Mathematics.",
    alt: `About ${site.name}`,
  },
};

/** The OG card for each public route, keyed by route path. */
export function ogCards(): Record<string, OgCard> {
  const cards: Record<string, OgCard> = { ...staticCards };
  for (const entry of caseStudyEntries()) {
    if (!entry.href) continue;
    cards[entry.href] = {
      eyebrow: "Case study",
      title: entry.company,
      subtitle: [
        entry.team ?? entry.role,
        formatRange(entry.start, entry.end, entry.current),
      ]
        .filter(Boolean)
        .join(" · "),
      alt: `${entry.company} case study by ${site.name}`,
    };
  }
  return cards;
}

/** "/" -> "home.png", "/projects/transient/" -> "projects-transient.png". */
export function ogImageName(path: string): string {
  const slug = path.split("/").filter(Boolean).join("-");
  return `${slug || "home"}.png`;
}

export function ogImage(path: string) {
  const card = ogCards()[path];
  return {
    url: `/og/${ogImageName(path)}`,
    ...OG_SIZE,
    type: "image/png",
    alt: card?.alt ?? site.name,
  };
}

export interface PageSeo {
  /** Page title; the layout's template appends the site name. Omit for home. */
  title?: string;
  description: string;
  /** Route path with a trailing slash, e.g. "/projects/". */
  path: string;
}

/** Fields shared by every page's Open Graph block. */
export const baseOpenGraph = {
  type: "website",
  siteName: site.name,
  locale: "en_CA",
} as const;

export function pageMetadata({ title, description, path }: PageSeo): Metadata {
  const fullTitle = title ? `${title} · ${site.name}` : site.name;
  const image = ogImage(path);
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      ...baseOpenGraph,
      url: path,
      title: fullTitle,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  };
}

/**
 * schema.org Person for the owner, serialized for a <script> tag. Only
 * published facts: no email or dates.
 */
export function personJsonLd(): string {
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: absoluteUrl("/"),
    jobTitle: "Software Engineer",
    worksFor: { "@type": "Organization", name: "Magnet Forensics" },
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "University of Guelph",
    },
    sameAs: site.social.map((link) => link.href),
  };
  return JSON.stringify(person).replace(/</g, "\\u003c");
}
