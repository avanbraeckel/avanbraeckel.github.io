/**
 * Runs Transient (a Java 8 Swing game) in the browser with CheerpJ.
 *
 * CheerpJ can only be initialized once per page load, so there is at most one
 * session, kept at module level. It outlives the component: when the player
 * unmounts (client-side navigation), the display element is parked off-DOM
 * and the game's audio is suspended; when a player mounts again it adopts the
 * same display and resumes.
 */

/** CheerpJ's loader. The free Community Edition must load from this CDN. */
export const CHEERPJ_LOADER_SRC =
  "https://cjrtnc.leaningtech.com/5.0/loader.js";
export const CHEERPJ_URL = "https://cheerpj.com";

/** public/transient/game/, as CheerpJ sees it (/app/ maps to the site root). */
const GAME_DIR = "/app/transient/game";
const MAIN_CLASS = "Main.Game";
/**
 * patch.jar comes first so its fixed Audio/AudioPlayer.class shadows the
 * original (see scripts/prepare-transient.mjs).
 */
const CLASSPATH = [
  "patch.jar",
  "TRANSIENT.jar",
  "lib/jl1.0.1.jar",
  "lib/mp3spi1.9.5.jar",
  "lib/tritonus_share.jar",
]
  .map((f) => `${GAME_DIR}/${f}`)
  .join(":");
/** The game reads and writes saves relative to the cwd, which is /files/. */
const SAVE_DIR = "/files/resources/Save/GameSaves";
const SHIPPED_SAVE = `${GAME_DIR}/resources/Save/GameSaves/0`;

/**
 * Display geometry.
 *
 * CheerpJ draws the game's JFrame as a 640x500 window (a 20px title bar over
 * the 640x480 game) centered in the display, and pins its Community Edition
 * notice to the display's bottom edge, full width. The notice is a license
 * requirement and is never styled, covered or clipped. Everything here is
 * arranged around it:
 *
 * - The display is wide enough for the notice to fit on one line.
 * - Its height is chosen so the centered window ends exactly where the notice
 *   begins: H = 500 + 2 * notice height. No dead bands above or below.
 * - The player shows the display through a viewport that starts below the
 *   title bar, so the window decoration (and its close button) is cropped
 *   away. Only the empty area above the window and the title bar are cut.
 */
export const WINDOW_WIDTH = 640;
export const WINDOW_HEIGHT = 500;
export const TITLE_BAR_HEIGHT = 20;
/** The game's own canvas area, below the title bar. */
export const GAME_HEIGHT = WINDOW_HEIGHT - TITLE_BAR_HEIGHT;
/** One-line notice: its text is ~710px in a wide bold sans (DejaVu Sans). */
export const WIDE_DISPLAY_WIDTH = 760;
/** For narrow columns: tighter around the game; the notice wraps to 2 lines. */
export const NARROW_DISPLAY_WIDTH = 644;
/** Notice box height (one line) until it can be measured. */
const DEFAULT_NOTICE_HEIGHT = 23;

export interface DisplayLayout {
  /** Display size, in CSS px, before scaling. */
  width: number;
  height: number;
  /** Pixels cut from the top: the space above the window plus its title bar. */
  cropTop: number;
}

/** The part of the display the player shows. */
export function visibleHeight(layout: DisplayLayout): number {
  return layout.height - layout.cropTop;
}

export function layoutFor(width: number, noticeHeight: number): DisplayLayout {
  const height = WINDOW_HEIGHT + 2 * noticeHeight;
  const windowTop = (height - WINDOW_HEIGHT) / 2;
  return { width, height, cropTop: windowTop + TITLE_BAR_HEIGHT };
}

/** The display width for a player column this wide. */
export function displayWidthFor(columnWidth: number): number {
  return columnWidth >= WIDE_DISPLAY_WIDTH
    ? WIDE_DISPLAY_WIDTH
    : NARROW_DISPLAY_WIDTH;
}

const LOADER_TIMEOUT_MS = 30_000;
/** No game window after this long counts as a failure. */
const START_TIMEOUT_MS = 180_000;
/** The window appears blank for a moment before the first frame. */
const FIRST_FRAME_DELAY_MS = 1_200;

export type Stage =
  | "runtime" // loading CheerpJ
  | "game" // fetching the game and opening its window
  | "starting" // window is up, first frames
  | "running"
  | "exited" // the game quit (CheerpJ cannot restart it without a reload)
  | "error";

