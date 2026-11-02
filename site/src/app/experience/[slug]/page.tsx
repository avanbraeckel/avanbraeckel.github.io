import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyHero } from "@/components/experience/CaseStudyHero";
import { CaseStudyPager } from "@/components/experience/CaseStudyPager";
import { proseClassName } from "@/components/experience/mdx";
import { Container } from "@/components/ui";
import { caseStudies, caseStudyDescriptions } from "@/content/case-studies";
import { caseStudyEntries, getExperience } from "@/content/experience";
import styles from "@/components/experience/CaseStudy.module.css";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return caseStudyEntries().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/experience/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const entry = getExperience(slug);
  if (!entry) return {};
  return pageMetadata({
    title: `${entry.company}: ${entry.team ?? entry.role}`,
    description: caseStudyDescriptions[slug] ?? entry.summary,
    path: `/experience/${slug}/`,
  });
}

export default async function CaseStudyPage({
  params,
}: PageProps<"/experience/[slug]">) {
  const { slug } = await params;
  const entry = getExperience(slug);
  const Body = caseStudies[slug];
  if (!entry || !Body) notFound();

  const order = caseStudyEntries();
  const index = order.findIndex((item) => item.slug === slug);

  return (
    <article>
      <CaseStudyHero entry={entry} />
      <Container width="wide" className={styles.body}>
        <div className={proseClassName}>
          <Body />
        </div>
      </Container>
      <CaseStudyPager newer={order[index - 1]} older={order[index + 1]} />
    </article>
  );
}
