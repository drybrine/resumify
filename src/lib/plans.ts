import { createClient, createServiceClient } from "@/lib/supabase/server";

export const PLANS = {
  free: {
    id: "free" as const,
    name: "Free",
    priceIdr: 0,
    periodDays: 0,
    features: [
      "1 CV",
      "Template Jake + Minimal",
      "Export PDF",
      "Simpan cloud",
    ],
  },
  pro: {
    id: "pro" as const,
    name: "Pro",
    /** Fallback harga bulanan (IDR) — overridable via plan_settings */
    priceIdr: 49_000,
    periodDays: 30,
    features: [
      "50 CV",
      "12 template profesional",
      "Export PDF HD",
      "Link share publik",
      "Sync cloud",
      "Prioritas support",
    ],
  },
} as const;

export type ProPricing = {
  priceIdr: number;
  periodDays: number;
};

const DEFAULT_PRO: ProPricing = {
  priceIdr: PLANS.pro.priceIdr,
  periodDays: PLANS.pro.periodDays,
};

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

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
