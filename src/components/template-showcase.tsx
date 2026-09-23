"use client";

import { useMemo, useState } from "react";
import { renderResumeHtml, TEMPLATE_META } from "@/lib/templates/render";
import { SAMPLE_CV } from "@/lib/cv-data";
import { ALL_TEMPLATES, type TemplateId } from "@/lib/types";
import { SheetPreview } from "@/components/sheet-preview";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

const HERO_TABS: TemplateId[] = ["jake", "harvard", "sidebar", "modern", "minimal"];

function useRendered(id: TemplateId) {
  return useMemo(() => renderResumeHtml(SAMPLE_CV, id), [id]);
}

/** Hero: pick a template by name, see the real rendered page. */
export function HeroShowcase() {
  const [active, setActive] = useState<TemplateId>("jake");
  const html = useRendered(active);
  const meta = TEMPLATE_META[active];

  return (
    <figure className="w-full">
      <div className="flex items-end gap-5 overflow-x-auto border-b border-rule pb-2 no-scrollbar">
        {HERO_TABS.map((id) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              aria-pressed={isActive}
              className={cn(
                "flex shrink-0 items-baseline gap-1.5 pb-1 text-[13px] transition-colors duration-200 ease-ink",
                isActive
                  ? "border-b-2 border-accent text-ink"
                  : "border-b-2 border-transparent text-ink-3 hover:text-ink"
              )}
            >
              {TEMPLATE_META[id].name}
              {TEMPLATE_META[id].pro && (
                <span className="micro rounded-print border border-accent px-1 py-px text-[9px] text-accent">
                  pro
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 bg-sheet p-2 shadow-[0_1px_2px_rgba(25,23,18,0.12)] ring-1 ring-rule sm:p-3">
        <SheetPreview html={html} templateId={active} animateKey={active} />
      </div>

      <figcaption className="mt-3 flex flex-wrap items-baseline gap-x-2 text-[12px] text-ink-3">
        <span className="text-ink-2">{meta.name}</span>
        <span aria-hidden>·</span>
        <span>{meta.description}</span>
        <span aria-hidden>·</span>
        <span>contoh isi, layout asli</span>
        <span className="text-ink-3">(5 dari 12 template, bagian atas halaman)</span>
      </figcaption>
    </figure>
  );
}

/** Gallery: every template, rendered for real. */
export function TemplateGallery() {
  const rendered = useMemo(
    () =>
      ALL_TEMPLATES.reduce<Record<string, string>>((acc, id) => {
        acc[id] = renderResumeHtml(SAMPLE_CV, id);
        return acc;
      }, {}),
    []
  );

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {ALL_TEMPLATES.map((id, i) => {
        const meta = TEMPLATE_META[id];
        return (
          // Offsetting by column position instead of absolute index keeps a row
          // sweeping left to right without the last row waiting half a second.
          <Reveal
            key={id}
            as="figure"
            rise="12px"
            delay={Math.min(i % 3, 2) * 90}
            className="flex flex-col"
          >
            <div className="bg-sheet p-1.5 ring-1 ring-rule transition-shadow duration-300 ease-print hover:shadow-[0_2px_10px_rgba(25,23,18,0.14)]">
              <SheetPreview html={rendered[id]} templateId={id} />
            </div>
            <figcaption className="mt-3 flex items-baseline justify-between gap-3 border-t border-rule pt-2">
              <span>
                <span className="font-display text-[17px] text-ink">{meta.name}</span>
                <span className="ml-2 text-[12px] text-ink-3">{meta.category}</span>
              </span>
              <span className="micro shrink-0 text-[10px]">
                {meta.pro ? <span className="text-accent">Pro</span> : "Gratis"}
              </span>
            </figcaption>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{meta.description}</p>
          </Reveal>
        );
      })}
    </div>
  );
}
