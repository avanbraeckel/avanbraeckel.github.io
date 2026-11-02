import type { AllHTMLAttributes, ElementType, ReactNode } from "react";

export interface VisuallyHiddenProps extends Omit<
  AllHTMLAttributes<HTMLElement>,
  "as"
> {
  /** Element to render. Defaults to span. */
  as?: ElementType;
  /** Become visible when focused (for skip links). */
  focusable?: boolean;
  children?: ReactNode;
}

/** Hides content visually while keeping it available to assistive technology. */
export function VisuallyHidden({
  as: Component = "span",
  focusable = false,
  className,
  ...rest
}: VisuallyHiddenProps) {
  const base = focusable ? "visually-hidden-focusable" : "visually-hidden";
  return (
    <Component
      className={className ? `${base} ${className}` : base}
      {...rest}
    />
  );
}
