import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { site } from "@/content/site";
import { SiteFooter } from "./SiteFooter";
import { SiteNav } from "./SiteNav";
import { SkipLink } from "./SkipLink";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));
vi.mock("@/design/fonts", () => ({
  inter: { variable: "font-inter" },
  avbDisplay: { variable: "font-avb-display" },
}));
vi.mock("@/background", () => ({
  LivingBackground: () => <div data-testid="living-background" />,
}));

/** next/link only keeps the trailing slash when next.config sets trailingSlash. */
const route = (path: string) =>
  expect.stringMatching(new RegExp(`^${path.replace(/\/$/, "")}/?$`));

beforeEach(() => {
  navigation.pathname = "/";
});

describe("SiteNav", () => {
  const desktopNav = () =>
    within(screen.getByRole("banner")).getByRole("navigation", {
      name: "Main",
    });

  it("renders the wordmark, every nav item, and the résumé link", () => {
    render(<SiteNav />);
    expect(screen.getByRole("link", { name: site.name })).toHaveAttribute(
      "href",
      "/",
    );
    const nav = desktopNav();
    for (const item of site.nav) {
      expect(
        within(nav).getByRole("link", { name: item.label }),
      ).toHaveAttribute("href", route(item.href));
    }
    expect(site.nav.map((i) => i.label)).toEqual([
      "Projects",
      "Experience",
      "About",
    ]);
  });

  it("opens the résumé PDF in a new tab", () => {
    render(<SiteNav />);
    const resume = within(desktopNav()).getByRole("link", { name: /Résumé/ });
    expect(resume).toHaveAttribute("href", "/resume.pdf");
    expect(resume).toHaveAttribute("target", "_blank");
    expect(resume).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("marks the active item with aria-current=page", () => {
    navigation.pathname = "/experience/";
    render(<SiteNav />);
    const nav = desktopNav();
    expect(
      within(nav).getByRole("link", { name: "Experience" }),
    ).toHaveAttribute("aria-current", "page");
    for (const label of ["Projects", "About"]) {
      expect(
        within(nav).getByRole("link", { name: label }),
      ).not.toHaveAttribute("aria-current");
    }
  });

  it("marks the section of a nested page with aria-current=true", () => {
    navigation.pathname = "/experience/ncr/";
    render(<SiteNav />);
    expect(
      within(desktopNav()).getByRole("link", { name: "Experience" }),
    ).toHaveAttribute("aria-current", "true");
  });

  it("shows the pause-animations toggle between the links and the résumé", () => {
    render(<SiteNav />);
    const nav = desktopNav();
    const toggle = within(nav).getByRole("button", {
      name: "Pause animations",
    });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    const resume = within(nav).getByRole("link", { name: /Résumé/ });
    expect(
      toggle.compareDocumentPosition(resume) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("always shows the scroll-edge material, even at the top", () => {
    render(<SiteNav />);
    const bar = screen.getByRole("banner");
    expect(bar).not.toHaveAttribute("data-scrolled");
    expect(bar.querySelector("[aria-hidden='true']")).toBeInTheDocument();
  });
});

describe("mobile nav sheet", () => {
  const openSheet = async () => {
    const user = userEvent.setup();
    render(<SiteNav />);
    const trigger = screen.getByRole("button", { name: "Menu" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Menu" });
    return { user, trigger, dialog };
  };

  it("opens a modal dialog with the nav items, résumé, and socials", async () => {
    navigation.pathname = "/about/";
    const { trigger, dialog } = await openSheet();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    for (const item of site.nav) {
      expect(
        within(dialog).getByRole("link", { name: item.label }),
      ).toHaveAttribute("href", route(item.href));
    }
    expect(within(dialog).getByRole("link", { name: "About" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(dialog).getByRole("link", { name: /Résumé/ }),
    ).toHaveAttribute("target", "_blank");
    for (const social of site.social) {
      expect(
        within(dialog).getByRole("link", { name: new RegExp(social.label) }),
      ).toHaveAttribute("href", social.href);
    }
    // Focus moves into the sheet.
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("has a pause-animations switch row in the sheet", async () => {
    const { user, dialog } = await openSheet();
    const row = within(dialog).getByRole("button", {
      name: "Pause animations",
    });
    expect(row).toHaveAttribute("aria-pressed", "false");
    await user.click(row);
    expect(row).toHaveAttribute("aria-pressed", "true");
    await user.click(row);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const { user, trigger } = await openSheet();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger).toHaveFocus();
  });

  it("closes when the scrim is pressed and returns focus to the trigger", async () => {
    const { user, trigger, dialog } = await openSheet();
    const scrim = document.querySelector<HTMLElement>(".scrim");
    expect(scrim).not.toBeNull();
    expect(dialog).not.toContainElement(scrim);
    await user.click(scrim!);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger).toHaveFocus();
  });

  it("closes with the close button", async () => {
    const { user, dialog, trigger } = await openSheet();
    await user.click(
      within(dialog).getByRole("button", { name: "Close menu" }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger).toHaveFocus();
  });

  it("dismisses on a downward drag and swallows the click on the grabbed link", async () => {
    const { dialog, trigger } = await openSheet();
    const link = within(dialog).getByRole("link", { name: "Projects" });
    const onClick = vi.fn();
    link.addEventListener("click", onClick);
    const at = (t: number, y: number) => ({
      pointerId: 1,
      pointerType: "touch",
      clientY: y,
      timeStamp: t,
    });
    fireEvent.pointerDown(link, at(0, 300));
    fireEvent.pointerMove(link, at(16, 340));
    fireEvent.pointerMove(link, at(32, 420));
    fireEvent.pointerMove(link, at(48, 520));
    fireEvent.pointerUp(link, at(56, 560));
    fireEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("closes when a link is chosen", async () => {
    const { user, dialog, trigger } = await openSheet();
    const link = within(dialog).getByRole("link", { name: "Projects" });
    link.addEventListener("click", (e) => e.preventDefault()); // no navigation in jsdom
    await user.click(link);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});

describe("SiteFooter", () => {
  it("links GitHub, LinkedIn, and the résumé, with the year", () => {
    render(<SiteFooter year={2026} />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent(`© 2026 ${site.name}`);
    expect(
      within(footer).getByRole("link", { name: /GitHub/ }),
    ).toHaveAttribute("href", "https://github.com/avanbraeckel");
    expect(
      within(footer).getByRole("link", { name: /LinkedIn/ }),
    ).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/austin-van-braeckel-1002b1219/",
    );
    const resume = within(footer).getByRole("link", { name: /Résumé/ });
    expect(resume).toHaveAttribute("href", "/resume.pdf");
    expect(resume).toHaveAttribute("target", "_blank");
  });
});

describe("skip link and layout", () => {
  it("SkipLink targets #main", () => {
    render(<SkipLink />);
    expect(
      screen.getByRole("link", { name: "Skip to content" }),
    ).toHaveAttribute("href", "#main");
  });

  it("the root layout renders the skip link first, then a #main landmark", async () => {
    const { default: RootLayout } = await import("@/app/layout");
    const html = renderToStaticMarkup(
      <RootLayout params={Promise.resolve({})}>
        <h1>Page</h1>
      </RootLayout>,
    );
    const doc = new DOMParser().parseFromString(html, "text/html");
    expect(doc.documentElement.getAttribute("lang")).toBe("en");
    const firstLink = doc.body.querySelector("a");
    expect(firstLink?.getAttribute("href")).toBe("#main");
    const main = doc.querySelector("main#main");
    expect(main).not.toBeNull();
    expect(main?.querySelector("h1")?.textContent).toBe("Page");
    expect(doc.querySelectorAll("main")).toHaveLength(1);
    // The pause state is applied before first paint by an inline head script.
    expect(doc.head.querySelector("script")?.textContent).toContain(
      "avb:ambient-motion",
    );
    expect(doc.querySelector("header")).not.toBeNull();
    expect(doc.querySelector("footer")).not.toBeNull();
    expect(
      doc.querySelector('[data-testid="living-background"]'),
    ).not.toBeNull();
  });
});
