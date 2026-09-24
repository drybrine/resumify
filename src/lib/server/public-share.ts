import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { effectivePlan } from "@/lib/plan-access";
import type { CvData, Plan, TemplateId } from "@/lib/types";

export type PublicCv = {
  id: string;
  user_id: string;
  title: string;
  template: TemplateId;
  data: CvData;
  share_slug: string;
  updated_at: string;
};

/**
 * Resolve a share token with elevated access, then independently enforce the
 * owner's current subscription. The service-role client is never exposed.
 */
export async function getPublicCv(slug: string): Promise<PublicCv | null> {
  if (!/^[\w-]{8,128}$/.test(slug)) return null;

  const admin = await createServiceClient();
  const { data: cv, error } = await admin
    .from("cvs")
    .select("id, user_id, title, template, data, share_slug, is_public, updated_at")
    .eq("share_slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  if (error || !cv) return null;

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("plan, is_admin, plan_expires_at")
    .eq("id", cv.user_id)
    .maybeSingle();
  if (profileError || !profile) return null;

  // A committed downgrade or expiry must immediately revoke public access.
  const plan = effectivePlan(
    profile.plan as Plan,
    profile.is_admin,
    profile.plan_expires_at,
  );
  if (plan !== "pro" && plan !== "admin") {
    await admin
      .from("cvs")
      .update({ is_public: false, share_slug: null })
      .eq("user_id", cv.user_id)
      .eq("is_public", true);
    return null;
  }
  return {
    id: cv.id,
    user_id: cv.user_id,
    title: cv.title,
    template: cv.template as TemplateId,
    data: cv.data as CvData,
    share_slug: cv.share_slug as string,
    updated_at: cv.updated_at,
  };
}
