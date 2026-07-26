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

export const DEFAULT_PRO: ProPricing = {
  priceIdr: PLANS.pro.priceIdr,
  periodDays: PLANS.pro.periodDays,
};

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
