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

type Tlv = { id: string; value: string };

function crc16Ccitt(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function parseTlv(payload: string): Tlv[] {
  const tags: Tlv[] = [];
  let i = 0;
  while (i < payload.length) {
    if (i + 4 > payload.length) throw new Error("Invalid QRIS TLV");
    const id = payload.slice(i, i + 2);
    const len = Number.parseInt(payload.slice(i + 2, i + 4), 10);
    if (!Number.isFinite(len) || len < 0) throw new Error("Invalid QRIS length");
    const start = i + 4;
    const end = start + len;
    if (end > payload.length) throw new Error("QRIS TLV overflow");
    tags.push({ id, value: payload.slice(start, end) });
    i = end;
  }
  return tags;
}

function buildTlv(tags: Tlv[]): string {
  return tags
    .map((t) => t.id + String(t.value.length).padStart(2, "0") + t.value)
    .join("");
}

/**
 * Inject amount (tag 54) into static QRIS + recalc CRC.
 * Works for any amount ≥ 1 (library @shamah only allows 10rb–10jt).
 * Placement matches @shamah/dynamic-qris (after country code 58).
 */
export function injectQrisAmount(
  staticPayload: string,
  amount: number,
  opts?: { referenceLabel?: string; terminalLabel?: string }
): { payload: string; amount: number; merchantName?: string } {
  if (!Number.isInteger(amount) || amount < 1 || amount > 10_000_000) {
    throw new Error("Nominal QRIS harus 1 – 10.000.000");
  }

  const raw = staticPayload.trim();
  if (raw.length < 20) throw new Error("QRIS payload terlalu pendek");

  // Drop trailing CRC tag (63 + len + 4 hex)
  const withoutCrc = raw.slice(0, -8);
  const tags = parseTlv(withoutCrc).filter((t) => t.id !== "63");

  const amountStr = String(amount);
  // Remove existing amount if any
  const existing54 = tags.findIndex((t) => t.id === "54");
  if (existing54 >= 0) tags.splice(existing54, 1);

  // Insert after tag 58 (country) — same as @shamah/dynamic-qris
  const after58 = tags.findIndex((t) => t.id === "58");
  const insertAt = after58 >= 0 ? after58 + 1 : tags.length;
  tags.splice(insertAt, 0, { id: "54", value: amountStr });

  // Optional additional data (tag 62)
  if (opts?.referenceLabel || opts?.terminalLabel) {
    const i62 = tags.findIndex((t) => t.id === "62");
    let sub: Tlv[] = i62 >= 0 ? parseTlv(tags[i62].value) : [];
    if (opts.referenceLabel) {
      const ref = opts.referenceLabel.slice(0, 25);
      const ir = sub.findIndex((t) => t.id === "05");
      if (ir >= 0) sub[ir].value = ref;
      else sub.push({ id: "05", value: ref });
    }
    if (opts.terminalLabel) {
      const term = opts.terminalLabel.slice(0, 25);
      const it = sub.findIndex((t) => t.id === "07");
      if (it >= 0) sub[it].value = term;
      else sub.push({ id: "07", value: term });
    }
    const built62 = buildTlv(sub);
    if (i62 >= 0) tags[i62].value = built62;
    else tags.push({ id: "62", value: built62 });
  }

  const body = buildTlv(tags) + "6304";
  const payload = body + crc16Ccitt(body);

  const nameTag = tags.find((t) => t.id === "59");
  return {
    payload,
    amount,
    merchantName: nameTag?.value,
  };
}

export function buildDynamicQris(opts: {
  amount: number;
  referenceLabel: string;
}): { payload: string; amount: number; merchantName?: string } {
  const staticPayload = getStaticQris();

  // Prefer official lib for supported range (10rb–10jt)
  if (opts.amount >= 10_000 && opts.amount <= 10_000_000) {
    try {
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
    } catch {
      // fall through to custom injector
    }
  }

  // Custom injector: supports test/promo amounts (Rp1+) with amount locked in QR
  return injectQrisAmount(staticPayload, opts.amount, {
    referenceLabel: opts.referenceLabel,
    terminalLabel: "CVBUILDER",
  });
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
