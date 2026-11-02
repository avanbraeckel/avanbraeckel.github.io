import type { MetadataRoute } from "next";
import { absoluteUrl, publicRoutes } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes().map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
