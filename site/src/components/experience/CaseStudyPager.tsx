import { Card, Container, Icon } from "@/components/ui";
import { cx } from "@/components/ui/cx";
import type { ExperienceEntry } from "@/content/experience";
import { formatRange } from "./format";
import styles from "./CaseStudy.module.css";

export interface CaseStudyPagerProps {
  /** The more recent role (above this one on the timeline). */
  newer?: ExperienceEntry;
  /** The earlier role (below this one on the timeline). */
  older?: ExperienceEntry;
}

/** Previous/next navigation between case studies, in timeline order. */
export function CaseStudyPager({ newer, older }: CaseStudyPagerProps) {
  if (!newer && !older) return null;
  return (
    <Container
      width="regular"
      as="nav"
      aria-label="More case studies"
      className={styles.pager}
    >
      {older?.href ? (
        <PagerCard entry={older} direction="older" />
      ) : (
        <span aria-hidden="true" />
      )}
      {newer?.href ? (
        <PagerCard entry={newer} direction="newer" />
      ) : (
        <span aria-hidden="true" />
      )}
    </Container>
  );
}

function PagerCard({
  entry,
  direction,
}: {
  entry: ExperienceEntry;
  direction: "older" | "newer";
}) {
  const label = direction === "older" ? "Earlier" : "Later";
  const range = formatRange(entry.start, entry.end);
  return (
    <Card
      href={entry.href!}
      rel={direction === "older" ? "prev" : "next"}
      className={cx(styles.pagerCard, styles[direction])}
    >
      <span className={cx("t-footnote", styles.pagerLabel)}>
        {direction === "older" && (
          <Icon name="arrow" className={styles.backIcon} />
        )}
        {label}
        {direction === "newer" && <Icon name="arrow" />}
      </span>
      <span className={cx("t-headline", styles.pagerTitle)}>
        {entry.company}
      </span>
      <span className={cx("t-footnote", styles.muted)}>
        {entry.team ?? entry.role}
        {range && (
          <>
            {" · "}
            {/* Keep the date range on one line. */}
            <span className={styles.nowrap}>{range}</span>
          </>
        )}
      </span>
    </Card>
  );
}
