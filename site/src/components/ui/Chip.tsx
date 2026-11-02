import type { HTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { cx } from "./cx";
import styles from "./Chip.module.css";

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  /** neutral: tags such as a tech stack. accent: highlights. */
  tone?: "neutral" | "accent";
  size?: "small" | "regular";
  icon?: IconName;
  children: ReactNode;
}

/** Small non-interactive label (stack items, tags, status). */
export function Chip({
  tone = "neutral",
  size = "regular",
  icon,
  className,
  children,
  ...rest
}: ChipProps) {
  return (
    <span
      className={cx(styles.chip, styles[tone], styles[size], className)}
      {...rest}
    >
      {icon && <Icon name={icon} className={styles.icon} />}
      {children}
    </span>
  );
}
