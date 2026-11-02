import NextLink from "next/link";
import type { AnchorHTMLAttributes, ReactNode, Ref } from "react";
import { resolveHref } from "./href";
import { VisuallyHidden } from "./VisuallyHidden";

export interface SmartLinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "target"
> {
  href: string;
  /** Force (true) or suppress (false) a new tab. Defaults to true for links to other websites. */
  newTab?: boolean;
  children?: ReactNode;
  ref?: Ref<HTMLAnchorElement>;
}

/**
 * Internal building block: picks next/link for in-app routes and a plain <a>
 * otherwise. New-tab links get rel="noopener noreferrer" and a screen-reader hint.
 */
export function SmartLink({
  href,
  newTab,
  download,
  rel,
  children,
  ...rest
}: SmartLinkProps) {
  const resolved = resolveHref(href, {
    newTab,
    download: download !== undefined && download !== false,
  });

  if (resolved.kind === "route") {
    return (
      <NextLink href={href} rel={rel} {...rest}>
        {children}
      </NextLink>
    );
  }

  const relValue = resolved.newTab
    ? Array.from(
        new Set([...(rel?.split(/\s+/) ?? []), "noopener", "noreferrer"]),
      )
        .filter(Boolean)
        .join(" ")
    : rel;

  return (
    <a
      href={href}
      target={resolved.newTab ? "_blank" : undefined}
      rel={relValue}
      download={download}
      {...rest}
    >
      {children}
      {resolved.newTab && (
        <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
      )}
    </a>
  );
}
