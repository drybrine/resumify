/**
 * `Content-Disposition` helpers shared by the export routes.
 *
 * Kept free of `server-only` so unit tests can exercise it directly.
 */

/** Reduce a CV title to a safe file stem (no path parts, no control characters). */
export function safeFileBase(title: string | null | undefined): string {
  const base = (title || "resume")
    // control characters (including CR/LF, which would split the header)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80)
    .replace(/^\.+/, "")
    .trim();
  return base || "resume";
}

/** Build a `Content-Disposition` header that survives odd CV titles. */
export function attachmentFilename(
  title: string | null | undefined,
  ext: string,
): string {
  const name = safeFileBase(title);
  const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/["]/g, "_");
  const encoded = encodeURIComponent(`${name}.${ext}`);
  return `attachment; filename="${ascii}.${ext}"; filename*=UTF-8''${encoded}`;
}
