import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { effectivePlan } from "../src/lib/plan-access";

const root = new URL("../", import.meta.url);
const schema = readFileSync(new URL("supabase/schema.sql", root), "utf8");
const cvActions = readFileSync(new URL("src/lib/actions/cvs.ts", root), "utf8");
const publicShareService = readFileSync(new URL("src/lib/server/public-share.ts", root), "utf8");
const sharePage = readFileSync(new URL("src/app/share/[slug]/page.tsx", root), "utf8");

test("effective plan expires Pro entitlements", () => {
  assert.equal(effectivePlan("pro", false, "2000-01-01T00:00:00.000Z"), "free");
  assert.equal(effectivePlan("pro", false, "2099-01-01T00:00:00.000Z"), "pro");
  assert.equal(effectivePlan("admin", true, null), "admin");
});

test("database does not expose shared CVs under an unrestricted public-select policy", () => {
  assert.doesNotMatch(
    schema,
    /create policy "Public can read shared cvs"[\s\S]*?using\s*\(is_public\s*=\s*true\s+and\s+share_slug\s+is\s+not\s+null\)/i,
  );
});

test("public-share lookup is server-only and checks current share entitlement", () => {
  assert.match(publicShareService, /import\s+["']server-only["']/);
  assert.match(publicShareService, /createServiceClient/);
  assert.match(publicShareService, /effectivePlan\(/);
});

test("database share-entitlement trigger handles UPDATE without unassigned OLD access", () => {
  assert.match(schema, /if tg_op = 'INSERT' then[\s\S]*?old\.template is distinct from new\.template/i);
});

test("public CV pages are not indexed by search engines", () => {
  assert.match(sharePage, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
});

test("Free and expired Pro accounts cannot enable sharing through the action", () => {
  assert.match(cvActions, /const \{ plan \} = await getProfilePlan\(user\.id\);[\s\S]*?if \(enable && !limits\.share\)/);
});

test("the app no longer exposes the broad public CV read through the user client", () => {
  assert.doesNotMatch(cvActions, /export async function getPublicCv\s*\(/);
});

test("database blocks direct Pro-only template and sharing bypasses", () => {
  assert.match(schema, /create or replace function public\.enforce_cv_share_entitlement\(\)/i);
  assert.match(schema, /create trigger enforce_cv_share_entitlement_trigger/i);
  assert.match(schema, /owner_plan = 'pro' and owner_expires > now\(\)/i);
  assert.match(schema, /new\.template not in \('jake', 'minimal'\)/i);
});

test("database CV limit applies Free allowance after Pro expiry", () => {
  assert.match(schema, /user_plan = 'pro' and expires_at > now\(\) then 50[\s\S]*?else 1/i);
  assert.match(schema, /coalesce\(is_owner_admin, false\) or user_plan = 'admin' then 999/i);
});
