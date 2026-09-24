import type { Plan } from "./types";

export function effectivePlan(
  plan: Plan | string | null | undefined,
  isAdmin: boolean,
  planExpiresAt: string | null | undefined,
  now = Date.now(),
): Plan {
  if (isAdmin || plan === "admin") return "admin";
  if (plan === "pro") {
    const expiry = planExpiresAt ? Date.parse(planExpiresAt) : Number.NaN;
    return Number.isFinite(expiry) && expiry > now ? "pro" : "free";
  }
  return plan === "admin" ? "admin" : "free";
}
