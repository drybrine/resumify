import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { serverEnvStatus } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness + dependency check for uptime monitors.
 *
 * Deliberately shallow: it answers "is this deploy able to serve" without
 * touching user data or leaking configuration. Returns 503 when a required
 * secret is missing or the database cannot be reached, so a monitor can alert
 * on the status code alone.
 */
export async function GET() {
  const env = serverEnvStatus();

  let database: "ok" | "unreachable" = "unreachable";
  if (env.ok) {
    try {
      const admin = await createServiceClient();
      const { error } = await admin
        .from("plan_settings")
        .select("id")
        .eq("id", "default")
        .maybeSingle();
      if (!error) database = "ok";
    } catch (cause) {
      console.error("[health] database check failed", cause);
    }
  }

  const ok = env.ok && database === "ok";

  return NextResponse.json(
    {
      ok,
      checks: {
        env: env.ok ? "ok" : "missing",
        database,
      },
      // Names only — never values.
      ...(env.ok ? {} : { missing: env.missing }),
    },
    {
      status: ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
