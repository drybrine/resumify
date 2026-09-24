import "server-only";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { getProPricingService } from "@/lib/plan-pricing";

/** Internal helper to expire pending payments that passed expires_at. */
async function expireStalePayments() {
  const admin = await createServiceClient();
  await admin
    .from("payments")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString());
}

/**
 * Confirm one pending invoice after the caller has authenticated its provider
 * event. This module is server-only and deliberately not a Server Action module.
 */
export async function autoConfirmByAmount(
  amountIdr: number,
  source = "webhook",
): Promise<{
  success?: boolean;
  paymentId?: string;
  error?: string;
  matched?: boolean;
}> {
  if (!Number.isInteger(amountIdr) || amountIdr < 1) {
    return { error: "Invalid amount" };
  }

  await expireStalePayments();

  const admin = await createServiceClient();
  const { periodDays } = await getProPricingService();
  const expires = new Date();
  expires.setDate(expires.getDate() + periodDays);

  const { data: paymentId, error: rpcErr } = await admin.rpc(
    "auto_confirm_payment_by_amount",
    {
      p_amount_idr: amountIdr,
      p_expires_at: expires.toISOString(),
      p_source: source.slice(0, 40),
    },
  );

  if (rpcErr) {
    // Fallback for legacy deployments that have not installed the RPC yet.
    const { data: payment } = await admin
      .from("payments")
      .select("id, user_id, status, expires_at")
      .eq("amount_idr", amountIdr)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment) return { matched: false, error: "No pending match" };

    if (new Date(payment.expires_at) < new Date()) {
      await admin
        .from("payments")
        .update({ status: "expired" })
        .eq("id", payment.id);
      return { matched: false, error: "Payment expired" };
    }

    const { error: payErr } = await admin
      .from("payments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        confirmed_by: null,
        notes: `auto:${source.slice(0, 40)}`,
      })
      .eq("id", payment.id)
      .eq("status", "pending");
    if (payErr) return { matched: true, error: payErr.message };

    const { error: profileErr } = await admin
      .from("profiles")
      .update({
        plan: "pro",
        plan_expires_at: expires.toISOString(),
      })
      .eq("id", payment.user_id);
    if (profileErr) return { matched: true, error: profileErr.message };

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/pricing");
    return { success: true, matched: true, paymentId: payment.id };
  }

  if (!paymentId) return { matched: false, error: "No pending match" };

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/pricing");
  return { success: true, matched: true, paymentId: String(paymentId) };
}
