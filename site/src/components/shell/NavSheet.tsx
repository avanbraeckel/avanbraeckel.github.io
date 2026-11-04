"use client";

import { Dialog } from "radix-ui";
import NextLink from "next/link";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react";
import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { Button, Icon } from "@/components/ui";
import { cx } from "@/components/ui/cx";
import { site } from "@/content/site";
import { useMotionPreference } from "@/design/motion";
import { MotionToggle } from "./MotionToggle";
import { ThemeToggle } from "./ThemeToggle";
import { ariaCurrent } from "./navigation";
import { VelocityTracker, dragOffset, releaseDecision } from "./sheetPhysics";
import styles from "./NavSheet.module.css";

/** Matches the desktop breakpoint in SiteNav.module.css. */
const DESKTOP_QUERY = "(min-width: 48rem)";
/**
 * The sheet extends this far below the viewport so momentum overshoot and
 * rubber-banding above the open position never reveal its bottom edge.
 */
const SKIRT = 400;
/** Extra travel past the sheet's height when closed, so its shadow clears too. */
const CLOSED_MARGIN = 24;
/** Movement before a press becomes a drag (captures the pointer, cancels the tap). */
const DRAG_SLOP = 6;

export interface NavMenuProps {
  pathname: string | null;
}

/**
 * Mobile navigation: a menu button that opens a draggable bottom sheet.
 * Radix Dialog provides the focus trap, Escape, outside-press, and aria; the
 * sheet stays mounted after `open` turns false until its exit animation ends,
 * so it can be grabbed again mid-flight.
 */
export function NavMenu({ pathname }: NavMenuProps) {
  const [open, setOpen] = useState(false);
  const [present, setPresent] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  // Close when the route changes (link taps, back/forward).
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
  }

  const onOpenChange = (next: boolean) => {
    if (next) setPresent(true);
    setOpen(next);
  };

  // The sheet is a mobile pattern; dismiss it if the window grows to desktop.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => {
      if (query.matches) setOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger className={styles.trigger} aria-label="Menu">
        <Icon name="menu" size="1.375rem" />
      </Dialog.Trigger>
      {present && (
        <Dialog.Portal forceMount>
          <NavSheet
            open={open}
            onOpenChange={onOpenChange}
            onExited={() => setPresent(false)}
            pathname={pathname}
          />
        </Dialog.Portal>
      )}
    </Dialog.Root>
  );
}

interface NavSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExited: () => void;
  pathname: string | null;
}

interface DragState {
  pointerId: number;
  startY: number;
  /** Raw (un-rubber-banded) offset at pointer-down, so the grab point stays under the finger. */
  origin: number;
  captured: boolean;
}

/** Inverse of the rubber-band above the open position, for grabbing mid-overshoot. */
function rawFromDisplayed(displayed: number, dimension: number, c = 0.55) {
  if (displayed >= 0) return displayed;
  const b = Math.min(-displayed, dimension * 0.99);
  return -((b * dimension) / (c * (dimension - b)));
}

