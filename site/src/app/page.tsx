import type { Metadata } from "next";
import { ExperienceNote, Hero, TransientFeature } from "@/components/home";
import { DEFAULT_DESCRIPTION, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({ description: DEFAULT_DESCRIPTION, path: "/" }),
  title: { absolute: "Austin Van Braeckel · Software engineer" },
};

export default function Home() {
  return (
    <>
      <Hero />
      <TransientFeature />
      <ExperienceNote />
    </>
  );
}
