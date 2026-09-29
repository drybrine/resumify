import type { ApplicationKit } from "@/lib/types";

/**
 * Per-application data attached to a CV.
 *
 * Kept in the CV's `data` JSON rather than its own table: a new table needs a
 * migration, and the live Supabase project cannot be migrated from here, so a
 * table-backed feature would not actually work in production today.
 */

export const EMPTY_KIT: ApplicationKit = {
  company: "",
  role: "",
  source: "",
  jobAd: "",
  letter: "",
  language: "id",
  updatedAt: "",
};

const text = (value: unknown, max: number): string =>
  typeof value === "string" ? value.slice(0, max).trim() : "";

export function normalizeApplicationKit(input: unknown): ApplicationKit {
  const raw =
    input && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};

  return {
    company: text(raw.company, 120),
    role: text(raw.role, 120),
    source: text(raw.source, 80),
    // A pasted job ad is bounded so one save cannot blow up the row.
    jobAd: text(raw.jobAd, 20_000),
    letter: text(raw.letter, 20_000),
    language: raw.language === "en" ? "en" : "id",
    updatedAt: text(raw.updatedAt, 40),
  };
}

/** True when there is anything worth showing for this application. */
export function hasKit(kit: ApplicationKit | undefined): boolean {
  if (!kit) return false;
  return Boolean(kit.company || kit.role || kit.jobAd || kit.letter);
}
