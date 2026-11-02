import { SpriteRunner } from "@/components/sprite/SpriteRunner";
import { Container, Icon, Link } from "@/components/ui";
import { site } from "@/content/site";
import styles from "./SiteFooter.module.css";

export interface SiteFooterProps {
  /** Copyright year. Defaults to the build year. */
  year?: number;
}

/**
 * Social links, résumé, and copyright, with Transient's hero running along
 * the top edge.
 */
export function SiteFooter({
  year = new Date().getFullYear(),
}: SiteFooterProps) {
  return (
    <footer className={styles.footer}>
      <Container width="wide" className={styles.lane}>
        <SpriteRunner />
      </Container>
      <Container width="wide" className={styles.inner}>
        <p className={styles.copyright}>
          © {year} {site.name}
        </p>
        <ul role="list" className={styles.links} aria-label="Elsewhere">
          {site.social.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                variant="plain"
                rel="me"
                showExternalIcon={false}
                className={styles.link}
              >
                <Icon name={link.icon} className={styles.icon} />
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={site.resume.href}
              newTab
              variant="plain"
              showExternalIcon={false}
              className={styles.link}
            >
              <Icon name="document" className={styles.icon} />
              {site.resume.label}
            </Link>
          </li>
        </ul>
      </Container>
    </footer>
  );
}
