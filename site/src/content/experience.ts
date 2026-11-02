import type { MediaId } from "@/media";

/**
 * Work history and education. Every fact here comes from the legacy co-op
 * reports (`ncr.html`, `magnet1.html`, `magnet2.html`), `index.html`, or the
 * owner directly (the current role). Do not add dates, titles, or metrics
 * that are not published there.
 */
export type ExperienceEntry = {
  slug: string;
  kind: "work" | "education";
  company: string;
  role: string;
  team?: string;
  /** Omitted when not published. */
  location?: string;
  /** 'YYYY-MM', or null when the date is not published. */
  start: string | null;
  /** 'YYYY-MM', or null when ongoing or unknown. */
  end: string | null;
  /** The role Austin holds now. Sorts first and reads as "Now"/"Present". */
  current?: boolean;
  summary: string;
  stack: string[];
  cover?: MediaId;
  logo?: MediaId;
  /** Case study route, with a trailing slash. */
  href?: string;
  /** Short label for the term, e.g. "Co-op terms 1–2". */
  term?: string;
  /** Brand tint (CSS color) behind the logo plate when there is no cover photo. */
  accent?: string;
};

export const experience: ExperienceEntry[] = [
  {
    slug: "magnet-nexus",
    kind: "work",
    company: "Magnet Forensics",
    role: "Software Engineer",
    team: "Magnet Nexus",
    location: "Waterloo, ON",
    start: "2024-07",
    end: null,
    current: true,
    summary:
      "I’m a full-stack Software Engineer on the Nexus team, working on Magnet Nexus. I work with C# and .NET on the backend, TypeScript and React on the frontend, and AWS services like DynamoDB and Lambda. Frontend work is what I get most excited about!",
    stack: ["C#", ".NET", "TypeScript", "React", "AWS", "DynamoDB", "Lambda"],
    logo: "logo-magnet-forensics",
    accent: "#2b7bd3",
  },
  {
    slug: "magnet-axiom-cyber",
    kind: "work",
    company: "Magnet Forensics",
    role: "Software Developer Co-op",
    team: "Remote Acquire, Magnet AXIOM Cyber",
    location: "Ottawa, ON (remote)",
    start: "2023-01",
    end: "2023-08",
    term: "Co-op terms 4–5",
    summary:
      "I spent eight months on Remote Acquire, the part of AXIOM Cyber that collects evidence from other machines through a deployed agent. I worked on two medium-sized features and one very large one in C#, and did the macOS spike that the big one depended on.",
    stack: [
      ".NET",
      "C#",
      "Workflows",
      "Visual Studio 2022",
      "Test Studio",
      "Jira",
      "Miro",
    ],
    cover: "magnet-ottawa-entrance",
    logo: "logo-magnet-forensics",
    accent: "#2b7bd3",
    href: "/experience/magnet-axiom-cyber/",
  },
  {
    slug: "magnet-review",
    kind: "work",
    company: "Magnet Forensics",
    role: "Software Developer Co-op",
    team: "Magnet REVIEW",
    location: "Waterloo, ON (mostly remote)",
    start: "2022-05",
    end: "2022-08",
    term: "Co-op term 3",
    summary:
      "I spent the summer on Magnet REVIEW, a browser app that investigators use to search, tag, and comment on digital evidence. I got to work on both ends of it, with React for the UI and C# and .NET microservices on the backend.",
    stack: [
      "React",
      "JavaScript",
      "Jest",
      "C#",
      ".NET",
      "MySQL",
      "Kubernetes",
      "Azure DevOps",
    ],
    cover: "magnet-waterloo-exterior",
    logo: "logo-magnet-forensics",
    accent: "#2b7bd3",
    href: "/experience/magnet-review/",
  },
  {
    slug: "ncr",
    kind: "work",
    company: "NCR Corporation",
    role: "Software Engineering Intern",
    team: "Channel Services Platform Foundation",
    location: "Waterloo, ON (remote)",
    start: "2021-05",
    end: "2021-12",
    term: "Co-op terms 1–2",
    summary:
      "My first co-op! I spent eight remote months in NCR’s banking software group, first on a team investigating and fixing bugs in a transaction API written in NCR’s own language, and then building new REST APIs on a Scrum team.",
    stack: [
      "Java",
      "API Toolkit",
      "Cucumber",
      "Docker",
      "Kubernetes",
      "Jenkins",
      "Python",
      "Flask",
    ],
    logo: "logo-ncr",
    accent: "#54b948",
    href: "/experience/ncr/",
  },
  {
    slug: "guelph",
    kind: "education",
    company: "University of Guelph",
    role: "B.Eng., Software Engineering (Co-op)",
    team: "Area of application: Mathematics",
    location: "Guelph, ON",
    start: null,
    end: null,
    summary:
      "I studied Software Engineering (Co-op) with an area of application in Mathematics. All of the co-op terms above were part of the program.",
    stack: [],
  },
];

function monthIndex(value: string): number {
  const [year, month] = value.split("-").map(Number);
  return year * 12 + (month - 1);
}

/**
 * The current role first, then reverse-chronological by start date (latest
 * first). Other undated entries (education without published dates) go last.
 */
export function sortedExperience(): ExperienceEntry[] {
  return [...experience].sort((a, b) => {
    if (a.current !== b.current) return a.current ? -1 : 1;
    if (!a.start && !b.start) return 0;
    if (!a.start) return 1;
    if (!b.start) return -1;
    return monthIndex(b.start) - monthIndex(a.start);
  });
}

export function getExperience(slug: string): ExperienceEntry | undefined {
  return experience.find((entry) => entry.slug === slug);
}

/** Entries that have a case study, in timeline order. */
export function caseStudyEntries(): ExperienceEntry[] {
  return sortedExperience().filter((entry) => entry.href);
}
