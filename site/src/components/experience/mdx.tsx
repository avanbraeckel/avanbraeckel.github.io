import type { MDXComponents } from "mdx/types";
import type { ComponentPropsWithoutRef } from "react";
import { Link } from "@/components/ui";
import { cx } from "@/components/ui/cx";
import { Figure, FigureRow } from "./Figure";
import styles from "./Prose.module.css";

/** Prose element styles and the components case-study MDX can use. */
export const proseComponents: MDXComponents = {
  h2: ({ className, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2 className={cx("t-title2", styles.h2, className)} {...props} />
  ),
  h3: ({ className, ...props }: ComponentPropsWithoutRef<"h3">) => (
    <h3 className={cx("t-title3", styles.h3, className)} {...props} />
  ),
  p: ({ className, ...props }: ComponentPropsWithoutRef<"p">) => (
    <p className={cx(styles.p, className)} {...props} />
  ),
  ul: ({ className, ...props }: ComponentPropsWithoutRef<"ul">) => (
    <ul className={cx(styles.ul, className)} {...props} />
  ),
  li: ({ className, ...props }: ComponentPropsWithoutRef<"li">) => (
    <li className={cx(styles.li, className)} {...props} />
  ),
  a: ({ href = "", children }: ComponentPropsWithoutRef<"a">) => (
    <Link href={href}>{children}</Link>
  ),
  Figure,
  FigureRow,
};

export const proseClassName = styles.prose;
