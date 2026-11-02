import { Container, Link } from "@/components/ui";
import styles from "./ExperienceNote.module.css";

/** One line pointing to the full timeline, instead of repeating it here. */
export function ExperienceNote() {
  return (
    <section className={styles.note} aria-labelledby="experience-note-title">
      <Container width="wide">
        <div className={styles.inner}>
          <h2 id="experience-note-title" className={styles.title}>
            Where I’ve worked
          </h2>
          <p className={styles.body}>
            Besides my role on the Nexus team, I did three co-op terms during
            school, at NCR and at Magnet Forensics, and I wrote about each one.{" "}
            <Link href="/experience/">See the full timeline</Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
