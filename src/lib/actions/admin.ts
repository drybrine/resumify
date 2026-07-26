"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/plans";
import type { Plan } from "@/lib/types";
import { confirmPayment } from "@/lib/actions/payments";

export async function setUserPlan(userId: string, plan: Plan) {
  if (plan !== "free" && plan !== "pro") {
    throw new Error("Invalid plan target. Only free or pro allowed.");
  }
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

  const admin = await createServiceClient();
  const patch: { plan: Plan; plan_expires_at?: string | null } = { plan };
  if (plan === "pro") {
    const exp = new Date();
    exp.setDate(exp.getDate() + PLANS.pro.periodDays);
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
