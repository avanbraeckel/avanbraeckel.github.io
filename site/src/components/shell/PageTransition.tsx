import { ViewTransition, type ReactNode } from "react";

/**
 * Fades page content in on route changes using React's <ViewTransition>
 * (the browser View Transitions API); the nav and background stay put. Lives in the root layout, so it never
 * enters or exits; navigations mutate its contents and trigger "update".
 * Browsers without the API swap instantly. The animation itself is in
 * shell.css, and is disabled under prefers-reduced-motion.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition update="page-fade" default="none">
      {children}
    </ViewTransition>
  );
}
