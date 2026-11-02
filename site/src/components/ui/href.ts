/**
 * Decide how an href should be rendered.
 *
 * - "route": an in-app page; rendered with next/link for client navigation.
 * - "anchor": everything else (other origins, mailto/tel, hash links, static
 *   files such as /resume.pdf, downloads, new tabs); rendered as a plain <a>.
 */
export interface ResolvedHref {
  kind: "route" | "anchor";
  /** Points to another origin (or a non-http scheme such as mailto:). */
  external: boolean;
  /** Opens in a new browsing context (target="_blank"). */
  newTab: boolean;
}

export interface ResolveHrefOptions {
  /** Force (true) or suppress (false) opening in a new tab. Defaults to true for http(s) links to other origins. */
  newTab?: boolean;
  /** The link downloads a file. */
  download?: boolean;
}

const SCHEME = /^[a-z][a-z\d+\-.]*:/i;
const FILE_EXTENSION = /\.[a-z\d]{2,5}$/i;

export function isExternalHref(href: string): boolean {
  return href.startsWith("//") || SCHEME.test(href);
}

export function resolveHref(
  href: string,
  { newTab, download = false }: ResolveHrefOptions = {},
): ResolvedHref {
  const external = isExternalHref(href);
  const isWeb = /^(https?:)?\/\//i.test(href);
  const opensNewTab = newTab ?? (external && isWeb);
  const path = href.split(/[?#]/)[0];
  const isFile = FILE_EXTENSION.test(path);
  const isHashOnly = href.startsWith("#");

  const route =
    !external && !opensNewTab && !download && !isFile && !isHashOnly;
  return { kind: route ? "route" : "anchor", external, newTab: opensNewTab };
}
