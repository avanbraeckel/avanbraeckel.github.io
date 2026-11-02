import type { MDXComponents } from "mdx/types";
import { proseComponents } from "@/components/experience/mdx";

/**
 * Required by @next/mdx (App Router). Maps MDX elements to styled
 * components; case studies also get <Figure> and <FigureRow>.
 */
export function useMDXComponents(
  components: MDXComponents = {},
): MDXComponents {
  return { ...proseComponents, ...components };
}
