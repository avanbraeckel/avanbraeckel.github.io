"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  getAmbientMotionPaused,
  subscribeAmbientMotion,
} from "@/design/ambientMotion";
import styles from "./LivingBackground.module.css";
import { createFrameLoop } from "./loop";
import { renderSize, scrollProgress } from "./math";
import { readPalette } from "./palette";
import { createFieldRenderer } from "./shader";
import { BACKGROUND_PARAMS, BackgroundSimulation } from "./simulation";

export interface LivingBackgroundProps {
  className?: string;
}

type Mode = "fallback" | "animated" | "static";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const DARK_SCHEME = "(prefers-color-scheme: dark)";
const MORE_CONTRAST = "(prefers-contrast: more)";

function media(query: string): MediaQueryList | null {
  return typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
    ? window.matchMedia(query)
    : null;
}

function subscribeReducedMotion(onChange: () => void) {
  const mql = media(REDUCED_MOTION);
  mql?.addEventListener?.("change", onChange);
  return () => mql?.removeEventListener?.("change", onChange);
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => media(REDUCED_MOTION)?.matches ?? false,
    () => false,
  );
}

/**
 * A fixed, full-viewport WebGL2 field behind the page content. Falls back to
 * a static CSS gradient without WebGL2, and renders a single still frame under
 * prefers-reduced-motion. The nav's pause toggle freezes the drift on its
 * current frame.
 */
export function LivingBackground({ className }: LivingBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();
  // Bumped after a lost WebGL context is restored, to rebuild the renderer.
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    // Mode and readiness are DOM state (data attributes), not React state:
    // they only drive CSS and never need a re-render.
    const setMode = (mode: Mode) => (root.dataset.mode = mode);
    const setReady = (ready: boolean) =>
      (canvas.dataset.ready = ready ? "true" : "false");
    const renderer = createFieldRenderer(canvas);
    if (!renderer) return;

    const p = BACKGROUND_PARAMS;
    const sim = new BackgroundSimulation(readPalette(), [
      Math.random() * 40,
      Math.random() * 40,
    ]);
    sim.setMoreContrast(media(MORE_CONTRAST)?.matches ?? false);

    const resize = () => {
      const { width, height } = renderSize(
        canvas.clientWidth || window.innerWidth,
        canvas.clientHeight || window.innerHeight,
        window.devicePixelRatio,
        p.resolutionScale,
        p.maxDpr,
      );
      renderer.resize(width, height);
    };

    const draw = () => renderer.render(sim.uniforms());
    let firstFrame = true;
    const present = () => {
      draw();
      if (firstFrame) {
        firstFrame = false;
        setReady(true);
      }
    };

    const cleanups: Array<() => void> = [];
    const on = <K extends keyof WindowEventMap>(
      target: Window | Document | HTMLElement,
      type: K | string,
      handler: (event: Event) => void,
      options: AddEventListenerOptions = { passive: true },
    ) => {
      target.addEventListener(type, handler, options);
      cleanups.push(() => target.removeEventListener(type, handler, options));
    };
    const onMedia = (query: string, handler: () => void) => {
      const mql = media(query);
      if (!mql?.addEventListener) return;
      mql.addEventListener("change", handler);
      cleanups.push(() => mql.removeEventListener("change", handler));
    };

    let refresh: () => void;

    if (reducedMotion) {
      // One still frame; redraw only when the size or palette changes.
      sim.step(0, { pointer: null, scroll: 0, idle: true });
      resize();
      present();
      setMode("static");
      refresh = () => {
        sim.setPalette(readPalette(), true);
        sim.setMoreContrast(media(MORE_CONTRAST)?.matches ?? false);
        sim.step(0, { pointer: null, scroll: 0, idle: true });
        draw();
      };
      on(window, "resize", () => {
        resize();
        draw();
      });
    } else {
      const pointer = null;
      let scroll = scrollProgress(
        window.scrollY,
        document.documentElement.scrollHeight,
        window.innerHeight,
      );
      let lastInput = performance.now();
      let lastDraw = -Infinity;

      const loop = createFrameLoop({
        tick(dt, now) {
          const idle = now - lastInput > p.idleAfterMs;
          const settled = sim.step(dt, { pointer, scroll, idle });
          const minInterval = sim.pointerMoving ? 0 : 1000 / p.driftFps - 2;
          if (settled || now - lastDraw >= minInterval) {
            lastDraw = now;
            present();
          }
          return !settled;
        },
      });
      cleanups.push(() => loop.dispose());

      const activity = () => {
        lastInput = performance.now();
        loop.wake();
      };
      let userPaused = false;
      refresh = () => {
        sim.setMoreContrast(media(MORE_CONTRAST)?.matches ?? false);
        if (userPaused) {
          // The loop is stopped, so apply the new palette now and redraw once.
          sim.setPalette(readPalette(), true);
          sim.step(0, { pointer, scroll, idle: true });
          draw();
          return;
        }
        sim.setPalette(readPalette());
        loop.wake();
      };

      // The visitor's pause (WCAG 2.2.2) freezes the field on its current
      // frame; resuming continues from there.
      const applyUserPause = () => {
        userPaused = getAmbientMotionPaused();
        loop.setPaused("user", userPaused);
        if (!userPaused) activity();
      };
      cleanups.push(subscribeAmbientMotion(applyUserPause));

      // The field doesn't follow the cursor; pointer movement only keeps the
      // drift awake.
      on(window, "pointermove", activity);
      on(window, "scroll", () => {
        scroll = scrollProgress(
          window.scrollY,
          document.documentElement.scrollHeight,
          window.innerHeight,
        );
        activity();
      });
      for (const type of ["pointerdown", "keydown", "wheel", "touchstart"]) {
        on(window, type, activity);
      }
      on(document, "visibilitychange", () => {
        loop.setPaused("hidden", document.visibilityState === "hidden");
      });
      on(window, "blur", () => loop.setPaused("blur", true));
      on(window, "focus", () => {
        loop.setPaused("blur", false);
        activity();
      });
      on(window, "resize", () => {
        resize();
        draw();
        activity();
      });
      if (document.visibilityState === "hidden") loop.setPaused("hidden", true);
      applyUserPause();

      resize();
      present();
      setMode("animated");
    }

    onMedia(DARK_SCHEME, () => refresh());
    onMedia(MORE_CONTRAST, () => refresh());
    // Theme switches that toggle a class or attribute on <html>.
    if (typeof MutationObserver !== "undefined") {
      const observer = new MutationObserver(() => refresh());
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "style", "data-theme"],
      });
      cleanups.push(() => observer.disconnect());
    }

    on(
      canvas,
      "webglcontextlost",
      (e) => {
        e.preventDefault();
        setReady(false);
        setMode("fallback");
        cleanups.forEach((fn) => fn());
        cleanups.length = 0;
        on(canvas, "webglcontextrestored", () => setGeneration((g) => g + 1));
      },
      { passive: false },
    );

    return () => {
      cleanups.forEach((fn) => fn());
      renderer.dispose();
      setReady(false);
      setMode("fallback");
    };
  }, [reducedMotion, generation]);

  return (
    <div
      ref={rootRef}
      className={className ? `${styles.root} ${className}` : styles.root}
      aria-hidden="true"
      data-mode="fallback"
    >
      <div className={styles.fallback} />
      <canvas ref={canvasRef} className={styles.canvas} data-ready="false" />
    </div>
  );
}
