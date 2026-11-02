import { useId, type HTMLAttributes, type ReactNode } from "react";
import { Container, type ContainerProps } from "./Container";
import { cx } from "./cx";
import styles from "./Section.module.css";

export interface SectionProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "title"
> {
  title: ReactNode;
  /** Supporting sentence under the title. */
  description?: ReactNode;
  /** Heading level for the title. Defaults to 2. */
  headingLevel?: 1 | 2 | 3;
  align?: "start" | "center";
  /** Container width. */
  width?: ContainerProps["width"];
  children?: ReactNode;
}

/**
 * Page section: a labelled <section> with a title, an optional description,
 * and content, inside a Container.
 */
export function Section({
  title,
  description,
  headingLevel = 2,
  align = "start",
  width = "regular",
  className,
  children,
  id,
  ...rest
}: SectionProps) {
  const generatedId = useId();
  const headingId = `${id ?? generatedId}-title`;
  const Heading = `h${headingLevel}` as const;
  const titleClass = headingLevel === 1 ? "t-title1" : "t-title2";

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cx(styles.section, className)}
      {...rest}
    >
      <Container width={width}>
        <header className={cx(styles.header, styles[align])}>
          <Heading id={headingId} className={cx(titleClass, styles.title)}>
            {title}
          </Heading>
          {description && (
            <p className={cx("t-body", "t-pretty", styles.description)}>
              {description}
            </p>
          )}
        </header>
        {children && <div className={styles.content}>{children}</div>}
      </Container>
    </section>
  );
}
