import { Picture } from "@/components/Picture";
import { PixelSprite } from "@/components/sprite/PixelSprite";
import { Container, Link } from "@/components/ui";
import { SmartLink } from "@/components/ui/SmartLink";
import { getProject } from "@/content/projects";
import styles from "./TransientFeature.module.css";

/** Transient, the one project, presented once on the home page. */
export function TransientFeature() {
  const transient = getProject("transient");

  return (
    <section className={styles.feature} aria-labelledby="transient-title">
      <Container width="wide" className={styles.inner}>
        {transient.cover && (
          // The text link below is the accessible route; this is a pointer shortcut.
          <SmartLink
            href={transient.href}
            className={styles.media}
            tabIndex={-1}
            aria-hidden="true"
          >
            <Picture
              id={transient.cover}
              fill
              alt=""
              sizes="(min-width: 52rem) 40rem, 100vw"
              className={styles.cover}
            />
          </SmartLink>
        )}
        <div className={styles.text}>
          <h2 id="transient-title" className={styles.title}>
            I even made my own game!
          </h2>
          <p>
            Transient is a 2D platformer I made from scratch in Java as my
            Grade&nbsp;12 final project, back before AI coding tools were a
            thing. It isn’t easy, but you can play it right here in your
            browser.
          </p>
          <p>
            <Link href={transient.href} className={styles.cta}>
              <PixelSprite
                sprite="portal"
                scale={1}
                className={styles.portal}
              />
              Play Transient
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
