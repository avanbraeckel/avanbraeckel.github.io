/**
 * axe checks for every page, rendered inside the app shell (skip link, nav,
 * main, footer) the way the root layout composes them, so page-level rules
 * (one main, no duplicate banner/contentinfo, content inside landmarks, one
 * h1, heading order) see the whole document.
 *
 * Color contrast can't be computed in jsdom (no layout or cascade); it is
 * covered by tokens.test.ts and by Lighthouse in a real browser.
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { axe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";
import AboutPage from "@/app/about/page";
import CaseStudyPage from "@/app/experience/[slug]/page";
import ExperiencePage from "@/app/experience/page";
import NotFound from "@/app/not-found";
import Home from "@/app/page";
import ProjectsPage from "@/app/projects/page";
import TransientPage from "@/app/projects/transient/page";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { SiteNav } from "@/components/shell/SiteNav";
import { SkipLink } from "@/components/shell/SkipLink";
import { caseStudyEntries } from "@/content/experience";

expect.extend(matchers);

// vitest-axe 0.1 only augments the legacy `Vi` namespace.
declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  interface Assertion<T = any> extends matchers.AxeMatchers {}
}

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: () => navigation.pathname,
}));

const AXE_OPTIONS = {
  rules: { "color-contrast": { enabled: false } },
} as const;

/** The root layout's body, minus the background canvas (decorative). */
function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink targetId="main" />
      <SiteNav />
      <main id="main" tabIndex={-1}>
        <div>{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}

async function expectNoViolations() {
  // Pass the live body: given any element outside it (e.g. <html>),
  // vitest-axe audits a serialized copy and then rewrites body.innerHTML,
  // which detaches the rendered tree from Testing Library.
  const results = await axe(document.body, AXE_OPTIONS);
  expect(results).toHaveNoViolations();
}

/** Heading levels in document order never skip a level going down. */
function expectHeadingOrder() {
  const levels = Array.from(
    document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
    (heading) => Number(heading.tagName[1]),
  );
  expect(levels.filter((level) => level === 1)).toHaveLength(1);
  levels.reduce((previous, level) => {
    expect(level - previous).toBeLessThanOrEqual(1);
    return level;
  }, 0);
}

beforeAll(() => {
  document.documentElement.lang = "en";
  document.title = "Austin Van Braeckel";
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
});

afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  navigation.pathname = "/";
});

const pages: [string, string, () => ReactNode | Promise<ReactNode>][] = [
  ["home", "/", () => <Home />],
  ["about", "/about/", () => <AboutPage />],
  ["projects", "/projects/", () => <ProjectsPage />],
  ["transient", "/projects/transient/", () => <TransientPage />],
  ["experience", "/experience/", () => <ExperiencePage />],
  ...caseStudyEntries().map(
    ({ slug }) =>
      [
        `case study: ${slug}`,
        `/experience/${slug}/`,
        () =>
          CaseStudyPage({
            params: Promise.resolve({ slug }),
          } as never),
      ] as [string, string, () => Promise<ReactNode>],
  ),
  ["404", "/missing/", () => <NotFound />],
];

describe("accessibility (axe)", () => {
  it.each(pages)("%s has no violations", async (_name, path, page) => {
    navigation.pathname = path;
    render(<Shell>{await page()}</Shell>);
    await expectNoViolations();
    expectHeadingOrder();
  });

  it("the open nav sheet has no violations", async () => {
    navigation.pathname = "/projects/";
    const user = userEvent.setup();
    render(
      <Shell>
        <ProjectsPage />
      </Shell>,
    );
    await user.click(screen.getByRole("button", { name: "Menu" }));
    const dialog = await screen.findByRole("dialog", { name: "Menu" });
    expect(
      within(dialog).getByRole("link", { name: "Projects" }),
    ).toHaveAttribute("aria-current", "page");
    await expectNoViolations();
  });
});
