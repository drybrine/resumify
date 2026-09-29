/**
 * Optional profile photo.
 *
 * The photo is stored **inline in the CV's `data` JSON** as a data URL, not in a
 * storage bucket. That is a deliberate trade: a bucket needs a migration (new
 * table/bucket + RLS policies) and the live Supabase project cannot be migrated
 * from here, so anything bucket-based would not actually work in production
 * today. A capped data URL works everywhere the app already runs.
 *
 * The cost is that the photo travels with every save, so it is bounded hard:
 * the editor downscales to `PHOTO_MAX_PX` before encoding, and anything that
 * arrives over the wire bigger than the cap is dropped by `safePhoto`.
 *
 * Kept free of Node APIs so the client editor and the server renderers can both
 * import it.
 */

/** Longest edge the editor keeps before encoding, in CSS pixels. */
export const PHOTO_MAX_PX = 400;

/** Quality for the JPEG the editor produces. */
export const PHOTO_QUALITY = 0.82;

/**
 * Hard cap on the stored data URL. 400px @ q0.82 lands around 25–60 KB, i.e.
 * ~35–80k characters; this leaves headroom while refusing anything absurd.
 */
export const PHOTO_MAX_CHARS = 420_000;

/**
 * Raster formats only, base64 only.
 *
 * SVG is excluded on purpose: an SVG data URL can carry `<script>`, and this
 * string ends up in an `src` attribute of a document that is rendered by a
 * headless browser on the server.
 */
const DATA_URL = /^data:image\/(?:png|jpeg|jpg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

/** Returns the photo if it is a usable data URL, otherwise an empty string. */
export function safePhoto(photo: unknown): string {
  if (typeof photo !== "string") return "";
  const value = photo.trim();
  if (!value || value.length > PHOTO_MAX_CHARS) return "";
  if (!DATA_URL.test(value)) return "";
  return value;
}

export const hasPhoto = (photo: unknown): boolean => safePhoto(photo) !== "";
