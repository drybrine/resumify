import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function ensureUrl(href: string): string {
  const input = href.trim();
  if (!input) return "";

  const explicitHttpUrl = /^https?:\/\//i.test(input);
  const protocolRelativeUrl = input.startsWith("//");
  const schemeLikeUrl = /^[a-z][a-z\d+.-]*:/i.test(input);
  const hasPort = /^[^/:?#]+:\d+(?:[/?#]|$)/.test(input);
  const candidate = protocolRelativeUrl
    ? `https:${input}`
    : explicitHttpUrl || (schemeLikeUrl && !hasPort)
      ? input
      : `https://${input}`;

  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : "";
  } catch {
    return "";
  }
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
