"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getProPricing, getProPricingService } from "@/lib/plan-pricing";
import {
  buildDynamicQris,
  makeUniqueAmount,
  PAYMENT_TTL_MINUTES,
  qrisToDataUrl,
} from "@/lib/qris";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) throw new Error("Forbidden");
  return { supabase, user };
}

/** Internal helper to expire pending payments that passed expires_at */
async function expireStalePayments() {
  const admin = await createServiceClient();
  await admin
    .from("payments")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString());
}

/**
 * Buat invoice Pro + QRIS dinamis.
 * Nominal unik = harga + 3 digit random (match mutasi).
 */
export async function createProPayment() {
  const { supabase, user } = await requireUser();
  await expireStalePayments();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, is_admin, plan_expires_at")
    .eq("id", user.id)
    .single();

  if (profile?.is_admin) {
    return { error: "Akun admin tidak perlu bayar." };
  }
  if (profile?.plan === "pro") {
    const exp = profile.plan_expires_at
      ? new Date(profile.plan_expires_at)
      : null;
    if (!exp || exp > new Date()) {
      return { error: "Kamu sudah Pro. Tunggu habis masa aktif untuk perpanjang." };
    }
  }

  // Cancel pending lama milik user
  await supabase
    .from("payments")
    .update({ status: "cancelled" })
    .eq("user_id", user.id)
    .eq("status", "pending");

  const { priceIdr: basePrice } = await getProPricing();
  const reference = `CVB-${nanoid(8).toUpperCase()}`;
  let amount = makeUniqueAmount(basePrice);
  let attempts = 0;
  let payment = null;
  let lastError = "";

  // Retry jika amount bentrok unique pending
  while (attempts < 50) {
    try {
      const { payload, merchantName } = buildDynamicQris({
        amount,
        referenceLabel: reference,
      });

      const expiresAt = new Date(
        Date.now() + PAYMENT_TTL_MINUTES * 60 * 1000
      ).toISOString();

      const { data, error } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          plan: "pro",
          amount_idr: amount,
          base_amount_idr: basePrice,
          reference,
          qris_payload: payload,
          status: "pending",
          expires_at: expiresAt,
          notes: merchantName || null,
        })
        .select("*")
        .single();

      if (error) {
        // unique amount collision
        if (error.code === "23505" || error.message.includes("unique")) {
          amount = makeUniqueAmount(basePrice);
          attempts++;
          lastError = error.message;
          continue;
        }
        return { error: error.message };
      }
      payment = data;
      break;
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : "Gagal generate QRIS",
      };
    }
  }

  if (!payment) {
    return { error: lastError || "Gagal buat nominal unik. Coba lagi." };
  }

  const qrDataUrl = await qrisToDataUrl(payment.qris_payload);

  return {
    payment: {
      id: payment.id,
      amount_idr: payment.amount_idr,
      base_amount_idr: payment.base_amount_idr,
      reference: payment.reference,
      status: payment.status,
      expires_at: payment.expires_at,
      merchant_name: payment.notes,
    },
    qrDataUrl,
  };
}

export async function getPaymentStatus(paymentId: string) {
  const { supabase, user } = await requireUser();
  await expireStalePayments();

  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, amount_idr, base_amount_idr, reference, status, expires_at, paid_at, qris_payload"
    )
    .eq("id", paymentId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) return { error: "Pembayaran tidak ditemukan" };

  let qrDataUrl: string | undefined;
  if (data.status === "pending") {
    qrDataUrl = await qrisToDataUrl(data.qris_payload);
  }

  return {
    payment: {
      id: data.id,
      amount_idr: data.amount_idr,
      base_amount_idr: data.base_amount_idr,
      reference: data.reference,
      status: data.status,
      expires_at: data.expires_at,
      paid_at: data.paid_at,
    },
    qrDataUrl,
  };
}

export async function getActivePendingPayment() {
  const { supabase, user } = await requireUser();
  await expireStalePayments();

  const { data } = await supabase
    .from("payments")
    .select(
      "id, amount_idr, base_amount_idr, reference, status, expires_at, qris_payload, notes"
    )
    .eq("user_id", user.id)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const qrDataUrl = await qrisToDataUrl(data.qris_payload);
  return {
    payment: {
      id: data.id,
      amount_idr: data.amount_idr,
      base_amount_idr: data.base_amount_idr,
      reference: data.reference,
      status: data.status,
      expires_at: data.expires_at,
      merchant_name: data.notes,
    },
    qrDataUrl,
  };
}

/** Admin: konfirmasi bayar → upgrade Pro */
export async function confirmPayment(paymentId: string) {
  const { user } = await requireAdmin();
  return finalizePayment(paymentId, user.id);
}

/**
 * Auto-confirm by unique amount (mutasi match).
 * Called from webhook / cron — no user session.
 */
export async function autoConfirmByAmount(
  amountIdr: number,
  source = "webhook"
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
    }
  );

  if (rpcErr) {
    // Fallback: match + update manually
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

    const result = await finalizePayment(payment.id, null, source);
    if (result.error) return { matched: true, error: result.error };
    return { success: true, matched: true, paymentId: payment.id };
  }

  if (!paymentId) {
    return { matched: false, error: "No pending match" };
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/pricing");
  return { success: true, matched: true, paymentId: String(paymentId) };
}

async function finalizePayment(
  paymentId: string,
  adminId: string | null,
  source?: string
) {
  const admin = await createServiceClient();

  const { data: payment, error } = await admin
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (error || !payment) return { error: "Payment not found" };
  if (payment.status !== "pending") {
    return { error: `Status sudah ${payment.status}` };
  }

  const { periodDays } = await getProPricingService();
  const expires = new Date();
  expires.setDate(expires.getDate() + periodDays);

  const { error: rpcErr } = await admin.rpc("confirm_payment_and_upgrade", {
    p_payment_id: paymentId,
    p_admin_id: adminId,
    p_expires_at: expires.toISOString(),
  });

  if (rpcErr) {
    const note =
      adminId == null
        ? `auto:${(source || "system").slice(0, 40)}`
        : payment.notes;
    const { error: payErr } = await admin
      .from("payments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        confirmed_by: adminId,
        notes: note,
      })
      .eq("id", paymentId)
      .eq("status", "pending");

    if (payErr) return { error: payErr.message };

    const { error: profErr } = await admin
      .from("profiles")
      .update({
        plan: "pro",
        plan_expires_at: expires.toISOString(),
      })
      .eq("id", payment.user_id);

    if (profErr) return { error: profErr.message };
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/pricing");
  return { success: true };
}

export async function listPendingPayments() {
  await requireAdmin();
  const admin = await createServiceClient();
  await expireStalePayments();

  const { data, error } = await admin
    .from("payments")
    .select(
      `
      id, amount_idr, base_amount_idr, reference, status, expires_at, created_at, paid_at,
      user:profiles!payments_user_id_fkey ( id, email, full_name )
    `
    )
    .in("status", ["pending", "paid"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return data || [];
}
