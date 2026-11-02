"use client";

import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Card, Chip, Icon } from "@/components/ui";
import { cx } from "@/components/ui/cx";
import type { ExperienceEntry } from "@/content/experience";
import { CoverArt } from "./CoverArt";
import { formatRange, formatSpan, isoMonth } from "./format";
import styles from "./Timeline.module.css";

/** Where on screen the progress line's leading edge sits (fraction of height). */
const READ_LINE = 0.62;

export interface TimelineProps {
  /** Entries in display order (use `sortedExperience()`). */
  entries: ExperienceEntry[];
}

/**
 * Vertical timeline. A rail runs down the left; its fill tracks scroll 1:1
 * and each node lights up as the fill reaches it.
 */
export function Timeline({ entries }: TimelineProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: [`start ${READ_LINE * 100}%`, `end ${READ_LINE * 100}%`],
  });

  // Node positions as fractions of the list height, measured on layout.
  const stops = useRef<number[]>([]);
  const [reached, setReached] = useState(0);

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const height = list.offsetHeight || 1;
    stops.current = Array.from(
      list.querySelectorAll<HTMLElement>("[data-node]"),
      (node) => {
        const item = node.closest("li") as HTMLElement | null;
        return ((item?.offsetTop ?? 0) + node.offsetTop) / height;
      },
    );
  }, []);

  const update = useCallback((progress: number) => {
    const count = stops.current.filter(
      (stop) => stop <= progress + 0.001,
    ).length;
    setReached((previous) => (previous === count ? previous : count));
  }, []);

  useEffect(() => {
    measure();
    update(scrollYProgress.get());
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      measure();
      update(scrollYProgress.get());
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, [measure, update, scrollYProgress]);

  useMotionValueEvent(scrollYProgress, "change", update);

  return (
    <div className={styles.timeline}>
      <div className={styles.rail} aria-hidden="true">
        <motion.div
          className={styles.fill}
          style={{ scaleY: scrollYProgress }}
        />
      </div>
      <ol ref={listRef} className={styles.list}>
        {entries.map((entry, index) => (
          <TimelineItem
            key={entry.slug}
            entry={entry}
            reached={index < reached}
            priority={index === 0}
          />
        ))}
      </ol>
    </div>
  );
}

interface TimelineItemProps {
  entry: ExperienceEntry;
  reached: boolean;
  priority: boolean;
}

function TimelineItem({ entry, reached, priority }: TimelineItemProps) {
  const range = formatRange(entry.start, entry.end, entry.current);
  const dateTime = isoMonth(entry.start);
  const span = formatSpan(entry.start, entry.end);
  const headingId = `timeline-${entry.slug}`;
  const isEducation = entry.kind === "education";
  const meta = [
    entry.term ?? (isEducation ? "Education" : null),
    entry.location,
  ]
    .filter(Boolean)
    .join(" · ");

  const body = (
    <div
      className={cx(
        styles.card,
        !entry.cover && !entry.logo && styles.textOnly,
      )}
    >
      {!isEducation && (
        <CoverArt
          entry={entry}
          variant="card"
          sizes="(min-width: 768px) 18rem, calc(100vw - 4rem)"
          priority={priority}
          className={styles.art}
        />
      )}
      <div className={styles.text}>
        {meta && <p className={cx("t-footnote", styles.meta)}>{meta}</p>}
        <h2 id={headingId} className={cx("t-title3", styles.company)}>
          {entry.company}
        </h2>
        <p className={cx("t-headline", styles.role)}>{entry.role}</p>
        {entry.team && (
          <p className={cx("t-callout", styles.team)}>{entry.team}</p>
        )}
        <p className={cx("t-callout", "t-pretty", styles.summary)}>
          {entry.summary}
        </p>
        {entry.stack.length > 0 && (
          <ul className={styles.stack} aria-label="Stack">
            {entry.stack.map((item) => (
              <li key={item}>
                <Chip size="small">{item}</Chip>
              </li>
            ))}
          </ul>
        )}
        {entry.href && (
          <span className={cx("t-callout", styles.cta)}>
            Read the case study
            <Icon name="arrow" className={styles.ctaIcon} />
          </span>
        )}
      </div>
    </div>
  );

  return (
    <li
      className={styles.item}
      data-reached={reached || undefined}
      data-slug={entry.slug}
    >
      <div className={styles.when}>
        <span className={styles.node} data-node aria-hidden="true" />
        {range && (
          <p className={cx("t-footnote", styles.date)}>
            {dateTime ? <time dateTime={dateTime}>{range}</time> : range}
            {span && <span className={styles.span}>{span}</span>}
          </p>
        )}
      </div>
      {entry.href ? (
        <Card href={entry.href} padding="none" className={styles.surface}>
          {body}
        </Card>
      ) : (
        <Card
          as="article"
          padding="none"
          className={styles.surface}
          aria-labelledby={headingId}
        >
          {body}
        </Card>
      )}
    </li>
  );
}
