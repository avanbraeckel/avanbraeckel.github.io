import { Picture } from "@/components/Picture";
import { Button, Container, Link } from "@/components/ui";
import { site } from "@/content/site";
import styles from "./Hero.module.css";

/** Used until the owner supplies `site.tagline`. */
const DEFAULT_POSITIONING =
  "These days I’m a Software Engineer at Magnet Forensics. I love tackling cool problems, trying out new tech, and building sleek, usable UIs.";

/**
 * "Hi! I’m" above the name, with the first name on its own line and the
 * surname on the next, next to the portrait. One primary action; everything
 * else is a plain link.
 */
export function Hero() {
  const [first, ...rest] = site.name.split(" ");

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <Container width="wide" className={styles.inner}>
        <div className={styles.portrait}>
          <Picture
            id="portrait"
            priority
            sizes="(min-width: 52rem) 22rem, 6rem"
            imgClassName={styles.portraitImg}
          />
        </div>
        <div className={styles.text}>
          <h1 id="hero-title" className={styles.title}>
            <span className={styles.hello}>Hi! I’m</span>{" "}
            <span className={styles.name}>
              <span className={styles.line}>{first}</span>{" "}
              <span className={styles.line}>{rest.join(" ")}</span>
            </span>
          </h1>
          <p className={styles.lead}>{site.tagline ?? DEFAULT_POSITIONING}</p>
          <div className={styles.actions}>
            <Button href="/experience/" size="large" trailingIcon="arrow">
              See my experience
            </Button>
            <Link href="/about/" className={styles.textLink}>
              More about me
            </Link>
            <Link href={site.resume.href} newTab className={styles.textLink}>
              {site.resume.label}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
