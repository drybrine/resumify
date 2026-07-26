import { NextResponse } from "next/server";
import { createProPayment } from "@/lib/actions/payments";

export async function POST() {
  try {
    const result = await createProPayment();
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal buat pembayaran";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
