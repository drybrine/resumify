import "server-only";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Fixed-window rate limiting backed by Postgres.
 *
 * Serverless runs many instances at once, so a module-level Map would reset on
 * every cold start and never see the other instances. The counter lives in one
 * row per key and is incremented by a single atomic upsert
 * (`public.consume_rate_limit`), which is what makes it hold under concurrency.
 */

export type RateLimit = {
  /** Requests allowed per window. */
  max: number;
  /** Window length in seconds. */
  windowSec: number;
};

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: Date | null;
};

/**
 * Count one hit against `key`.
 *
 * Fails open on purpose: a limiter outage must not take the product down. The
 * error is logged so a broken limiter is still visible.
 */
export async function consumeRateLimit(
  key: string,
  limit: RateLimit,
): Promise<RateLimitResult> {
  try {
    const admin = await createServiceClient();
    const { data, error } = await admin.rpc("consume_rate_limit", {
      p_key: key,
      p_window_seconds: limit.windowSec,
      p_max: limit.max,
    });

    if (error) throw error;

    const row = (Array.isArray(data) ? data[0] : data) as
      | { allowed?: boolean; remaining?: number; reset_at?: string }
      | null;

    if (!row) return { ok: true, remaining: limit.max, resetAt: null };

    return {
      ok: row.allowed !== false,
      remaining: Number(row.remaining ?? 0),
      resetAt: row.reset_at ? new Date(row.reset_at) : null,
    };
  } catch (cause) {
    console.error("[rate-limit] check failed", cause);
    return { ok: true, remaining: limit.max, resetAt: null };
  }
}

/** 429 response carrying Retry-After so well-behaved clients back off. */
export function rateLimited(result: RateLimitResult, message = "Terlalu banyak permintaan. Coba lagi sebentar.") {
  const retryAfter = result.resetAt
    ? Math.max(1, Math.ceil((result.resetAt.getTime() - Date.now()) / 1000))
    : 60;

  return NextResponse.json(
    { error: message, code: "rate_limited" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

/** Client address for unauthenticated limits (webhook, health probes). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") || "unknown";
}

/** The limits the product actually enforces, in one place. */
export const LIMITS = {
  /** Chromium renders are the most expensive thing the app does. */
  pdfExport: { max: 30, windowSec: 60 * 60 },
  /** Word exports are cheap but still server work. */
  docxExport: { max: 60, windowSec: 60 * 60 },
  /** Parsing an uploaded CV is CPU work on someone else's file. */
  cvImport: { max: 20, windowSec: 60 * 60 },
  /** Invoice creation writes rows and builds a QRIS payload. */
  paymentCreate: { max: 10, windowSec: 60 * 60 },
  /** Bank-mutasi feed; generous, but not unbounded. */
  paymentWebhook: { max: 120, windowSec: 60 },
} as const;
