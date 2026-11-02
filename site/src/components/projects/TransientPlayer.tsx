"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Picture } from "@/components/Picture";
import { Button, Icon } from "@/components/ui";
import { TRANSIENT_DOWNLOAD_HREF } from "@/content/projects";
import styles from "./TransientPlayer.module.css";
import {
  CHEERPJ_URL,
  createSession,
  GAME_HEIGHT,
  getSession,
  visibleHeight,
  type SessionState,
  type Stage,
  type TransientSession,
} from "./transientRuntime";

export interface TransientPlayerProps {
  /** Load the poster eagerly (it sits above the fold on /projects/transient). */
  priority?: boolean;
}

export const TRANSIENT_CONTROLS: { action: string; keys: string[] }[] = [
  { action: "Move", keys: ["←", "→"] },
  { action: "Jump", keys: ["Space"] },
  { action: "Sword: light, medium, heavy", keys: ["A", "S", "D"] },
  { action: "Quick shot (midair), strong shot", keys: ["Q", "W"] },
  { action: "Flash step", keys: ["Shift"] },
  { action: "Glide", keys: ["Ctrl"] },
  { action: "Menus: select, back", keys: ["Enter", "Backspace"] },
];

/** Loading stages, with the share of the bar each fills and a typical time. */
const STAGES: Record<
  "runtime" | "game" | "starting",
  { label: string; from: number; to: number; expectedMs: number }
> = {
  runtime: {
    label: "Loading the Java runtime",
    from: 0,
    to: 0.35,
    expectedMs: 4000,
  },
  game: { label: "Loading the game", from: 0.35, to: 0.88, expectedMs: 7000 },
  starting: { label: "Starting", from: 0.88, to: 1, expectedMs: 1200 },
};

const LOADING: Stage[] = ["runtime", "game", "starting"];

/**
 * The game reads Backspace, Esc, and every other key it uses, but never Tab, so
 * Tab is the way out: it is the one key that already means "move on", and a
 * keyboard user needs no new shortcut to find.
 */
const LEAVE_HINT_ID = "transient-leave-hint";
const LEAVE_HINT = "Press Tab to leave the game.";

/** Polite status line for the live region (empty while idle). */
function announcement(state: SessionState | null, canRetry: boolean): string {
  switch (state?.stage) {
    case "runtime":
    case "game":
    case "starting":
      return `${STAGES[state.stage].label}.`;
    case "running":
      return `Transient is running. ${LEAVE_HINT}`;
    case "error":
      return `Transient couldn’t start here. ${
        canRetry ? "Try again" : "Reload the page"
      }, or download the game.`;
    case "exited":
      return "The game has closed. Reload the page to play again.";
    default:
      return "";
  }
}

function progressFor(state: SessionState, now: number): number {
  if (!LOADING.includes(state.stage)) return 1;
  const s = STAGES[state.stage as keyof typeof STAGES];
  // Ease toward the end of the stage; never claim it is done before it is.
  const t = 1 - Math.exp(-(now - state.since) / s.expectedMs);
  return s.from + (s.to - s.from) * 0.95 * t;
}

const noSubscribe = () => () => {};
const idleState = (): SessionState | null => null;

function useSessionState(session: TransientSession | null) {
  return useSyncExternalStore(
    session ? session.subscribe : noSubscribe,
    session ? session.getState : idleState,
    idleState,
  );
}

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== "function") return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () =>
      typeof window.matchMedia === "function" &&
      window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * Transient, playable in the browser.
 *
 * Shows a poster until the visitor clicks Play; only then is CheerpJ (a JVM
 * in WebAssembly, ~40 MB with the game) loaded. The game renders at its
 * native 640x480 inside a container that scales down to fit narrow columns
 * and up to fill the screen in fullscreen.
 */
