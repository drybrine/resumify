import { normalizeCvData } from "./cv-data";
import { EMPTY_KIT } from "./apply/kit";
import type { CvData, PersonalInfo } from "./types";

/**
 * Bound a CV before it is written.
 *
 * `normalizeCvData` guarantees the *shape* (no undefined reads in a renderer)
 * but not the *size*: it passes strings through untouched and keeps every array
 * entry. A caller could therefore store megabytes in one row, which then travels
 * to the PDF renderer on every export. This trims each field, caps each list and
 * finally refuses the whole payload if it is still absurd.
 */

/** Hard ceiling for one CV's JSON. A photo alone may reach ~420 KB of data URL. */
export const CV_MAX_BYTES = 1024 * 1024;

const MAX_FIELD = 500;
const MAX_SUMMARY = 4_000;
const MAX_ITEMS = 40;
const MAX_BULLETS = 30;
const MAX_BULLET = 600;
const MAX_KIT_TEXT = 20_000;

const LIST_KEYS = [
  "education",
  "experience",
  "projects",
  "publications",
  "skills",
  "languages",
] as const;

function clip(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

export type BoundedCv =
  | { ok: true; data: CvData }
  | { ok: false; error: string };

export function boundCvData(input: unknown): BoundedCv {
  const data = normalizeCvData(input);

  for (const key of Object.keys(data.personal) as (keyof PersonalInfo)[]) {
    // The photo is a data URL validated by safePhoto; clipping it would corrupt it.
    if (key === "photo") continue;
    data.personal[key] = clip(data.personal[key] ?? "", MAX_FIELD);
  }

  data.summary = clip(data.summary, MAX_SUMMARY);

  for (const key of LIST_KEYS) {
    const items = (data[key] ?? []) as unknown as Record<string, unknown>[];
    const bounded = items.slice(0, MAX_ITEMS).map((item) => {
      const out: Record<string, unknown> = {};
      for (const [field, value] of Object.entries(item ?? {})) {
        if (Array.isArray(value)) {
          out[field] = value
            .slice(0, MAX_BULLETS)
            .map((entry) => clip(String(entry ?? ""), MAX_BULLET));
        } else {
          out[field] = clip(String(value ?? ""), MAX_FIELD);
        }
      }
      return out;
    });
    (data[key] as unknown as Record<string, unknown>[]) = bounded;
  }

  const kit = data.apply ?? EMPTY_KIT;
  data.apply = {
    ...kit,
    company: clip(kit.company, MAX_FIELD),
    role: clip(kit.role, MAX_FIELD),
    source: clip(kit.source, MAX_FIELD),
    jobAd: clip(kit.jobAd, MAX_KIT_TEXT),
    letter: clip(kit.letter, MAX_KIT_TEXT),
  };

  const bytes = new TextEncoder().encode(JSON.stringify(data)).length;
  if (bytes > CV_MAX_BYTES) {
    return {
      ok: false,
      error: `CV-nya terlalu besar (${Math.round(bytes / 1024)} KB). Kurangi isinya, atau kecilkan fotonya.`,
    };
  }

  return { ok: true, data };
}

/** Titles are rendered in lists, PDFs and the browser tab; keep them short. */
export const TITLE_MAX = 200;

export function boundTitle(title: string | undefined, fallback: string): string {
  const value = (title ?? "").trim();
  return value ? clip(value, TITLE_MAX) : fallback;
}
