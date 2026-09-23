"use client";

import { cn } from "@/lib/utils";

export const SECTIONS = [
  { id: "personal", label: "Identitas" },
  { id: "summary", label: "Ringkasan" },
  { id: "education", label: "Pendidikan" },
  { id: "experience", label: "Pengalaman" },
  { id: "projects", label: "Proyek" },
  { id: "publications", label: "Publikasi" },
  { id: "skills", label: "Keahlian" },
  { id: "languages", label: "Bahasa" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

function Dot({ filled, label }: { filled: boolean; label: string }) {
  return (
    <span
      title={filled ? `${label} sudah terisi` : `${label} belum terisi`}
      className={cn(
        "h-1.5 w-1.5 shrink-0 rounded-full",
        filled ? "bg-accent" : "bg-rule-strong"
      )}
    >
      <span className="sr-only">
        {filled ? "sudah terisi" : "belum terisi"}
      </span>
    </span>
  );
}

/** Desktop: a table-of-contents rail, with a dot for sections that already have content. */
export function SectionRail({
  active,
  completed,
  onChange,
}: {
  active: SectionId;
  completed: Record<SectionId, boolean>;
  onChange: (id: SectionId) => void;
}) {
  return (
    <nav
      aria-label="Bagian CV"
      className="hidden min-h-0 overflow-y-auto border-r border-rule bg-paper px-3 py-4 lg:block"
    >
      <p className="micro px-2">Isi CV</p>
      <p className="mb-3 flex flex-col gap-1 px-2 pt-2 text-[11px] text-ink-3">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          sudah terisi
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-rule-strong" />
          belum diisi
        </span>
      </p>
      <ul className="space-y-0.5">
        {SECTIONS.map((section, i) => {
          const isActive = section.id === active;
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => onChange(section.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-print border-l-2 px-2 py-2 text-left text-[13px] transition-colors",
                  isActive
                    ? "border-accent bg-sheet text-ink"
                    : "border-transparent text-ink-2 hover:bg-sheet hover:text-ink"
                )}
              >
                <span className="micro num w-4 shrink-0 text-[10px]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 truncate">{section.label}</span>
                <Dot filled={completed[section.id]} label={section.label} />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Mobile: the same list, horizontally scrollable. */
export function SectionTabs({
  active,
  completed,
  onChange,
}: {
  active: SectionId;
  completed: Record<SectionId, boolean>;
  onChange: (id: SectionId) => void;
}) {
  return (
    <nav
      aria-label="Bagian CV"
      className="border-b border-rule bg-paper no-scrollbar lg:hidden"
    >
      <ul className="flex gap-4 overflow-x-auto px-4 py-3">
        {SECTIONS.map((section) => {
          const isActive = section.id === active;
          return (
            <li key={section.id} className="relative shrink-0">
              <button
                type="button"
                onClick={() => onChange(section.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "flex items-center gap-2 border-b-2 pb-0.5 text-[13px] transition-colors",
                  isActive
                    ? "border-accent text-ink"
                    : "border-transparent text-ink-3"
                )}
              >
                {section.label}
                <Dot filled={completed[section.id]} label={section.label} />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
