import { Icon } from "./Icon";
import { SmartLink, type SmartLinkProps } from "./SmartLink";
import { resolveHref } from "./href";
import { cx } from "./cx";
import styles from "./Link.module.css";

export interface LinkProps extends SmartLinkProps {
  /**
   * inline: accent color with an underline, for links in running text.
   * plain: inherits color, underlines on hover (nav, footers).
   */
  variant?: "inline" | "plain";
  /** Show the external-link icon on new-tab links. Defaults to true. */
  showExternalIcon?: boolean;
}

/**
 * Text link. In-app routes use next/link; other origins open in a new tab
 * with rel="noopener noreferrer" and an external icon.
 */
export function Link({
  variant = "inline",
  showExternalIcon = true,
  className,
  children,
  href,
  newTab,
  download,
  ...rest
}: LinkProps) {
  const { newTab: opensNewTab } = resolveHref(href, {
    newTab,
    download: download !== undefined && download !== false,
  });
  return (
    <SmartLink
      href={href}
      newTab={newTab}
      download={download}
      className={cx(styles.link, styles[variant], className)}
      {...rest}
    >
      {children}
      {opensNewTab && showExternalIcon && (
        <Icon name="external" className={styles.icon} />
      )}
    </SmartLink>
  );
}