export interface SessionState {
  stage: Stage;
  /** When the current stage began (performance.now()). */
  since: number;
  error?: string;
  layout: DisplayLayout;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- CheerpJ's Java bridge is untyped */
interface CheerpJGlobals {
  cheerpjInit(options?: { version?: number }): Promise<void>;
  cheerpjCreateDisplay(
    width: number,
    height: number,
    parent: HTMLElement,
  ): HTMLElement;
  cheerpjRunMain(className: string, classPath: string): Promise<number>;
  cheerpjRunLibrary(classPath: string): Promise<any>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function cheerpj(): CheerpJGlobals {
  return window as unknown as CheerpJGlobals;
}

type Listener = () => void;

export class TransientSession {
  /** The element CheerpJ renders into. Moves between player mounts. */
  readonly host: HTMLDivElement;
  private state: SessionState;
  private listeners = new Set<Listener>();
  private audio: AudioContext[] = [];
  private initialized = false;
  private script: HTMLScriptElement | null = null;

  constructor(width: number = WIDE_DISPLAY_WIDTH) {
    this.host = document.createElement("div");
    this.host.className = "transient-display";
    this.state = {
      stage: "runtime",
      since: performance.now(),
      layout: layoutFor(width, DEFAULT_NOTICE_HEIGHT),
    };
    this.applyLayout();
  }

  private applyLayout() {
    const { width, height, cropTop } = this.state.layout;
    this.host.style.width = `${width}px`;
    this.host.style.height = `${height}px`;
    this.host.style.marginTop = `${-cropTop}px`;
  }

  private setLayout(layout: DisplayLayout) {
    const old = this.state.layout;
    if (
      old.width === layout.width &&
      old.height === layout.height &&
      old.cropTop === layout.cropTop
    ) {
      return;
    }
    this.state = { ...this.state, layout };
    this.applyLayout();
    this.listeners.forEach((l) => l());
  }

  /**
   * Size the display around the notice as CheerpJ actually renders it (its
   * height depends on the visitor's fonts), before Java reads the screen size.
   */
  private fitToNotice(display: HTMLElement) {
    const notice = getComputedStyle(display, "::before");
    const top = parseFloat(notice.top);
    const { width, height } = this.state.layout;
    const noticeHeight = height - top;
    if (
      Number.isFinite(noticeHeight) &&
      noticeHeight > 0 &&
      noticeHeight < 200
    ) {
      this.setLayout(layoutFor(width, Math.ceil(noticeHeight)));
    }
  }

  /** Align the crop with where CheerpJ actually put the window. */
  private alignToWindow(win: HTMLElement) {
    const top = parseFloat(win.style.top);
    if (!Number.isFinite(top)) return;
    const { width, height } = this.state.layout;
    this.setLayout({ width, height, cropTop: top + TITLE_BAR_HEIGHT });
  }

  getState = (): SessionState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private set(stage: Stage, error?: string) {
    if (this.state.stage === "error" || this.state.stage === "exited") return;
    this.state = { ...this.state, stage, since: performance.now(), error };
    this.listeners.forEach((l) => l());
  }

  private fail(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Transient failed to start:", error);
    this.set("error", message);
  }

  /** Put the display in `slot`; must be laid out before start() runs. */
  attach(slot: HTMLElement) {
    if (this.host.parentElement !== slot) slot.appendChild(this.host);
    for (const ctx of this.audio) void ctx.resume().catch(() => {});
  }

  /** Take the display out of the page and silence the game. */
  park() {
    this.host.remove();
    for (const ctx of this.audio) void ctx.suspend().catch(() => {});
  }

  /** Focus CheerpJ's keyboard input so keys reach the game. */
  focus() {
    const input =
      this.host.querySelector<HTMLElement>("#cheerpjDisplay textarea") ??
      this.host.querySelector<HTMLElement>("#cheerpjDisplay");
    input?.focus({ preventScroll: true });
  }

  /**
   * Make the display keyboard-friendly. The game's first hidden textarea is
   * its keyboard input: it gets an accessible name and description, and stays
   * the display's one Tab stop. CheerpJ's other focusable elements (a second
   * textarea, and the link and field in the window's title bar, which the
   * player crops out of view) would otherwise take Tab presses invisibly.
   */
  prepareKeyboard(label: string, describedBy: string) {
    const input = this.host.querySelector<HTMLElement>(
      "#cheerpjDisplay textarea",
    );
    input?.setAttribute("aria-label", label);
    input?.setAttribute("aria-describedby", describedBy);
    for (const el of this.host.querySelectorAll<HTMLElement>(
      "textarea, input, a[href], button",
    )) {
      if (el !== input) el.tabIndex = -1;
    }
  }

