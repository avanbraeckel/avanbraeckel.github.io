import { act, render, screen, waitFor } from "@testing-library/react";
import { axe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TRANSIENT_DOWNLOAD_HREF } from "@/content/projects";
import { TransientPlayer } from "./TransientPlayer";
import { CHEERPJ_LOADER_SRC, resetSessionForTests } from "./transientRuntime";

function loaderScript(): HTMLScriptElement | null {
  return document.querySelector<HTMLScriptElement>(
    `script[src="${CHEERPJ_LOADER_SRC}"]`,
  );
}

async function clickPlay() {
  await userEvent.click(
    screen.getByRole("button", { name: /play in browser/i }),
  );
  await waitFor(() => expect(loaderScript()).not.toBeNull());
}

/** Minimal stand-ins for CheerpJ's globals. */
function stubCheerpJ() {
  class FakeFile {
    async exists() {
      return true;
    }
  }
  const runMain = vi.fn(() => new Promise<number>(() => {}));
  const createDisplay = vi.fn((_w: number, _h: number, parent: HTMLElement) => {
    const display = document.createElement("div");
    display.id = "cheerpjDisplay";
    parent.appendChild(display);
    return display;
  });
  vi.stubGlobal(
    "cheerpjInit",
    vi.fn(async () => {}),
  );
  vi.stubGlobal(
    "cheerpjRunLibrary",
    vi.fn(async () => ({ java: { io: { File: FakeFile } } })),
  );
  vi.stubGlobal("cheerpjCreateDisplay", createDisplay);
  vi.stubGlobal("cheerpjRunMain", runMain);
  return { runMain, createDisplay };
}

expect.extend(matchers);

