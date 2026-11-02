import type { MDXContent } from "mdx/types";
import MagnetAxiomCyber from "./magnet-axiom-cyber.mdx";
import MagnetReview from "./magnet-review.mdx";
import Ncr from "./ncr.mdx";

/**
 * Case-study bodies by experience slug. Every entry in `experience.ts` with an
 * `href` needs one (enforced by the content tests).
 */
export const caseStudies: Record<string, MDXContent> = {
  ncr: Ncr,
  "magnet-review": MagnetReview,
  "magnet-axiom-cyber": MagnetAxiomCyber,
};

/** One-line descriptions for metadata and link previews. */
export const caseStudyDescriptions: Record<string, string> = {
  ncr: "My eight remote months at NCR, fixing bugs in a bank’s transaction API, building internal tools, and writing REST APIs for a new ATM project.",
  "magnet-review":
    "My summer on Magnet REVIEW, working in React and C# on a browser app for reviewing digital evidence.",
  "magnet-axiom-cyber":
    "My eight months on the Remote Acquire team for Magnet AXIOM Cyber, including a macOS spike, certificate selection, and Scrum on a distributed team.",
};