export function TransientPlayer({ priority = false }: TransientPlayerProps) {
  const [session, setSession] = useState<TransientSession | null>(getSession);
  const state = useSessionState(session);
  const stage = state?.stage ?? null;
  const loading = stage !== null && LOADING.includes(stage);

  const figureRef = useRef<HTMLElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  /** Room for the game: the column, or the whole screen in fullscreen. */
  const [room, setRoom] = useState({ width: 0, height: 0, fullscreen: false });
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [now, setNow] = useState(0);
  const touchOnly = useMediaQuery("(pointer: coarse) and (hover: none)");

  // Adopt the display (fresh, or kept from an earlier visit to this page).
  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!session || !slot) return;
    session.attach(slot);
    return () => session.park();
  }, [session]);

  const play = useCallback(() => {
    const next = createSession(figureRef.current?.clientWidth);
    setSession(next);
    // Start once the display slot is mounted and laid out.
    requestAnimationFrame(() => void next.start());
  }, []);

  // Track the room the game has: down to the column width, up to the screen
  // in fullscreen.
  useEffect(() => {
    const figure = figureRef.current;
    const screenEl = screenRef.current;
    if (!session || !figure || !screenEl) return;
    if (typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const fs = document.fullscreenElement === screenEl;
      setRoom({
        width: fs ? screenEl.clientWidth : figure.clientWidth,
        height: fs ? screenEl.clientHeight : Infinity,
        fullscreen: fs,
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(figure);
    observer.observe(screenEl);
    return () => observer.disconnect();
  }, [session]);

  // Fullscreen state, plus keyboard lock so Ctrl+W reaches the game.
  useEffect(() => {
    const onChange = () => {
      const fs = document.fullscreenElement === screenRef.current;
      setFullscreen(fs);
      const keyboard = (
        navigator as Navigator & {
          keyboard?: { lock?: () => Promise<void>; unlock?: () => void };
        }
      ).keyboard;
      if (fs) void keyboard?.lock?.().catch(() => {});
      else keyboard?.unlock?.();
      session?.focus();
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [session]);

  // Name the game's keyboard input once it is running.
  useEffect(() => {
    if (stage === "running") {
      session?.prepareKeyboard("Transient game", LEAVE_HINT_ID);
    }
  }, [session, stage]);

  // Keep keyboard focus somewhere sensible as the player changes: the panel
  // that replaces the play button, then the first action of an error or
  // closed message. Only when focus was on the player or lost, so a visitor
  // who tabbed elsewhere is not pulled back.
  useEffect(() => {
    const stageEl = stageRef.current;
    if (!stageEl || !stage || stage === "running") return;
    const active = document.activeElement;
    if (active && active !== document.body && !stageEl.contains(active)) {
      return;
    }
    const target =
      stage === "error" || stage === "exited"
        ? stageEl.querySelector<HTMLElement>("button")
        : stageEl;
    target?.focus({ preventScroll: true });
  }, [stage]);

  // Tick the loading bar.
  useEffect(() => {
    if (!loading) return;
    const tick = () => setNow(performance.now());
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [loading]);

  // Ask before leaving mid-game (catches an accidental Ctrl+W).
  useEffect(() => {
    if (stage !== "running" && stage !== "starting") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [stage]);

  const toggleFullscreen = () => {
    const screenEl = screenRef.current;
    if (!screenEl) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void screenEl.requestFullscreen?.().catch(() => {});
  };

  const closeControls = (returnToGame = true) => {
    setShowControls(false);
    // Closing with the toggle keeps focus on it; clicking the panel resumes.
    if (returnToGame) session?.focus();
  };

  const layout = state?.layout;
  const shownHeight = layout ? visibleHeight(layout) : 0;
  const fit =
    layout && room.width > 0
      ? Math.min(room.width / layout.width, room.height / shownHeight)
      : 1;
  // Inline the game never scales up (it would blur); fullscreen fills.
  const scale = room.fullscreen ? fit : Math.min(1, fit);

  const progress = state ? progressFor(state, now) : 0;
  const stageInfo =
    stage && LOADING.includes(stage)
      ? STAGES[stage as keyof typeof STAGES]
      : null;

  return (
    <figure
      ref={figureRef}
      className={styles.player}
      aria-label="Transient, playable in the browser"
    >
      <div
        ref={screenRef}
        className={styles.screen}
        data-active={session ? "" : undefined}
        data-stage={stage ?? "idle"}
      >
        {!session ? (
          <>
            <Picture
              id="transient-screenshot"
              fill
              priority={priority}
              sizes="(min-width: 64rem) 64rem, 100vw"
              className={styles.poster}
            />
            <div className={styles.scrim} aria-hidden="true" />
            <div className={styles.control}>
              <button
                type="button"
                className={styles.play}
                onClick={play}
                aria-describedby="transient-player-note"
              >
                <Icon name="play" className={styles.playIcon} />
                <span className="visually-hidden">Play in browser</span>
              </button>
              <p id="transient-player-note" className={styles.status}>
                Play in browser · about 40 MB
              </p>
              {touchOnly && (
                <p className={styles.status}>Best on desktop with a keyboard</p>
              )}
            </div>
          </>
        ) : (
          <div
            ref={stageRef}
            className={styles.stage}
            role="group"
            aria-label="Transient game"
            aria-describedby={stage === "running" ? LEAVE_HINT_ID : undefined}
            tabIndex={-1}
            data-transient-stage=""
            onKeyDownCapture={(e) => {
              // CheerpJ swallows Tab, trapping focus in the game. Stop the
              // event before it gets there so the browser moves focus on.
              if (
                stage === "running" &&
                e.key === "Tab" &&
                !e.ctrlKey &&
                !e.altKey &&
                !e.metaKey
              ) {
                e.stopPropagation();
              }
            }}
            style={
              {
                width: (layout?.width ?? 0) * scale,
                height: shownHeight * scale,
                "--game-height": `${GAME_HEIGHT * scale}px`,
              } as CSSProperties
            }
            onPointerDown={() => session.focus()}
          >
            <div
              ref={slotRef}
              className={styles.slot}
              data-testid="transient-display"
              style={{
                width: layout?.width,
                height: shownHeight,
                transform: `scale(${scale})`,
              }}
              aria-hidden={stage !== "running" ? true : undefined}
            />

            {stageInfo && (
              <div className={styles.overlay}>
                <div className={styles.loading}>
                  <p className={styles.loadingLabel}>{stageInfo.label}…</p>
                  <div
                    className={styles.progress}
                    role="progressbar"
                    aria-label="Loading Transient"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress * 100)}
                    aria-valuetext={stageInfo.label}
                  >
                    <div
                      className={styles.progressFill}
                      style={{ transform: `scaleX(${progress})` }}
                    />
                  </div>
                  <ol className={styles.steps}>
                    {LOADING.map((s) => (
                      <li
                        key={s}
                        data-state={
                          s === stage
                            ? "current"
                            : LOADING.indexOf(s) < LOADING.indexOf(stage!)
                              ? "done"
                              : "pending"
                        }
                      >
                        {STAGES[s as keyof typeof STAGES].label}
                      </li>
                    ))}
                  </ol>
                </div>
                <Controls />
              </div>
            )}

            {stage === "error" && (
              <div className={styles.overlay}>
                <div className={styles.message}>
                  <p className={styles.messageTitle}>
                    Transient couldn’t start here.
                  </p>
                  <p className={styles.messageBody}>
                    {session.canRetryInPlace
                      ? "The Java runtime didn’t load. Check your connection and try again, or download the game."
                      : "Something went wrong running the game. Reload the page to try again, or download the game."}
                  </p>
                  <div className={styles.messageActions}>
                    <Button
                      variant="filled"
                      size="small"
                      onClick={() => session.retry()}
                    >
                      {session.canRetryInPlace ? "Try again" : "Reload page"}
                    </Button>
                    <Button
                      href={TRANSIENT_DOWNLOAD_HREF}
                      download
                      variant="tinted"
                      size="small"
                      icon="download"
                    >
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {stage === "exited" && (
              <div className={styles.overlay}>
                <div className={styles.message}>
                  <p className={styles.messageTitle}>The game has closed.</p>
                  <p className={styles.messageBody}>
                    The Java runtime can only start once per visit. Reload the
                    page to play again.
                  </p>
                  <div className={styles.messageActions}>
                    <Button
                      variant="filled"
                      size="small"
                      onClick={() => window.location.reload()}
                    >
                      Reload page
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {stage === "running" && showControls && (
              <div
                className={`${styles.overlay} ${styles.controlsOverlay}`}
                onClick={() => closeControls()}
              >
                <Controls />
                <p className={styles.dismissHint}>
                  Click to return to the game
                </p>
              </div>
            )}
          </div>
        )}

        {fullscreen && (
          <button
            type="button"
            className={styles.exitFullscreen}
            onClick={toggleFullscreen}
          >
            <Icon name="collapse" />
            <span className="visually-hidden">Exit full screen</span>
          </button>
        )}
      </div>

      <p className="visually-hidden" role="status">
        {announcement(state, session?.canRetryInPlace ?? false)}
      </p>

      <figcaption className={styles.bar}>
        <p className={styles.credit}>
          {stage === "running" && (
            <>
              <span id={LEAVE_HINT_ID} className={styles.leaveHint}>
                {LEAVE_HINT}
              </span>{" "}
            </>
          )}
          {session
            ? stage === "running"
              ? "Click the game if keys stop responding."
              : "Runs in your browser, no install."
            : touchOnly
              ? "Needs a keyboard to play."
              : "Runs in your browser, no install."}{" "}
          Built with{" "}
          <a href={CHEERPJ_URL} target="_blank" rel="noopener noreferrer">
            CheerpJ
          </a>
          .
        </p>
        <div className={styles.barActions}>
          {stage === "running" && (
            <Button
              variant="plain"
              size="small"
              icon="keyboard"
              aria-pressed={showControls}
              onClick={() =>
                showControls ? closeControls(false) : setShowControls(true)
              }
            >
              Controls
            </Button>
          )}
          {session && (
            <Button
              variant="plain"
              size="small"
              icon={fullscreen ? "collapse" : "expand"}
              onClick={toggleFullscreen}
            >
              Full screen
            </Button>
          )}
          <Button
            href={TRANSIENT_DOWNLOAD_HREF}
            download
            variant="plain"
            size="small"
            icon="download"
          >
            Download instead
          </Button>
        </div>
      </figcaption>
    </figure>
  );
}

function Controls() {
  return (
    <div className={styles.controls}>
      <p className={styles.controlsTitle}>Controls</p>
      <dl className={styles.controlsList}>
        {TRANSIENT_CONTROLS.map(({ action, keys }) => (
          <div key={action} className={styles.controlsRow}>
            <dt>{action}</dt>
            <dd>
              {keys.map((key) => (
                <kbd key={key}>{key}</kbd>
              ))}
            </dd>
          </div>
        ))}
      </dl>
      <p className={styles.warning}>
        Heads up: glide + strong shot is <kbd>Ctrl</kbd> + <kbd>W</kbd>, which
        closes the tab! In full screen (Chrome, Edge), the game catches it
        instead.
      </p>
    </div>
  );
}
