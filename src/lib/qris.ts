import { generateDynamicQris } from "@shamah/dynamic-qris";
import QRCode from "qrcode";
import { PLANS } from "@/lib/plans";

/**
 * Static QRIS merchant string (dari merchant app / bank).
 * Set di env: QRIS_STATIC_PAYLOAD
 */
export function getStaticQris(): string {
  const payload = process.env.QRIS_STATIC_PAYLOAD?.trim();
  if (!payload) {
    throw new Error(
      "QRIS_STATIC_PAYLOAD belum diset. Paste string QRIS statis merchant di .env.local"
    );
  }
  return payload;
}

/**
 * Buat nominal unik: harga Pro + suffix 3 digit (001–999)
 * supaya cocok match transfer di mutasi rekening.
 * Contoh: 49000 + 137 = 49137
 */
export function makeUniqueAmount(baseIdr = PLANS.pro.priceIdr): number {
  const suffix = Math.floor(Math.random() * 900) + 100; // 100–999
  const amount = baseIdr + suffix;
  // @shamah/dynamic-qris range: 10_000 – 10_000_000
  if (amount < 10_000 || amount > 10_000_000) {
    throw new Error("Nominal di luar range QRIS (10rb–10jt)");
  }
  return amount;
}

export function buildDynamicQris(opts: {
  amount: number;
  referenceLabel: string;
}): { payload: string; amount: number; merchantName?: string } {
  const staticPayload = getStaticQris();
  const result = generateDynamicQris(staticPayload, {
    amount: opts.amount,
    mode: "replace",
    additionalData: {
      referenceLabel: opts.referenceLabel.slice(0, 25),
      terminalLabel: "CVBUILDER",
    },
  });

  return {
    payload: result.payload,
    amount: result.payableAmount,
    merchantName: result.metadata?.merchantName,
  };
}

export async function qrisToDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
    color: { dark: "#0f172a", light: "#ffffff" },
  });
}

export const PAYMENT_TTL_MINUTES = 30;
