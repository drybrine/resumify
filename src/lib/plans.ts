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
    /** Harga bulanan (IDR, bilangan bulat) */
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

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
