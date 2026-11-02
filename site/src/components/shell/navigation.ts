/** Strip a trailing slash so "/projects" and "/projects/" compare equal ("/" stays "/"). */
function normalize(path: string): string {
  const clean = path.split(/[?#]/)[0] || "/";
  return clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
}

/**
 * How a nav link relates to the current path:
 * - "page": the link is the current page (aria-current="page").
 * - "section": the current page lives under the link (aria-current="true").
 * - null: unrelated.
 */
export function linkState(
  pathname: string | null,
  href: string,
): "page" | "section" | null {
  if (!pathname) return null;
  const current = normalize(pathname);
  const target = normalize(href);
  if (current === target) return "page";
  if (target !== "/" && current.startsWith(`${target}/`)) return "section";
  return null;
}

/** aria-current value for a nav link. */
export function ariaCurrent(
  pathname: string | null,
  href: string,
): "page" | "true" | undefined {
  const state = linkState(pathname, href);
  return state === "page" ? "page" : state === "section" ? "true" : undefined;
}
