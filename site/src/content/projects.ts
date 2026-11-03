import type { MediaId } from "@/media";

/**
 * Personal projects shown on /projects. The home page features Transient.
 *
 * Facts come from the legacy pages (`transient.html`) and from
 * the Transient user manual shipped inside the game's download, plus the
 * owner directly (it was the owner’s 2019 Grade 12 final project). Do not add
 * dates, metrics, or collaborators that are not published there.
 */
export interface Project {
  slug: string;
  title: string;
  /** What it is, in a few words ("2D platformer"). */
  kind: string;
  /** One or two sentences for cards. */
  summary: string;
  /** Year it was made, when published. */
  year?: number;
  /** In-app route, with a trailing slash. */
  href: string;
  /** Cover image from the media manifest. Projects without one use artwork. */
  cover?: MediaId;
}

/** The game download (a later step puts the zip in public/transient/). */
export const TRANSIENT_DOWNLOAD_HREF = "/transient/TRANSIENT-DISTRIBUTABLE.zip";

export const projects: Project[] = [
  {
    slug: "transient",
    title: "Transient",
    kind: "2D platformer",
    summary:
      "A keyboard-only 2D platformer made from scratch in Java, with a bow, a three-tier sword, a dash that makes you invulnerable, and a timer that never stops.",
    year: 2019,
    href: "/projects/transient/",
    cover: "transient-screenshot",
  },
];

export function getProject(slug: string): Project {
  const project = projects.find((p) => p.slug === slug);
  if (!project) throw new Error(`Unknown project: ${slug}`);
  return project;
}
