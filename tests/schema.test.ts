import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");

test("profile privilege guard allows service role and database owner operations", () => {
  assert.match(schema, /coalesce\(auth\.role\(\),\s*''\)\s*<>\s*'service_role'/);
  assert.match(schema, /session_user\s+not\s+in\s*\('postgres',\s*'supabase_admin'\)/);
});

test("profile privilege guard still rejects ordinary non-admin users", () => {
  assert.match(
    schema,
    /if not public\.is_admin\(\)\s+and coalesce\(auth\.role\(\),\s*''\) <> 'service_role'\s+and session_user not in \('postgres', 'supabase_admin'\) then\s+raise exception 'Forbidden: Only admins can alter plan or admin rights';/,
  );
});
