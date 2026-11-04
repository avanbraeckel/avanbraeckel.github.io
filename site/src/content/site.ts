import type { IconName } from "@/components/ui";

/**
 * Site-wide facts about the owner and the navigation. Single source of truth
 * for the nav, the mobile sheet, the footer, and metadata.
 *
 * Unknown facts are `null`; the UI hides anything that is missing.
 */

export interface NavItem {
  label: string;
  /** In-app route, with a trailing slash (next.config sets trailingSlash). */
  href: string;
}

export interface SocialLink {
  label: string;
  href: string;
  icon: IconName;
}

export interface SiteConfig {
  name: string;
  /** Canonical origin, used as metadataBase. */
  url: string;
  /** One-line positioning statement. Owner input needed. */
  tagline: string | null;
  /** Public contact email. Owner input needed. */
  email: string | null;
  /** Hidden everywhere while null (the owner is updating the PDF). */
  resume: { label: string; href: string } | null;
  nav: readonly NavItem[];
  social: readonly SocialLink[];
}

export const site: SiteConfig = {
  name: "Austin Van Braeckel",
  url: "https://avanbraeckel.github.io",
  tagline: null,
  email: null,
  // Hidden until the owner uploads an updated PDF; restore with
  // { label: "Résumé", href: "/resume.pdf" }.
  resume: null,
  nav: [
    { label: "Projects", href: "/projects/" },
    { label: "Experience", href: "/experience/" },
    { label: "About", href: "/about/" },
  ],
  social: [
    {
      label: "GitHub",
      href: "https://github.com/avanbraeckel",
      icon: "github",
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/austin-van-braeckel-1002b1219/",
      icon: "linkedin",
    },
  ],
};
