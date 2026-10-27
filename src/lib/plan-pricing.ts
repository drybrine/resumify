import "server-only";

import { unstable_cache } from "next/cache";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { DEFAULT_PRO, type ProPricing } from "@/lib/plans";

/** Load Pro pricing from DB (plan_settings). Falls back to PLANS.pro constants. */
export async function getProPricing(): Promise<ProPricing> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("plan_settings")
      .select("pro_price_idr, pro_period_days")
      .eq("id", "default")
      .maybeSingle();

    if (!data) return DEFAULT_PRO;

    return {
      priceIdr: data.pro_price_idr ?? DEFAULT_PRO.priceIdr,
      periodDays: data.pro_period_days ?? DEFAULT_PRO.periodDays,
    };
  } catch {
    return DEFAULT_PRO;
  }
}

/** Service-role variant for webhooks / background (no cookie session). */
export async function getProPricingService(): Promise<ProPricing> {
  try {
    const admin = await createServiceClient();
    const { data } = await admin
      .from("plan_settings")
      .select("pro_price_idr, pro_period_days")
      .eq("id", "default")
      .maybeSingle();

    if (!data) return DEFAULT_PRO;

    return {
      priceIdr: data.pro_price_idr ?? DEFAULT_PRO.priceIdr,
      periodDays: data.pro_period_days ?? DEFAULT_PRO.periodDays,
    };
  } catch {
    return DEFAULT_PRO;
  }
}

/**
 * Cached pricing for the root layout's metadata.
 *
 * `getProPricing()` uses the cookie-bound client, and calling it from
 * `generateMetadata` in the root layout made every route dynamic — the marketing
 * pages included, which is why they shipped `cache-control: private, no-store`
 * and never hit the CDN. This variant reads with the service client (no
 * cookies) and caches for five minutes, so an admin price change still lands
 * quickly while `/` can be prerendered.
 */
export const getProPricingCached = unstable_cache(
  async () => getProPricingService(),
  ["pro-pricing"],
  { revalidate: 300, tags: ["pro-pricing"] },
);
