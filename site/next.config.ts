import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  experimental: {
    // The whole stylesheet is ~15 KB, so inlining it into each page removes
    // the render-blocking CSS requests from first paint.
    inlineCss: true,
  },
  // View transitions need no flag: Next 16.4 + React 19.3 ship <ViewTransition>
  // as stable, and `experimental.viewTransition` no longer exists. Page
  // cross-fades live in src/components/shell/PageTransition.tsx.
};

// MDX is imported as content (src/content/case-studies/*.mdx), not used for
// routes, so pageExtensions stays at the default. Element styling comes from
// src/mdx-components.tsx.
const withMDX = createMDX({});

export default withMDX(nextConfig);
