import styles from "./SkipLink.module.css";

export interface SkipLinkProps {
  /** id of the main content element. */
  targetId?: string;
}

/** First focusable element on the page; jumps keyboard users past the nav. */
export function SkipLink({ targetId = "main" }: SkipLinkProps) {
  return (
    <a href={`#${targetId}`} className={styles.skip}>
      Skip to content
    </a>
  );
}
