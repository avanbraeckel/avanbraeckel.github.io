import type { Metadata } from "next";
import { Container, Link } from "@/components/ui";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { projects } from "@/content/projects";
import styles from "./projects.module.css";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Projects",
  description:
    "Personal projects by Austin Van Braeckel, including Transient, a Java platformer you can play right in your browser.",
  path: "/projects/",
});

export default function ProjectsPage() {
  return (
    <Container className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Projects</h1>
        <p className={styles.lead}>
          These are projects I’ve made on my own time. To see what I worked on
          during my co-op terms, check out{" "}
          <Link href="/experience/">Experience</Link>, where I wrote about each
          role.
        </p>
      </header>
      <ProjectGrid projects={projects} headingLevel={2} />
    </Container>
  );
}
