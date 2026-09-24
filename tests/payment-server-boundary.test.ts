import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const actions = readFileSync(new URL("src/lib/actions/payments.ts", root), "utf8");
const webhook = readFileSync(new URL("src/app/api/payments/webhook/route.ts", root), "utf8");

test("auto-confirm logic is not exported as a public Server Action", () => {
  assert.doesNotMatch(actions, /export\s+async\s+function\s+autoConfirmByAmount\s*\(/);
  assert.match(webhook, /@\/lib\/server\/payment-confirmation/);
  assert.match(webhook, /await autoConfirmByAmount\(amount, source\)/);
});

test("payment confirmation service is server-only, not a Server Action module", () => {
  const service = readFileSync(
    new URL("src/lib/server/payment-confirmation.ts", root),
    "utf8",
  );
  assert.match(service, /import\s+["']server-only["']/);
  assert.doesNotMatch(service, /^\s*["']use server["']/);
  assert.match(service, /export async function autoConfirmByAmount/);
});
