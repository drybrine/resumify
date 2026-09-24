import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PLAN_LIMITS, SAMPLE_CV } from "../src/lib/cv-data";
import { renderResumeHtml, TEMPLATE_META } from "../src/lib/templates/render";
import { getTemplateCss, wrapResumeDocument } from "../src/lib/templates/styles";
import { ALL_TEMPLATES, type TemplateId } from "../src/lib/types";
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

// Files whose copy advertises how many templates exist. Extend this list when a
// new surface starts quoting the catalogue size, so the count cannot drift again.
const TEMPLATE_COUNT_COPY_FILES = [
  "src/app/page.tsx",
  "src/app/pricing/page.tsx",
  "src/app/dashboard/page.tsx",
  "src/app/layout.tsx",
  "src/app/opengraph-image.tsx",
  "src/components/site-footer.tsx",
  "src/components/editor/cv-editor.tsx",
  "src/lib/plans.ts",
];

test("every advertised template count matches the live catalog", () => {
  const proCount = Object.values(TEMPLATE_META).filter((meta) => meta.pro).length;
  const allowed = new Set([String(ALL_TEMPLATES.length), String(proCount)]);
  let claims = 0;
  for (const file of TEMPLATE_COUNT_COPY_FILES) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    for (const match of source.matchAll(/\b(\d+)\s+(templates?|layouts?)\b/gi)) {
      claims += 1;
      assert.ok(
        allowed.has(match[1]),
        `${file} says ${match[0]} but the catalog has ${ALL_TEMPLATES.length} templates (${proCount} Pro)`,
      );
    }
  }
  assert.ok(claims >= 10, `copy audit only inspected ${claims} template-count claims`);
});

test("hero showcase offers every template added in the expansion", () => {
  const showcase = readFileSync(
    new URL("../src/components/template-showcase.tsx", import.meta.url),
    "utf8",
  );
  const array = showcase.match(/const HERO_TABS: TemplateId\[\]\s*=\s*\[([^\]]*)\]/);
  assert.ok(array, "HERO_TABS declaration not found in template-showcase.tsx");
  const ids: string[] = array[1].match(/[a-z][a-z-]*/g) ?? [];
  assert.equal(new Set(ids).size, ids.length, "HERO_TABS contains duplicate ids");
  for (const id of ids) {
    assert.ok(
      (ALL_TEMPLATES as readonly string[]).includes(id),
      `HERO_TABS lists unknown template ${id}`,
    );
  }
  for (const id of NEW_TEMPLATES) {
    assert.ok(ids.includes(id), `hero showcase is missing ${id}`);
  }
});

test("exactly the two original templates stay free in code and entitlements", () => {
  const free = Object.keys(TEMPLATE_META)
    .filter((id) => !TEMPLATE_META[id as keyof typeof TEMPLATE_META].pro)
    .sort();
  assert.deepEqual(free, ["jake", "minimal"]);
  assert.deepEqual([...PLAN_LIMITS.free.templates].sort(), ["jake", "minimal"]);
  assert.equal(PLAN_LIMITS.pro.templates.length, ALL_TEMPLATES.length);
  for (const id of NEW_TEMPLATES) {
    assert.ok(!PLAN_LIMITS.free.templates.includes(id), `${id} must not be free`);
    assert.ok(PLAN_LIMITS.pro.templates.includes(id), `${id} must be available on Pro`);
  }
});

const previewCss = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

function classesRenderedFor(id: TemplateId): string[] {
  const found = new Set<string>();
  for (const match of renderResumeHtml(SAMPLE_CV, id).matchAll(/class="([^"]+)"/g)) {
    for (const token of match[1].split(/\s+/)) {
      if (token) found.add(token);
    }
  }
  return [...found];
}

test("globals.css mirrors a preview block for every template in the catalog", () => {
  for (const id of ALL_TEMPLATES) {
    const selector = `.resume-preview.template-${id}`;
    const occurrences = previewCss.split(`${selector} `).length - 1;
    assert.ok(
      occurrences >= 3,
      `globals.css styles ${selector} only ${occurrences} time(s) — the preview mirror is behind styles.ts`,
    );
    const blockStart = previewCss.indexOf(`${selector} {`);
    assert.ok(blockStart > -1, `globals.css has no ${selector} { ... } block`);
    assert.match(
      previewCss.slice(blockStart, blockStart + 200),
      /font-family/,
      `${id} preview block does not set its own typeface`,
    );
  }
});

test("every class the new templates render is styled in the preview stylesheet", () => {
  const shared = new Set(classesRenderedFor("jake"));
  for (const id of NEW_TEMPLATES) {
    const own = classesRenderedFor(id).filter((cls) => !shared.has(cls));
    assert.ok(own.length >= 1, `${id} renders no template-specific class`);
    for (const cls of own) {
      assert.ok(previewCss.includes(`.${cls}`), `globals.css never styles .${cls}, used by ${id}`);
    }
  }
});

test("database checks and template migration list every template id", () => {
  for (const id of ALL_TEMPLATES) {
    assert.match(schema, new RegExp(`['"]${id}['"]`), `${id} missing from schema`);
    assert.match(migration, new RegExp(`['"]${id}['"]`), `${id} missing from migration`);
  }
});