function NavSheet({ open, onOpenChange, onExited, pathname }: NavSheetProps) {
  const { reduced, spring } = useMotionPreference();
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** Offset from the open position, in px. 0 = open, closedY = closed. */
  const y = useMotionValue(0);
  /** Opacity, used for the reduced-motion cross-fade. */
  const fade = useMotionValue(reduced ? 0 : 1);
  const closedY = useRef(1);
  /** The state the sheet is currently settling toward (null before mount). */
  const target = useRef<boolean | null>(null);
  const animations = useRef<AnimationPlaybackControls[]>([]);
  const drag = useRef<DragState | null>(null);
  const tracker = useRef(new VelocityTracker());
  const suppressClick = useRef(false);

  const scrimOpacity = useTransform(() => {
    const progress = 1 - Math.min(Math.max(y.get() / closedY.current, 0), 1);
    return fade.get() * progress;
  });

  const measure = () => {
    const height = panelRef.current?.offsetHeight ?? 0;
    closedY.current = Math.max(height - SKIRT, 0) + CLOSED_MARGIN;
    return closedY.current;
  };

  const stop = () => {
    animations.current.forEach((a) => a.stop());
    animations.current = [];
  };

  /** Animate toward open/closed from the current on-screen value. */
  const settle = (toOpen: boolean, velocity = 0, momentum = false) => {
    stop();
    target.current = toOpen;
    const closed = measure();
    const done = () => {
      if (!toOpen && target.current === false) onExited();
    };
    if (reduced) {
      // Cross-fade instead of sliding; a dragged sheet fades where it is.
      animations.current.push(
        animate(fade, toOpen ? 1 : 0, { ...spring.default, onComplete: done }),
      );
      if (toOpen) animations.current.push(animate(y, 0, spring.default));
      return;
    }
    const transition = momentum ? spring.momentum : spring.default;
    animations.current.push(
      animate(y, toOpen ? 0 : closed, {
        ...transition,
        velocity,
        onComplete: done,
      }),
    );
  };

  // Enter from below (or fade in under reduced motion) before first paint.
  useLayoutEffect(() => {
    const closed = measure();
    if (reduced) {
      y.set(0);
      fade.set(0);
    } else {
      y.set(closed);
      fade.set(1);
    }
    // Mount-only: later changes to `reduced` apply to the next animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onOpenProp = useEffectEvent((next: boolean) => {
    // Releases settle themselves (with velocity) before reporting the change.
    if (target.current !== next) settle(next);
  });
  useEffect(() => onOpenProp(open), [open]);

  useEffect(() => stop, []);

  const release = (event: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId) return;
    drag.current = null;
    delete event.currentTarget.dataset.dragging;
    if (!state.captured) {
      // A tap, not a drag: resume wherever the sheet was heading.
      settle(target.current ?? open);
      return;
    }
    suppressClick.current = true;
    const velocity = cancelled ? 0 : tracker.current.velocity(event.timeStamp);
    const decision = releaseDecision(y.get(), velocity, closedY.current);
    settle(decision.open, velocity, decision.momentum);
    if (decision.open !== open) onOpenChange(decision.open);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current || (event.pointerType === "mouse" && event.button !== 0))
      return;
    const scroller = scrollRef.current;
    if (
      scroller &&
      scroller.scrollHeight > scroller.clientHeight &&
      scroller.contains(event.target as Node)
    ) {
      return; // let overflowing content scroll instead
    }
    stop(); // grab mid-flight: continue from the on-screen value
    const closed = measure();
    suppressClick.current = false;
    drag.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      origin: rawFromDisplayed(y.get(), closed),
      captured: false,
    };
    tracker.current.reset();
    tracker.current.add(event.timeStamp, y.get());
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || event.pointerId !== state.pointerId) return;
    const dy = event.clientY - state.startY;
    if (!state.captured && Math.abs(dy) > DRAG_SLOP) {
      state.captured = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      // A drag, not a press: drop the pressed-row highlight (CSS only, no re-render).
      event.currentTarget.dataset.dragging = "";
    }
    // 1:1 from the very first move; the slop only decides tap vs. drag.
    const next = dragOffset(state.origin + dy, closedY.current);
    y.set(next);
    tracker.current.add(event.timeStamp, next);
  };

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const close = () => onOpenChange(false);

  return (
    <>
      <Dialog.Overlay forceMount asChild>
        <motion.div
          className={styles.scrim}
          // Global names: these stay live above the cross-fading page (shell.css).
          style={{ opacity: scrimOpacity, viewTransitionName: "nav-scrim" }}
        />
      </Dialog.Overlay>
      <Dialog.Content
        forceMount
        asChild
        ref={panelRef}
        aria-describedby={undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => release(event, false)}
        onPointerCancel={(event) => release(event, true)}
        onClickCapture={onClickCapture}
        onDragStart={(event) => event.preventDefault()}
      >
        <motion.div
          className={styles.sheet}
          style={{
            y,
            opacity: fade,
            viewTransitionName: "nav-sheet",
            ["--sheet-skirt" as string]: `${SKIRT}px`,
          }}
          data-state={open ? "open" : "closed"}
        >
          <div className={styles.grabber} aria-hidden="true" />
          <div className={styles.header}>
            <Dialog.Title className={cx("t-headline", styles.title)}>
              Menu
            </Dialog.Title>
            <Dialog.Close className={styles.close} aria-label="Close menu">
              <Icon name="close" size="1.125rem" />
            </Dialog.Close>
          </div>
          <div ref={scrollRef} className={styles.body}>
            <nav aria-label="Main">
              <ul role="list" className={styles.list}>
                {site.nav.map((item) => {
                  const current = ariaCurrent(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <NextLink
                        href={item.href}
                        aria-current={current}
                        className={cx(styles.item, current && styles.active)}
                        onClick={close}
                        draggable={false}
                      >
                        <span>{item.label}</span>
                        <Icon name="arrow" className={styles.chevron} />
                      </NextLink>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className={styles.actions}>
              <MotionToggle variant="row" />
              <ThemeToggle variant="row" />
              {site.resume && (
                <Button
                  href={site.resume.href}
                  newTab
                  icon="document"
                  size="large"
                  fullWidth
                  onClick={close}
                >
                  {site.resume.label}
                </Button>
              )}
              <div className={styles.social}>
                {site.social.map((link) => (
                  <Button
                    key={link.href}
                    href={link.href}
                    variant="tinted"
                    icon={link.icon}
                    fullWidth
                    onClick={close}
                  >
                    {link.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </Dialog.Content>
    </>
  );
}
