"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/server";
import { EMPTY_CV, PLAN_LIMITS, SAMPLE_CV } from "@/lib/cv-data";
import type { CvData, Plan, TemplateId } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

async function getPlan(userId: string): Promise<Plan> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("plan, is_admin")
    .eq("id", userId)
    .single();
  if (data?.is_admin) return "admin";
  return (data?.plan as Plan) || "free";
}

export async function listCvs() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("cvs")
    .select("id, title, template, share_slug, is_public, updated_at, created_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getCv(id: string) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("cvs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (error || !data) return null;
  return data;
}

export async function getPublicCv(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cvs")
    .select("id, title, template, data, share_slug, updated_at")
    .eq("share_slug", slug)
    .eq("is_public", true)
    .single();
  if (error || !data) return null;
  return data;
}

export async function createCv(opts?: {
  title?: string;
  sample?: boolean;
  template?: TemplateId;
}) {
  const { supabase, user } = await requireUser();
  const plan = await getPlan(user.id);
  const limits = PLAN_LIMITS[plan];

  const { count } = await supabase
    .from("cvs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count || 0) >= limits.maxCvs) {
    throw new Error(`Limit ${limits.maxCvs} CV for plan ${plan}. Upgrade to Pro.`);
  }

  const template = opts?.template || "jake";
  if (!limits.templates.includes(template)) {
    throw new Error("Template requires Pro plan.");
  }

  const { data, error } = await supabase
    .from("cvs")
    .insert({
      user_id: user.id,
      title: opts?.title || "Untitled CV",
      template,
      data: opts?.sample ? SAMPLE_CV : EMPTY_CV,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  redirect(`/editor/${data.id}`);
}

export async function updateCv(
  id: string,
  payload: {
    title?: string;
    template?: TemplateId;
    data?: CvData;
  }
) {
  const { supabase, user } = await requireUser();
  const plan = await getPlan(user.id);
  const limits = PLAN_LIMITS[plan];

  if (payload.template && !limits.templates.includes(payload.template)) {
    return { error: "Template requires Pro plan." };
  }

  const { error } = await supabase
    .from("cvs")
    .update({
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.template !== undefined ? { template: payload.template } : {}),
      ...(payload.data !== undefined ? { data: payload.data } : {}),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/editor/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteCv(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("cvs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleShare(id: string, enable: boolean) {
  const { supabase, user } = await requireUser();
  const plan = await getPlan(user.id);
  const limits = PLAN_LIMITS[plan];

  if (enable && !limits.share) {
    return { error: "Share links require Pro plan." };
  }

  const share_slug = enable ? nanoid(10) : null;
  const { data, error } = await supabase
    .from("cvs")
    .update({ is_public: enable, share_slug })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("share_slug, is_public")
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/editor/${id}`);
  return { success: true, share_slug: data.share_slug, is_public: data.is_public };
}

export async function getProfile() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return data;
}
