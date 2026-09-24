import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { SAMPLE_CV } from "../src/lib/cv-data";
import { renderResumeHtml, TEMPLATE_META } from "../src/lib/templates/render";
import { getTemplateCss, wrapResumeDocument } from "../src/lib/templates/styles";
import { ALL_TEMPLATES } from "../src/lib/types";
import { canUseTemplate } from "../src/lib/template-entitlement";

const NEW_TEMPLATES = [
  "swiss",
  "scholar",
  "timeline",
  "mono",
  "atlas",
  "editorial",
  "orbit",
  "mono-grid",
] as const;

const MALICIOUS_CV = {
  ...SAMPLE_CV,
  summary: '<script>alert("summary")</script>',
  personal: {
    ...SAMPLE_CV.personal,
    fullName: '<img src=x onerror="alert(1)">',
    location: '<svg onload="alert(2)">',
  },
} as typeof SAMPLE_CV;

const schema = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");
const migration = readFileSync(
  new URL("../supabase/migrate-templates.sql", import.meta.url),
  "utf8",
);

test("Pro templates require active Pro while current free templates stay free", () => {
  assert.equal(canUseTemplate("swiss", "free", null), false);
  assert.equal(canUseTemplate("jake", "free", null), true);
  assert.equal(canUseTemplate("minimal", "free", null), true);
  assert.equal(canUseTemplate("scholar", "pro", "2099-01-01T00:00:00.000Z"), true);
  assert.equal(canUseTemplate("swiss", "pro", "2000-01-01T00:00:00.000Z"), false);
});

test("template catalog contains eight new unique Pro layouts", () => {
  assert.equal(ALL_TEMPLATES.length, 20);
  for (const id of NEW_TEMPLATES) {
    assert.ok(ALL_TEMPLATES.includes(id), `${id} missing from ALL_TEMPLATES`);
    assert.ok(TEMPLATE_META[id], `${id} missing from TEMPLATE_META`);
    assert.equal(TEMPLATE_META[id].pro, true);
  }
  for (const id of NEW_TEMPLATES) {
    const count = Object.keys(TEMPLATE_META).filter((key) => key === id).length;
    assert.equal(count, 1, `${id} metadata should appear once`);
  }
});

test("each new template has distinct rendered structure and CSS", () => {
  const rendered = NEW_TEMPLATES.map((id) => renderResumeHtml(SAMPLE_CV, id));
  assert.equal(new Set(rendered).size, NEW_TEMPLATES.length);
  for (const [index, id] of NEW_TEMPLATES.entries()) {
    assert.ok(rendered[index].length > 100, `${id} rendering is empty`);
    assert.ok(getTemplateCss(id).includes(`.${id}`) || id === "mono-grid", `${id} CSS has no template-specific selectors`);
    const document = wrapResumeDocument(rendered[index], id);
    assert.ok(document.includes(`template-${id}`), `${id} wrapper class missing`);
    assert.ok(getTemplateCss(id).length > 1000, `${id} CSS is missing`);
  }
});

test("new template output escapes user-controlled text", () => {
  for (const id of NEW_TEMPLATES) {
    const html = renderResumeHtml(MALICIOUS_CV, id);
    assert.ok(!html.includes('<script>alert("summary")</script>'), `${id} did not escape summary`);
    assert.ok(!html.includes('<img src=x onerror="alert(1)">'), `${id} did not escape name`);
    assert.ok(!html.includes('<svg onload="alert(2)">'), `${id} did not escape location`);
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /&lt;img/);
  }
});

test("database checks and template migration list every template id", () => {
  for (const id of ALL_TEMPLATES) {
    assert.match(schema, new RegExp(`['"]${id}['"]`), `${id} missing from schema`);
    assert.match(migration, new RegExp(`['"]${id}['"]`), `${id} missing from migration`);
  }
});


