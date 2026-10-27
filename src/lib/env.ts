import { z } from "zod";

/**
 * Environment validation.
 *
 * Read once at module load so a missing key fails the deploy loudly instead of
 * surfacing as a confusing 500 on the first request that happens to need it.
 * Server-only values live in `serverEnv`; anything reachable from the browser
 * must stay in `publicEnv` because Next inlines `NEXT_PUBLIC_*` at build time.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  QRIS_STATIC_PAYLOAD: z.string().min(20),
  PAYMENT_WEBHOOK_SECRET: z.string().min(16).optional(),
});

let cachedPublic: z.infer<typeof publicSchema> | null = null;

/** Validate the public keys on first use (build machines have no real values). */
export function publicEnv(): z.infer<typeof publicSchema> {
  if (cachedPublic) return cachedPublic;
  cachedPublic = publicSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  return cachedPublic;
}

let cached: z.infer<typeof serverSchema> | null = null;

/**
 * Validate server secrets lazily.
 *
 * `next build` imports route modules in an environment that has no secrets, so
 * parsing at module scope would break the build. The first real request is the
 * right moment: by then the deploy either has them or it does not.
 */
export function serverEnv(): z.infer<typeof serverSchema> {
  if (cached) return cached;

  const parsed = serverSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    QRIS_STATIC_PAYLOAD: process.env.QRIS_STATIC_PAYLOAD,
    PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET,
  });

  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Konfigurasi server belum lengkap: ${missing}`);
  }

  cached = parsed.data;
  return cached;
}

/** True when every required server secret is present — used by /api/health. */
export function serverEnvStatus(): { ok: boolean; missing: string[] } {
  const parsed = serverSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    QRIS_STATIC_PAYLOAD: process.env.QRIS_STATIC_PAYLOAD,
    PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET,
  });

  return parsed.success
    ? { ok: true, missing: [] }
    : { ok: false, missing: parsed.error.issues.map((issue) => issue.path.join(".")) };
}