  /**
   * Focus the game only if focus is not somewhere else on the page. A visitor
   * who tabbed away while it loaded keeps their place.
   */
  focusUnlessElsewhere() {
    const active = document.activeElement;
    const stage = this.host.closest("[data-transient-stage]");
    if (
      !active ||
      active === document.body ||
      (stage && stage.contains(active))
    ) {
      this.focus();
    }
  }

  /** Whether retry() can work without reloading the page. */
  get canRetryInPlace(): boolean {
    return !this.initialized;
  }

  async start() {
    this.trackAudio();
    try {
      await this.loadScript();
      await cheerpj().cheerpjInit({ version: 8 });
      this.initialized = true;
      this.set("game");
      await this.seedSave();
      const display = cheerpj().cheerpjCreateDisplay(-1, -1, this.host);
      if (display instanceof HTMLElement) this.fitToNotice(display);
      this.watchForWindow();
      const exit = cheerpj().cheerpjRunMain(MAIN_CLASS, CLASSPATH);
      exit.then(
        () => this.set("exited"),
        (err) => this.fail(err),
      );
    } catch (err) {
      this.fail(err);
    }
  }

  /** Retry after an error. Only possible before CheerpJ initialized. */
  retry() {
    if (!this.canRetryInPlace) {
      window.location.reload();
      return;
    }
    this.script?.remove();
    this.script = null;
    this.state = { ...this.state, stage: "runtime", since: performance.now() };
    this.listeners.forEach((l) => l());
    void this.start();
  }

  private loadScript(): Promise<void> {
    if (typeof cheerpj().cheerpjInit === "function") return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = CHEERPJ_LOADER_SRC;
      script.async = true;
      const timer = window.setTimeout(
        () => reject(new Error("CheerpJ took too long to load")),
        LOADER_TIMEOUT_MS,
      );
      script.onload = () => {
        window.clearTimeout(timer);
        resolve();
      };
      script.onerror = () => {
        window.clearTimeout(timer);
        reject(new Error("Couldn't load CheerpJ"));
      };
      this.script = script;
      document.head.appendChild(script);
    });
  }

  /**
   * The game opens saves at resources/Save/GameSaves relative to the cwd
   * (/files/, writable and persisted in IndexedDB). Seed the shipped save
   * once; later visits keep the player's own saves.
   */
  private async seedSave() {
    const lib = await cheerpj().cheerpjRunLibrary("");
    const File = await lib.java.io.File;
    const dir = await new File(SAVE_DIR);
    if (await dir.exists()) return;
    await dir.mkdirs();
    const Files = await lib.java.nio.file.Files;
    const Paths = await lib.java.nio.file.Paths;
    await Files.copy(
      await Paths.get(SHIPPED_SAVE, []),
      await Paths.get(`${SAVE_DIR}/0`, []),
      [],
    );
  }

  /** CheerpJ adds a .cjWindow element once the game's JFrame is shown. */
  private watchForWindow() {
    const deadline = window.setTimeout(() => {
      observer.disconnect();
      this.fail(new Error("The game didn't start in time"));
    }, START_TIMEOUT_MS);
    const check = () => {
      const win = this.host.querySelector<HTMLElement>(".cjWindow");
      if (!win?.querySelector("canvas")) return false;
      observer.disconnect();
      this.alignToWindow(win);
      window.clearTimeout(deadline);
      this.set("starting");
      window.setTimeout(() => {
        this.set("running");
        this.focusUnlessElsewhere();
      }, FIRST_FRAME_DELAY_MS);
      return true;
    };
    const observer = new MutationObserver(check);
    if (!check()) {
      observer.observe(this.host, { childList: true, subtree: true });
    }
  }

  /** Record the AudioContexts CheerpJ creates so they can be suspended. */
  private trackAudio() {
    const Original = window.AudioContext;
    if (!Original || (Original as { __tracked?: boolean }).__tracked) return;
    const audio = this.audio;
    class TrackedAudioContext extends Original {
      static __tracked = true;
      constructor(options?: AudioContextOptions) {
        super(options);
        audio.push(this);
      }
    }
    window.AudioContext = TrackedAudioContext;
  }
}

let session: TransientSession | null = null;

/** The page's session, if the player has been started. */
export function getSession(): TransientSession | null {
  return session;
}

/**
 * Create the page's one session, with a display sized for a player column
 * `columnWidth` wide. Call attach() before start().
 */
export function createSession(columnWidth?: number): TransientSession {
  session ??= new TransientSession(
    columnWidth === undefined ? undefined : displayWidthFor(columnWidth),
  );
  return session;
}

/** Test hook: forget the session. */
export function resetSessionForTests() {
  session = null;
}
