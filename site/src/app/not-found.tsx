import type { Metadata } from "next";
import { PixelSprite } from "@/components/sprite/PixelSprite";
import { Button, Container } from "@/components/ui";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "Sorry, this page doesn’t exist. Try the home page, Projects, or Experience.",
};

// Rendered inside the layout's <main>, so no landmark here.
export default function NotFound() {
  return (
    <Container width="narrow" className={styles.page} data-runner-parked="">
      {/* Transient's hero, stuck facing a slime. The footer runner is parked
          on this page (see the CSS) so only one sprite moves at a time. */}
      <div className={styles.scene} aria-hidden="true">
        <PixelSprite sprite="player-idle" scale={3} />
        <PixelSprite sprite="slime" scale={3} playing={false} />
      </div>
      <p className={styles.code} aria-hidden="true">
        404
      </p>
      <h1 className={styles.title}>Page not found</h1>
      <p className={styles.lead}>
        This level doesn’t exist! The link might be old, or the page may have
        moved when I rebuilt the site. Here are some good places to start:
      </p>
      <div className={styles.actions}>
        <Button href="/" size="large">
          Home
        </Button>
        <Button href="/projects/" size="large" variant="tinted">
          Projects
        </Button>
        <Button href="/experience/" size="large" variant="tinted">
          Experience
        </Button>
      </div>
    </Container>
  );
}
