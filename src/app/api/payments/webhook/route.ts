import { NextResponse } from "next/server";
import { autoConfirmByAmount } from "@/lib/actions/payments";

/**
 * Auto-confirm webhook — match credit by unique amount_idr.
 *
 * Auth: Authorization: Bearer <PAYMENT_WEBHOOK_SECRET>
 *   or  x-webhook-secret: <PAYMENT_WEBHOOK_SECRET>
 *
 * Body (JSON) — flexible provider shapes:
 *   { "amount": 49137 }
 *   { "amount_idr": 49137 }
 *   { "nominal": 49137 }
 *   { "data": { "amount": 49137 } }
 *   { "transactions": [{ "amount": 49137, "type": "credit" }] }
 *
 * Optional: ?source=bca|flip|manual for audit notes.
 */
export async function POST(req: Request) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "PAYMENT_WEBHOOK_SECRET not configured" },
      { status: 503 }
    );
  }

  const auth =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    req.headers.get("x-webhook-secret") ||
    "";
  if (auth !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source") || "webhook";

  const amounts = extractAmounts(body);
  if (amounts.length === 0) {
    return NextResponse.json(
      { error: "No amount found in payload" },
      { status: 400 }
    );
  }

  const results = [];
  for (const amount of amounts) {
    const result = await autoConfirmByAmount(amount, source);
    results.push({ amount, ...result });
  }

  const anySuccess = results.some((r) => r.success);
  const anyMatched = results.some((r) => r.matched);

  return NextResponse.json(
    {
      ok: true,
      confirmed: anySuccess,
      matched: anyMatched,
      results,
    },
    { status: anySuccess ? 200 : anyMatched ? 409 : 202 }
  );
}

function extractAmounts(body: unknown): number[] {
  const found = new Set<number>();

  const push = (v: unknown) => {
    const n =
      typeof v === "number"
        ? v
        : typeof v === "string"
          ? Number(v.replace(/[^\d.-]/g, ""))
          : NaN;
    if (Number.isFinite(n) && n > 0) {
      // accept integer IDR; if float-like (e.g. 49137.00) floor
      const idr = Math.round(n);
      if (idr >= 10_000 && idr <= 10_000_000) found.add(idr);
    }
  };

  if (!body || typeof body !== "object") return [];

  const obj = body as Record<string, unknown>;

  // Top-level common keys
  for (const key of [
    "amount",
    "amount_idr",
    "nominal",
    "value",
    "credit",
    "credit_amount",
  ]) {
    if (key in obj) push(obj[key]);
  }

  // Nested data
  if (obj.data && typeof obj.data === "object") {
    const d = obj.data as Record<string, unknown>;
    for (const key of ["amount", "amount_idr", "nominal", "value"]) {
      if (key in d) push(d[key]);
    }
  }

  // Transaction arrays (bank mutasi feeds)
  for (const listKey of ["transactions", "items", "mutations", "data"]) {
    const list = obj[listKey];
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      const t = item as Record<string, unknown>;
      const type = String(t.type || t.mutation_type || t.direction || "").toLowerCase();
      // skip debits if type present
      if (type && (type.includes("debit") || type === "out" || type === "d")) {
        continue;
      }
      for (const key of ["amount", "amount_idr", "nominal", "value", "credit"]) {
        if (key in t) push(t[key]);
      }
    }
  }

  return [...found];
}
