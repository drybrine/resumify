import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { safeInternalPath } from "../src/lib/auth-redirect";
import { callbackRedirect } from "../src/app/auth/callback/route";

const origin = "https://resumify.example";

test("auth redirects allow internal paths", () => {
  assert.equal(safeInternalPath("/editor/123"), "/editor/123");
  assert.equal(callbackRedirect("/editor/123", origin).href, `${origin}/editor/123`);
});

test("auth redirects reject protocol-relative, backslash, and scheme-like paths", () => {
  for (const path of [
    "//attacker.example",
    "/\\\\attacker.example",
    "/https://attacker.example",
    "/javascript:alert(1)",
    "/https:\t//attacker.example",
  ]) {
    assert.equal(safeInternalPath(path), "/dashboard");
    assert.equal(callbackRedirect(path, origin).href, `${origin}/dashboard`);
  }
});

test("production auth handlers call the tested helper", () => {
  const actions = readFileSync(new URL("../src/lib/actions/auth.ts", import.meta.url), "utf8");
  const callback = readFileSync(new URL("../src/app/auth/callback/route.ts", import.meta.url), "utf8");
  assert.match(actions, /safeInternalPath\(next\)/);
  assert.match(callback, /safeInternalPath\(next, origin\)/);
});
