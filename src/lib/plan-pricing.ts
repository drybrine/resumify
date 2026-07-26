import "server-only";

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
