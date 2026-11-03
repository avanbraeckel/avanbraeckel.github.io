import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Button,
  Card,
  Chip,
  Container,
  Icon,
  Link,
  Section,
  VisuallyHidden,
  iconNames,
} from ".";

/** next/link only keeps the trailing slash when next.config sets trailingSlash. */
const route = (path: string) =>
  expect.stringMatching(new RegExp(`^${path.replace(/\/$/, "")}/?$`));

describe("Button", () => {
  it("renders a button with type=button and the filled variant by default", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("button", "filled", "regular");
  });

  it.each(["filled", "tinted", "plain"] as const)(
    "applies the %s variant",
    (variant) => {
      render(<Button variant={variant}>Go</Button>);
      expect(screen.getByRole("button")).toHaveClass(variant);
    },
  );

  it.each(["small", "regular", "large"] as const)(
    "applies the %s size",
    (size) => {
      render(<Button size={size}>Go</Button>);
      expect(screen.getByRole("button")).toHaveClass(size);
    },
  );

  it("is keyboard focusable and activates with Enter and Space", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await user.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("is not focusable or clickable when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );
    await user.tab();
    expect(screen.getByRole("button")).not.toHaveFocus();
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders a link when given an href", () => {
    render(
      <Button href="/projects/" variant="tinted">
        Projects
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Projects" });
    expect(link).toHaveAttribute("href", route("/projects/"));
    expect(link).not.toHaveAttribute("target");
    expect(link).toHaveClass("button", "tinted");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("opens new-tab links safely", () => {
    render(
      <Button href="/resume.pdf" newTab icon="document">
        Résumé
      </Button>,
    );
    const link = screen.getByRole("link", { name: /Résumé/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAccessibleName(/^Résumé\s*\(opens in a new tab\)$/);
  });

  it("supports downloads", () => {
    render(
      <Button href="/game.zip" download>
        Download
      </Button>,
    );
    expect(screen.getByRole("link")).toHaveAttribute("download", "");
  });

  it("renders icon-only buttons with an accessible label and decorative icon", () => {
    const { container } = render(<Button icon="menu" aria-label="Open menu" />);
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveClass(
      "iconOnly",
    );
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});

describe("Link", () => {
  it("renders internal links in the same tab without an icon", () => {
    const { container } = render(<Link href="/about/">About</Link>);
    const link = screen.getByRole("link", { name: "About" });
    expect(link).toHaveAttribute("href", route("/about/"));
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
    expect(link).toHaveClass("link", "inline");
    expect(container.querySelector("svg")).toBeNull();
  });

  it("gives external links rel, a new tab, and an icon", () => {
    const { container } = render(
      <Link href="https://github.com/avanbraeckel" rel="me">
        GitHub
      </Link>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "me noopener noreferrer");
    // jsdom doesn't apply the icon's inline-block CSS, so it can drop the space
    // before the hidden suffix; browsers keep it.
    expect(link).toHaveAccessibleName(/^GitHub ?\(opens in a new tab\)$/);
    expect(container.querySelector('svg[data-icon="external"]')).not.toBeNull();
  });

  it("can hide the external icon and use the plain variant", () => {
    const { container } = render(
      <Link href="https://x.dev" variant="plain" showExternalIcon={false}>
        X
      </Link>,
    );
    expect(screen.getByRole("link")).toHaveClass("plain");
    expect(container.querySelector("svg")).toBeNull();
  });

  it("is keyboard focusable", async () => {
    const user = userEvent.setup();
    render(<Link href="/about/">About</Link>);
    await user.tab();
    expect(screen.getByRole("link")).toHaveFocus();
  });
});

describe("Card", () => {
  it("renders a static, non-interactive surface by default", () => {
    render(<Card data-testid="card">Body</Card>);
    const card = screen.getByTestId("card");
    expect(card.tagName).toBe("DIV");
    expect(card).toHaveClass("card", "padding-regular");
    expect(card).not.toHaveClass("interactive");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders as a semantic element via `as`", () => {
    render(
      <ul>
        <Card as="li" padding="large">
          Item
        </Card>
      </ul>,
    );
    expect(screen.getByRole("listitem")).toHaveClass("padding-large");
  });

  it("becomes a single interactive, focusable link with href", async () => {
    const user = userEvent.setup();
    render(
      <Card href="/projects/transient/">
        <h3>Transient</h3>
      </Card>,
    );
    const link = screen.getByRole("link", { name: "Transient" });
    expect(link).toHaveAttribute("href", route("/projects/transient/"));
    expect(link).toHaveClass("interactive");
    await user.tab();
    expect(link).toHaveFocus();
  });

  it("can be interactive without being a link", () => {
    render(
      <Card interactive data-testid="card">
        x
      </Card>,
    );
    expect(screen.getByTestId("card")).toHaveClass("interactive");
  });
});

describe("Chip", () => {
  it("renders neutral by default and supports tone, size, and icon", () => {
    const { container, rerender } = render(<Chip>React</Chip>);
    expect(screen.getByText("React")).toHaveClass("chip", "neutral", "regular");
    rerender(
      <Chip tone="accent" size="small" icon="play">
        Playable
      </Chip>,
    );
    expect(screen.getByText("Playable")).toHaveClass("accent", "small");
    expect(container.querySelector('svg[data-icon="play"]')).not.toBeNull();
  });
});

describe("Container", () => {
  it("renders the requested width and element", () => {
    render(
      <Container as="main" width="narrow">
        x
      </Container>,
    );
    expect(screen.getByRole("main")).toHaveClass("container", "narrow");
  });
});

describe("Section", () => {
  it("is a region labelled by its title, with a description", () => {
    render(
      <Section id="projects" title="Projects" description="Things I made.">
        <p>Content</p>
      </Section>,
    );
    const region = screen.getByRole("region", { name: "Projects" });
    expect(region).toHaveAttribute("id", "projects");
    expect(
      screen.getByRole("heading", { level: 2, name: "Projects" }),
    ).toHaveAttribute("id", "projects-title");
    expect(screen.getByText("Things I made.")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("supports other heading levels", () => {
    render(<Section headingLevel={1} title="Hello" />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Hello" }),
    ).toBeInTheDocument();
  });
});

describe("VisuallyHidden", () => {
  it("keeps content in the accessibility tree", () => {
    render(
      <button>
        <Icon name="close" />
        <VisuallyHidden>Close</VisuallyHidden>
      </button>,
    );
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(screen.getByText("Close")).toHaveClass("visually-hidden");
  });

  it("has a focusable variant for skip links", () => {
    render(
      <VisuallyHidden as="a" href="#main" focusable>
        Skip
      </VisuallyHidden>,
    );
    expect(screen.getByRole("link")).toHaveClass("visually-hidden-focusable");
  });
});

describe("Icon", () => {
  it.each(iconNames)("renders %s as a decorative svg", (name) => {
    const { container } = render(<Icon name={name} />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("data-icon", name);
    expect(svg.childElementCount).toBeGreaterThan(0);
  });

  it("is exposed as an image when titled", () => {
    render(<Icon name="github" title="GitHub" size={20} />);
    const img = screen.getByRole("img", { name: "GitHub" });
    expect(img).toHaveAttribute("width", "20");
  });

  it("ships the required set", () => {
    expect(iconNames).toEqual(
      expect.arrayContaining([
        "github",
        "linkedin",
        "arrow",
        "download",
        "play",
        "external",
        "document",
        "close",
        "menu",
      ]),
    );
  });
});
