import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { describe, expect, it, vi } from "vitest";
import { caseStudyEntries } from "@/content/experience";
import { site } from "@/content/site";
import { ogCards, ogImageName, personJsonLd, publicRoutes } from "@/lib/seo";
import manifest from "./manifest";
import robots from "./robots";
import sitemap from "./sitemap";

// Vitest has no MDX loader; stub the bodies so the real descriptions load.
vi.mock("@/content/case-studies/ncr.mdx", () => ({ default: () => null }));
vi.mock("@/content/case-studies/magnet-review.mdx", () => ({
  default: () => null,
}));
vi.mock("@/content/case-studies/magnet-axiom-cyber.mdx", () => ({
  default: () => null,
}));

const APP_DIR = path.resolve(__dirname);
const OUT_DIR = path.resolve(__dirname, "../../out");

/** Routes of every static page.tsx under src/app. */
function staticPageRoutes(dir = APP_DIR, prefix = "/"): string[] {
  const routes: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name === "page.tsx") routes.push(prefix);
    if (entry.isDirectory() && !entry.name.startsWith("[")) {
      routes.push(
        ...staticPageRoutes(
          path.join(dir, entry.name),
          `${prefix}${entry.name}/`,
        ),
      );
    }
  }
  return routes;
}

async function metadataFor(route: string): Promise<Metadata> {
  const slug = caseStudyEntries().find((e) => e.href === route)?.slug;
  if (slug) {
    const page = await import("./experience/[slug]/page");
    return page.generateMetadata({
      params: Promise.resolve({ slug }),
    } as never);
  }
  const file = route === "/" ? "./page" : `.${route}page`;
  const page = (await import(/* @vite-ignore */ file)) as {
    metadata: Metadata;
  };
  return page.metadata;
}

function titleOf(metadata: Metadata): string {
  const { title } = metadata;
  if (typeof title === "string") return `${title} · ${site.name}`;
  if (title && "absolute" in title) return title.absolute;
  throw new Error("Page has no title");
}

describe("sitemap", () => {
  it("lists every public route, absolute, with trailing slashes", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toEqual(
      publicRoutes().map((route) => `https://avanbraeckel.github.io${route}`),
    );
    for (const url of urls) expect(url).toMatch(/\/$/);
  });

  it("covers every static page and case study", () => {
    const routes = publicRoutes();
    expect([...routes].sort()).toEqual(
      [
        ...staticPageRoutes(),
        ...caseStudyEntries().map((entry) => entry.href!),
      ].sort(),
    );
  });
});

describe("robots and manifest", () => {
  it("allows crawling and points at the sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://avanbraeckel.github.io/sitemap.xml",
    });
  });

  it("names the site and uses the brand colors", () => {
    expect(manifest()).toMatchObject({
      name: site.name,
      theme_color: "#fbfbf9",
      start_url: "/",
    });
  });
});

describe("per-route metadata", () => {
  const routes = publicRoutes();

  it.each(routes)(
    "%s has a title, description, canonical, and OG image",
    async (route) => {
      const metadata = await metadataFor(route);
      expect(titleOf(metadata)).toBeTruthy();
      expect(metadata.description?.length).toBeGreaterThan(40);
      expect(metadata.alternates?.canonical).toBe(route);
      expect(metadata.openGraph).toMatchObject({
        url: route,
        siteName: site.name,
        images: [
          { url: `/og/${ogImageName(route)}`, width: 1200, height: 630 },
        ],
      });
    },
  );

  it("titles and descriptions are unique across routes", async () => {
    const all = await Promise.all(routes.map(metadataFor));
    const titles = all.map(titleOf);
    const descriptions = all.map((m) => m.description);
    expect(new Set(titles).size).toBe(routes.length);
    expect(new Set(descriptions).size).toBe(routes.length);
  });

  it("has an OG card for every public route", () => {
    expect(Object.keys(ogCards()).sort()).toEqual([...routes].sort());
    const names = routes.map(ogImageName);
    expect(new Set(names).size).toBe(routes.length);
    expect(ogImageName("/")).toBe("home.png");
    expect(ogImageName("/experience/ncr/")).toBe("experience-ncr.png");
  });
});

describe("JSON-LD", () => {
  it("describes a Person with social profiles and no email", () => {
    const json = personJsonLd();
    const person = JSON.parse(json);
    expect(person).toMatchObject({
      "@type": "Person",
      name: site.name,
      url: "https://avanbraeckel.github.io/",
      worksFor: { name: "Magnet Forensics" },
      sameAs: site.social.map((link) => link.href),
    });
    expect(json).not.toMatch(/email|@[a-z]+\./i);
    expect(json).not.toContain("<");
  });
});

// Checks the real export when one exists (after `npm run build`).
describe.skipIf(!existsSync(path.join(OUT_DIR, "sitemap.xml")))(
  "static export",
  () => {
    const read = (file: string) =>
      readFileSync(path.join(OUT_DIR, file), "utf8");
    const htmlFor = (route: string) => read(`${route.slice(1)}index.html`);
    const tag = (html: string, pattern: RegExp) => html.match(pattern)?.[1];

    it("writes sitemap.xml and robots.txt", () => {
      const xml = read("sitemap.xml");
      for (const route of publicRoutes()) {
        expect(xml).toContain(
          `<loc>https://avanbraeckel.github.io${route}</loc>`,
        );
      }
      expect(read("robots.txt")).toContain(
        "Sitemap: https://avanbraeckel.github.io/sitemap.xml",
      );
    });

    it("gives each route's HTML a unique title, description, and OG image", () => {
      const heads = publicRoutes().map((route) => {
        const html = htmlFor(route);
        return {
          title: tag(html, /<title>([^<]+)<\/title>/),
          description: tag(html, /<meta name="description" content="([^"]+)"/),
          ogImage: tag(html, /<meta property="og:image" content="([^"]+)"/),
        };
      });
      for (const key of ["title", "description", "ogImage"] as const) {
        const values = heads.map((head) => head[key]);
        expect(values.every(Boolean)).toBe(true);
        expect(new Set(values).size).toBe(heads.length);
      }
      for (const { ogImage } of heads) {
        const file = ogImage!.replace("https://avanbraeckel.github.io/", "");
        expect(existsSync(path.join(OUT_DIR, file))).toBe(true);
      }
    });

    it("renders the custom 404 page", () => {
      const html = read("404.html");
      expect(html).toContain(
        "<title>Page not found · Austin Van Braeckel</title>",
      );
      expect(html).toContain('href="/experience/"');
      expect(html).not.toContain('rel="canonical"');
    });
  },
);
