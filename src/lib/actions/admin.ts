"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getProPricing } from "@/lib/plan-pricing";
import type { Plan } from "@/lib/types";
import { confirmPayment } from "@/lib/actions/payments";

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!me?.is_admin) throw new Error("Forbidden");
  return { supabase, user };
}

export async function setUserPlan(userId: string, plan: Plan) {
  if (plan !== "free" && plan !== "pro") {
    throw new Error("Invalid plan target. Only free or pro allowed.");
  }
  await requireAdminUser();

  const admin = await createServiceClient();
  const patch: { plan: Plan; plan_expires_at?: string | null } = { plan };
  if (plan === "pro") {
    const { periodDays } = await getProPricing();
    const exp = new Date();
    exp.setDate(exp.getDate() + periodDays);
    patch.plan_expires_at = exp.toISOString();
  } else if (plan === "free") {
    patch.plan_expires_at = null;
  }

  const { error } = await admin.from("profiles").update(patch).eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function confirmPaymentAction(paymentId: string) {
  const res = await confirmPayment(paymentId);
  if (res.error) throw new Error(res.error);
}

export type PlanSettingsState = {
  error?: string;
  success?: string;
} | null;

export async function updatePlanSettings(
  _prev: PlanSettingsState,
  formData: FormData
): Promise<PlanSettingsState> {
  const { user } = await requireAdminUser();

  const priceRaw = String(formData.get("pro_price_idr") || "").replace(
    /[^\d]/g,
    ""
  );
  const daysRaw = String(formData.get("pro_period_days") || "").replace(
    /[^\d]/g,
    ""
  );

  const priceIdr = Number(priceRaw);
  const periodDays = Number(daysRaw);

  if (!Number.isInteger(priceIdr) || priceIdr < 10_000 || priceIdr > 10_000_000) {
    return { error: "Harga Pro harus 10.000 – 10.000.000 IDR." };
  }
  if (!Number.isInteger(periodDays) || periodDays < 1 || periodDays > 365) {
    return { error: "Periode harus 1 – 365 hari." };
  }

  const admin = await createServiceClient();
  const { error } = await admin.from("plan_settings").upsert(
    {
      id: "default",
      pro_price_idr: priceIdr,
      pro_period_days: periodDays,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/pricing");
  revalidatePath("/");
  return { success: "Harga plan disimpan." };
}
