import type { Metadata } from "next";
import { Timeline } from "@/components/experience/Timeline";
import { Section } from "@/components/ui";
import { sortedExperience } from "@/content/experience";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Experience",
  description:
    "Austin Van Braeckel is a Software Engineer on the Nexus team at Magnet Forensics. During school, he did co-op terms at NCR and Magnet Forensics, with a write-up for each one.",
  path: "/experience/",
});

export default function ExperiencePage() {
  return (
    <Section
      headingLevel={1}
      title="Where I’ve worked"
      description="These days I’m a Software Engineer on the Nexus team at Magnet Forensics. During school, I did three co-op placements at two companies, from the API behind a bank’s transactions at NCR to digital forensics software at Magnet Forensics. Each co-op role links to a write-up about what I worked on and what I learned along the way."
      width="regular"
    >
      <Timeline entries={sortedExperience()} />
    </Section>
  );
}
