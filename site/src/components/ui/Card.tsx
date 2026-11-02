import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { SmartLink } from "./SmartLink";
import { cx } from "./cx";
import styles from "./Card.module.css";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Makes the whole card a link (and interactive). */
  href?: string;
  /** Force (true) or suppress (false) a new tab for `href`. */
  newTab?: boolean;
  /** Hover lift and press feedback without a link (e.g. a card wrapping a button). */
  interactive?: boolean;
  /** Inner padding. "none" lets media bleed to the edges. */
  padding?: "none" | "regular" | "large";
  /** Element for a non-link card. Defaults to div. */
  as?: ElementType;
  children?: ReactNode;
}

/**
 * Surface for grouped content. With `href` the card is a single link that
 * lifts on hover and presses in on pointer-down.
 */
export function Card({
  href,
  newTab,
  interactive,
  padding = "regular",
  as: Component = "div",
  className,
  children,
  ...rest
}: CardProps) {
  const classes = cx(
    styles.card,
    styles[`padding-${padding}`],
    (href !== undefined || interactive) && styles.interactive,
    className,
  );

  if (href !== undefined) {
    return (
      <SmartLink href={href} newTab={newTab} className={classes} {...rest}>
        {children}
      </SmartLink>
    );
  }
  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  );
}
