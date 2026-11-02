import { Chip, Container, Icon } from "@/components/ui";
import { cx } from "@/components/ui/cx";
import NextLink from "next/link";
import type { ExperienceEntry } from "@/content/experience";
import { CoverArt } from "./CoverArt";
import { formatRange, formatSpan, isoMonth } from "./format";
import styles from "./CaseStudy.module.css";

/** Case-study header: company, role, facts, stack, and the cover art. */
export function CaseStudyHero({ entry }: { entry: ExperienceEntry }) {
  const range = formatRange(entry.start, entry.end);
  const span = formatSpan(entry.start, entry.end);

  return (
    <header className={styles.hero}>
      <Container width="regular">
        <NextLink href="/experience/" className={cx("t-callout", styles.back)}>
          <Icon name="arrow" className={styles.backIcon} />
          Experience
        </NextLink>
        {entry.term && (
          <p className={cx("t-eyebrow", styles.eyebrow)}>{entry.term}</p>
        )}
        <h1 className={cx("t-display", styles.title)}>{entry.company}</h1>
        <p className={cx("t-title3", styles.role)}>{entry.role}</p>

        <dl className={styles.facts}>
          {range && (
            <div>
              <dt className="t-footnote">When</dt>
              <dd className="t-callout">
                <time dateTime={isoMonth(entry.start)}>{range}</time>
                {span && <span className={styles.muted}> · {span}</span>}
              </dd>
            </div>
          )}
          {entry.location && (
            <div>
              <dt className="t-footnote">Where</dt>
              <dd className="t-callout">{entry.location}</dd>
            </div>
          )}
          {entry.team && (
            <div>
              <dt className="t-footnote">Team</dt>
              <dd className="t-callout">{entry.team}</dd>
            </div>
          )}
        </dl>

        {entry.stack.length > 0 && (
          <ul className={styles.stack} aria-label="Stack">
            {entry.stack.map((item) => (
              <li key={item}>
                <Chip>{item}</Chip>
              </li>
            ))}
          </ul>
        )}
      </Container>

      <Container width="wide" className={styles.coverWrap}>
        <CoverArt
          entry={entry}
          variant="hero"
          priority
          sizes="(min-width: 80rem) 80rem, 100vw"
        />
      </Container>
    </header>
  );
}
