"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { TemplateId } from "@/lib/types";
import { PAPER } from "@/lib/paper";

const ROOT_PX = PAPER.widthPx; // the sheet width in CSS pixels at 96dpi

/**
 * Scales a real A4 resume page down to fill its container width.
 * Used for the landing-page showcase and the template gallery, so what people
 * see is the actual rendered document rather than a drawn mock.
 */
export function SheetPreview({
  html,
  templateId,
  className,
  sheetClassName,
  animateKey,
}: {
  html: string;
  templateId: TemplateId;
  className?: string;
  sheetClassName?: string;
  /** change this value to replay the settle animation — e.g. on template switch */
  animateKey?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;

    const measure = () => {
      const next = wrap.clientWidth / ROOT_PX;
      if (!next) return;
      setScale(next);
      setHeight(inner.offsetHeight * next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [html, templateId]);

  return (
    <div
      ref={wrapRef}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ height: height ? `${height}px` : undefined }}
    >
      <div
        ref={innerRef}
        style={{
          width: PAPER.widthCss,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          visibility: scale ? "visible" : "hidden",
        }}
      >
        <article
          key={animateKey}
          className={cn(
            `resume-preview template-${templateId}`,
            animateKey && "enter-sheet",
            sheetClassName
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
