import { Picture } from "@/components/Picture";
import { Card, Icon } from "@/components/ui";
import { cx } from "@/components/ui/cx";
import type { Project } from "@/content/projects";
import styles from "./ProjectCard.module.css";

export interface ProjectCardProps {
  project: Project;
  /** Heading level for the title, to fit the surrounding outline. */
  headingLevel?: 2 | 3;
  /** Side-by-side cover and text on wide screens, for a full-row card. */
  wide?: boolean;
}

/** Linked card for a project: cover, kind and year, title, and summary. */
export function ProjectCard({
  project,
  headingLevel = 3,
  wide = false,
}: ProjectCardProps) {
  const Heading = `h${headingLevel}` as const;
  const meta = [project.kind, project.year].filter(Boolean).join(" · ");

  return (
    <Card
      href={project.href}
      padding="none"
      className={cx(styles.card, wide && styles.wide)}
    >
      <div className={styles.media}>
        {project.cover ? (
          <Picture
            id={project.cover}
            fill
            alt=""
            sizes={
              wide
                ? "(min-width: 48rem) 40rem, 100vw"
                : "(min-width: 48rem) 32rem, 100vw"
            }
            className={styles.cover}
          />
        ) : null}
      </div>
      <div className={styles.body}>
        <p className={styles.meta}>{meta}</p>
        <Heading className={styles.title}>
          {project.title}
          <Icon name="arrow" className={styles.arrow} />
        </Heading>
        <p className={styles.summary}>{project.summary}</p>
      </div>
    </Card>
  );
}
