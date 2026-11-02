"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion } from "motion/react";
import { Button, Container } from "@/components/ui";
import { cx } from "@/components/ui/cx";
import { site } from "@/content/site";
import { useMotionPreference } from "@/design/motion";
import { MotionToggle } from "./MotionToggle";
import { ThemeToggle } from "./ThemeToggle";
import { NavMenu } from "./NavSheet";
import { ariaCurrent } from "./navigation";
import styles from "./SiteNav.module.css";

/**
 * Fixed, translucent top bar with an always-visible material and scroll-edge
 * fade. Desktop shows inline links with a
 * shared active indicator; below 768px a menu button opens the nav sheet.
 */
export function SiteNav() {
  const pathname = usePathname();
  const { reduced, spring } = useMotionPreference();

  return (
    <header
      className={styles.bar}
      // Global name (CSS Modules would hash it): the bar stays still and
      // live above the cross-fading page. See shell.css.
      style={{ viewTransitionName: "site-nav" }}
    >
      <div className={styles.edge} aria-hidden="true" />
      <Container width="wide" className={styles.inner}>
        <NextLink
          href="/"
          className={styles.wordmark}
          aria-current={pathname === "/" ? "page" : undefined}
        >
          {site.name}
        </NextLink>

        <nav aria-label="Main" className={styles.desktop}>
          <LayoutGroup id="site-nav">
            <ul role="list" className={styles.links}>
              {site.nav.map((item) => {
                const current = ariaCurrent(pathname, item.href);
                return (
                  <li key={item.href}>
                    <NextLink
                      href={item.href}
                      aria-current={current}
                      className={cx(styles.link, current && styles.active)}
                    >
                      {current && (
                        <motion.span
                          className={styles.indicator}
                          layoutId={reduced ? undefined : "nav-indicator"}
                          transition={spring.default}
                          aria-hidden="true"
                        />
                      )}
                      <span className={styles.label}>{item.label}</span>
                    </NextLink>
                  </li>
                );
              })}
            </ul>
          </LayoutGroup>
          <div className={styles.toggles}>
            <MotionToggle />
            <ThemeToggle />
          </div>
          <Button
            href={site.resume.href}
            newTab
            variant="tinted"
            size="small"
            icon="document"
            className={styles.resume}
          >
            {site.resume.label}
          </Button>
        </nav>

        <div className={styles.mobile}>
          <NavMenu pathname={pathname} />
        </div>
      </Container>
    </header>
  );
}
