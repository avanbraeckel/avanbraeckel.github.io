import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";
import styles from "./Container.module.css";

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  /** narrow: reading measure (42rem). regular: 64rem. wide: 80rem. */
  width?: "narrow" | "regular" | "wide";
  /** Element to render. Defaults to div. */
  as?: ElementType;
  children?: ReactNode;
}

/** Centers content at a max width with responsive side gutters. */
export function Container({
  width = "regular",
  as: Component = "div",
  className,
  ...rest
}: ContainerProps) {
  return (
    <Component
      className={cx(styles.container, styles[width], className)}
      {...rest}
    />
  );
}
