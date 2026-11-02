import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { DEFAULT_DESCRIPTION } from "@/lib/seo";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "Austin VB",
    description: DEFAULT_DESCRIPTION,
    start_url: "/",
    display: "browser",
    // Light-scheme --bg and --accent from src/design/tokens.css.
    background_color: "#fbfbf9",
    theme_color: "#fbfbf9",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
