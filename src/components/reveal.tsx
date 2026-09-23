"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Reveals its children once they actually enter the viewport.
 *
 * The hidden state lives in CSS behind a `[data-motion="on"]` gate that a small
 * inline script in the root layout sets only when motion is welcome. So a reader
 * who asked for reduced motion never sees a hidden state, and if that one script
 * is ever blocked the content stays visible instead of being stranded behind an
 * animation that cannot run.
 *
 * Use the `.enter-*` classes for above-the-fold content instead — this waits for
 * hydration, which would flash.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  rise,
  as = "div",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  /** stagger offset, in ms */
  delay?: number;
  /** override the travel distance — e.g. "8px" for tight rows */
  rise?: string;
  as?:
    | "div"
    | "li"
    | "section"
    | "article"
    | "figure"
    | "nav"
    | "ol"
    | "ul"
    | "tr"
    | "dl";
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      // No observer available: show rather than strand the content behind the
      // hidden state. Deferred a frame on purpose — a synchronous setState in
      // the effect body would cascade an extra render before paint.
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }

    // threshold 0 rather than a fraction: a target taller than the viewport can
    // never reach a ratio like 0.1, so it would wait forever.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as;

  return (
    <Tag
      {...rest}
      ref={ref as React.Ref<never>}
      data-reveal=""
      data-in={shown ? "" : undefined}
      style={
        {
          "--d": `${delay}ms`,
          ...(rise ? { "--rise": rise } : {}),
          ...rest.style,
        } as React.CSSProperties
      }
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}
