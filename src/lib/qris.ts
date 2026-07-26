import { generateDynamicQris } from "@shamah/dynamic-qris";
import QRCode from "qrcode";

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
 * Buat nominal unik: harga Pro + suffix 3 digit (100–999)
 * supaya cocok match transfer di mutasi rekening.
 * Contoh: 49000 + 137 = 49137 · Rp1 + 237 = 238 (test)
 * Selalu pakai suffix — termasuk harga promo/test.
 */
export function makeUniqueAmount(baseIdr: number): number {
  const base = Math.max(1, Math.floor(baseIdr));
  const suffix = Math.floor(Math.random() * 900) + 100; // 100–999
  const amount = base + suffix;
  if (amount > 10_000_000) {
    throw new Error("Nominal di luar range (max 10jt)");
  }
  return amount;
}

export function buildDynamicQris(opts: {
  amount: number;
  referenceLabel: string;
}): { payload: string; amount: number; merchantName?: string } {
  const staticPayload = getStaticQris();

  // @shamah/dynamic-qris only accepts 10_000 – 10_000_000.
  // Promo/test prices (<10rb): static QR, user types amount manually.
  if (opts.amount < 10_000) {
    return {
      payload: staticPayload,
      amount: opts.amount,
      merchantName: undefined,
    };
  }

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
