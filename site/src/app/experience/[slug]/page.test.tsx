import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { caseStudyEntries, getExperience } from "@/content/experience";

// Vitest has no MDX loader; stand in a body per slug.
vi.mock("@/content/case-studies", () => {
  const body = (slug: string) =>
    function Body() {
      return <h2>Body of {slug}</h2>;
    };
  return {
    caseStudies: {
      ncr: body("ncr"),
      "magnet-review": body("magnet-review"),
      "magnet-axiom-cyber": body("magnet-axiom-cyber"),
    },
    caseStudyDescriptions: {},
  };
});

const {
  default: CaseStudyPage,
  generateStaticParams,
  generateMetadata,
} = await import("./page");

async function renderPage(slug: string) {
  render(await CaseStudyPage({ params: Promise.resolve({ slug }) } as never));
}

describe("/experience/[slug]", () => {
  it("generates a static page per case study", () => {
    expect(generateStaticParams()).toEqual([
      { slug: "magnet-axiom-cyber" },
      { slug: "magnet-review" },
      { slug: "ncr" },
    ]);
  });

  it.each(caseStudyEntries().map((entry) => entry.slug))(
    "%s renders its title, role, stack, and body",
    async (slug) => {
      const entry = getExperience(slug)!;
      await renderPage(slug);
      expect(
        screen.getByRole("heading", { level: 1, name: entry.company }),
      ).toBeInTheDocument();
      expect(screen.getByText(entry.role)).toBeInTheDocument();
      const stack = screen.getByRole("list", { name: "Stack" });
      for (const item of entry.stack) {
        expect(within(stack).getByText(item)).toBeInTheDocument();
      }
      expect(screen.getByText(`Body of ${slug}`)).toBeInTheDocument();
    },
  );

  it("links to the neighbouring case studies in timeline order", async () => {
    await renderPage("magnet-review");
    const nav = screen.getByRole("navigation", { name: "More case studies" });
    const hrefs = within(nav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual([
      expect.stringMatching(/^\/experience\/ncr\/?$/),
      expect.stringMatching(/^\/experience\/magnet-axiom-cyber\/?$/),
    ]);
  });

  it("builds metadata from the entry", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "ncr" }),
    } as never);
    expect(metadata.title).toBe(
      "NCR Corporation: Channel Services Platform Foundation",
    );
  });
});
