import type { Project } from "@/content/projects";
import { ProjectCard } from "./ProjectCard";
import styles from "./ProjectGrid.module.css";

export interface ProjectGridProps {
  projects: Project[];
  headingLevel?: 2 | 3;
}

export function ProjectGrid({ projects, headingLevel }: ProjectGridProps) {
  // A lone project gets the full row with a side-by-side layout instead of a
  // half-width card next to empty space.
  const single = projects.length === 1;
  return (
    <ul role="list" className={single ? styles.single : styles.grid}>
      {projects.map((project) => (
        <li key={project.slug}>
          <ProjectCard
            project={project}
            headingLevel={headingLevel}
            wide={single}
          />
        </li>
      ))}
    </ul>
  );
}
