import type { Plan, TemplateId } from "./types";
import { effectivePlan } from "./plan-access";

const FREE_TEMPLATES = new Set<TemplateId>(["jake", "minimal"]);

export function canUseTemplate(
  template: TemplateId,
  plan: Plan,
  planExpiresAt: string | null,
): boolean {
  const currentPlan = effectivePlan(plan, plan === "admin", planExpiresAt);
  return FREE_TEMPLATES.has(template) || currentPlan !== "free";
}