describe("TransientPlayer", () => {
  afterEach(() => {
    resetSessionForTests();
    vi.unstubAllGlobals();
    loaderScript()?.remove();
  });

  it("does not load CheerpJ before the visitor clicks play", () => {
    render(<TransientPlayer />);
    expect(loaderScript()).toBeNull();
    expect(
      screen.getByRole("button", { name: /play in browser/i }),
    ).toBeEnabled();
    expect(screen.getByText(/about 40 MB/i)).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /transient title screen/i }),
    ).toBeInTheDocument();
  });

  it("injects the CheerpJ loader and shows loading stages after the click", async () => {
    render(<TransientPlayer />);
    await clickPlay();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(
      screen.getByText("Loading the Java runtime…", { selector: "p" }),
    ).toBeInTheDocument();
    // Controls are shown while it loads, with the Ctrl+W warning.
    expect(screen.getByText(/closes the tab/i)).toBeInTheDocument();
  });

  it("moves through the stages and runs the game", async () => {
    render(<TransientPlayer />);
    await clickPlay();
    // The loader script defines CheerpJ's globals when it runs.
    const { runMain, createDisplay } = stubCheerpJ();
    act(() => {
      loaderScript()!.dispatchEvent(new Event("load"));
    });

    await waitFor(() => expect(runMain).toHaveBeenCalled());
    expect(runMain.mock.calls[0]).toEqual([
      "Main.Game",
      expect.stringMatching(
        /^\/app\/transient\/game\/patch\.jar:\/app\/transient\/game\/TRANSIENT\.jar:/,
      ),
    ]);
    expect(createDisplay.mock.calls[0][2]).toBe(
      screen.getByTestId("transient-display").firstChild,
    );
    expect(
      screen.getByText("Loading the game…", { selector: "p" }),
    ).toBeInTheDocument();

    // CheerpJ shows the game's window.
    act(() => {
      const win = document.createElement("div");
      win.className = "cjWindow";
      win.appendChild(document.createElement("canvas"));
      document.getElementById("cheerpjDisplay")!.appendChild(win);
    });
    expect(
      await screen.findByText("Starting…", { selector: "p" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole(
        "button",
        { name: /controls/i },
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("shows a fallback with retry and download when CheerpJ fails to load", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<TransientPlayer />);
    await clickPlay();
    const first = loaderScript()!;
    act(() => {
      first.dispatchEvent(new Event("error"));
    });

    expect(await screen.findByText(/couldn’t start here\.$/i)).toBeVisible();
    const download = screen.getAllByRole("link", { name: /download/i })[0];
    expect(download).toHaveAttribute("href", TRANSIENT_DOWNLOAD_HREF);

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    await waitFor(() => {
      const again = loaderScript();
      expect(again).not.toBeNull();
      expect(again).not.toBe(first);
    });
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("always offers the download", () => {
    render(<TransientPlayer />);
    const link = screen.getByRole("link", { name: /download instead/i });
    expect(link).toHaveAttribute("href", TRANSIENT_DOWNLOAD_HREF);
    expect(link).toHaveAttribute("download");
  });

  it("credits CheerpJ", () => {
    render(<TransientPlayer />);
    expect(screen.getByRole("link", { name: "CheerpJ" })).toHaveAttribute(
      "href",
      "https://cheerpj.com",
    );
  });

  describe("keyboard and assistive tech", () => {
    /** Starts the game and shows its window; returns the game's input. */
    async function startRunning() {
      render(<TransientPlayer />);
      await clickPlay();
      stubCheerpJ();
      act(() => {
        loaderScript()!.dispatchEvent(new Event("load"));
      });
      await waitFor(() =>
        expect(document.getElementById("cheerpjDisplay")).not.toBeNull(),
      );
      const input = document.createElement("textarea");
      act(() => {
        const display = document.getElementById("cheerpjDisplay")!;
        display.appendChild(input);
        display.appendChild(document.createElement("textarea"));
        const titleLink = document.createElement("a");
        titleLink.href = "https://cheerpj.com";
        display.appendChild(titleLink);
        const win = document.createElement("div");
        win.className = "cjWindow";
        win.appendChild(document.createElement("canvas"));
        display.appendChild(win);
      });
      await screen.findByRole(
        "button",
        { name: /controls/i },
        { timeout: 3000 },
      );
      return input;
    }

    it("announces each stage in one polite live region", async () => {
      render(<TransientPlayer />);
      const region = screen.getByRole("status");
      expect(region).toHaveTextContent("");
      await clickPlay();
      expect(region).toHaveTextContent("Loading the Java runtime.");
      // Only one live region: the visible loading panel is not another.
      expect(screen.getAllByRole("status")).toHaveLength(1);
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("announces a failure politely and moves focus to its first action", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      render(<TransientPlayer />);
      await clickPlay();
      act(() => {
        loaderScript()!.dispatchEvent(new Event("error"));
      });
      const retry = await screen.findByRole("button", { name: /try again/i });
      expect(screen.getByRole("status")).toHaveTextContent(
        /couldn’t start here/i,
      );
      await waitFor(() => expect(retry).toHaveFocus());
    });

    it("keeps focus on the player when the play button is replaced", async () => {
      render(<TransientPlayer />);
      await clickPlay();
      await waitFor(() =>
        expect(
          screen.getByRole("group", { name: "Transient game" }),
        ).toHaveFocus(),
      );
    });

    it("documents the way out and links it to the game", async () => {
      const input = await startRunning();
      const hint = screen.getByText("Press Tab to leave the game.");
      expect(hint).toHaveAttribute("id");
      expect(
        screen.getByRole("group", { name: "Transient game" }),
      ).toHaveAttribute("aria-describedby", hint.id);
      expect(screen.getByRole("status")).toHaveTextContent(
        /running\. Press Tab to leave the game/i,
      );
      expect(input).toHaveAttribute("aria-label", "Transient game");
      expect(input).toHaveAttribute("aria-describedby", hint.id);
    });

    it("lets Tab out of the game instead of letting CheerpJ swallow it", async () => {
      const input = await startRunning();
      const reached = vi.fn();
      input.addEventListener("keydown", reached);
      const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
      input.dispatchEvent(tab);
      expect(reached).not.toHaveBeenCalled();
      // The default action is left alone so the browser moves focus.
      expect(tab.defaultPrevented).toBe(false);
      // Other keys, including Esc (used by the game), still reach it.
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
      input.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
          ctrlKey: true,
          bubbles: true,
        }),
      );
      expect(reached).toHaveBeenCalledTimes(2);
    });

    it("leaves the game input as the display's only Tab stop", async () => {
      const input = await startRunning();
      const display = document.getElementById("cheerpjDisplay")!;
      const stops = [...display.querySelectorAll("textarea, a[href]")].filter(
        (el) => (el as HTMLElement).tabIndex >= 0,
      );
      expect(stops).toEqual([input]);
    });

    it("keeps focus on the controls toggle when it closes the panel", async () => {
      await startRunning();
      const toggle = screen.getByRole("button", { name: /controls/i });
      await userEvent.click(toggle);
      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-pressed", "false");
      expect(toggle).toHaveFocus();
    });

    it("exposes the controls toggle state", async () => {
      await startRunning();
      const toggle = screen.getByRole("button", { name: /controls/i });
      expect(toggle).toHaveAttribute("aria-pressed", "false");
      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-pressed", "true");
    });

    it("has no axe violations at rest or while loading", async () => {
      const { container } = render(<TransientPlayer />);
      expect(await axe(container)).toHaveNoViolations();
      await clickPlay();
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
