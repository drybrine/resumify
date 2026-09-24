import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");

test("UPDATEs may not newly choose a Pro template without active Pro", () => {
  assert.match(
    schema,
    /new\.template not in \('jake', 'minimal'\)\s+and old\.template is distinct from new\.template/i,
  );
});
