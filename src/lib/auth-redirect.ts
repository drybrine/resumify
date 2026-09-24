const DEFAULT_REDIRECT = "/dashboard";
const BLOCKED_FIRST_SEGMENT = /^(?:https?:|javascript:|data:)/i;

/** Resolve a user-controlled auth `next` value only to a same-origin local URL. */
export function safeInternalPath(value: string, origin = "https://internal.invalid"): string {
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return DEFAULT_REDIRECT;
  }

  const firstSegment = value.split(/[/?#]/, 2)[1]?.toLowerCase();
  if (BLOCKED_FIRST_SEGMENT.test(firstSegment || "")) return DEFAULT_REDIRECT;

  try {
    const base = new URL(origin);
    const target = new URL(value, base);
    if (target.origin !== base.origin) return DEFAULT_REDIRECT;
    return origin === "https://internal.invalid"
      ? `${target.pathname}${target.search}${target.hash}`
      : target.href;
  } catch {
    return DEFAULT_REDIRECT;
  }
}
