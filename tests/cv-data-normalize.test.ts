import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_CV, SAMPLE_CV, normalizeCvData } from "../src/lib/cv-data";
import { renderResumeHtml } from "../src/lib/templates/render";
import { wrapResumeDocument } from "../src/lib/templates/styles";
import { ALL_TEMPLATES, type CvData, type TemplateId } from "../src/lib/types";

test("normalizeCvData turns anything into a walkable CV", () => {
  for (const junk of [null, undefined, 0, "", "a string", [], [1, 2], true]) {
    assert.deepEqual(normalizeCvData(junk), EMPTY_CV);
  }

  // Values that are not strings must not become "undefined" in the output.
  const coerced = normalizeCvData({ personal: { fullName: 42, location: true } });
  assert.equal(coerced.personal.fullName, "42");
  assert.equal(coerced.personal.location, "true");

  // Non-object entries inside a list are dropped, not rendered as blanks.
  const messy = normalizeCvData({
    education: [{ school: "UNIKOM", bullets: ["a", null, 7] }, null, "oops", 5],
  });
  assert.equal(messy.education.length, 1);
  assert.deepEqual(messy.education[0].bullets, ["a", "7"]);

  // A null column must not become a missing key.
  assert.equal(normalizeCvData({ experience: null }).experience.length, 0);
});

test("every template renders a CV whose data column is null", () => {
  // This is the shape a row takes when `data` was never written (older schema,
  // failed insert). It used to reach the renderers and throw
  // "Cannot read properties of undefined (reading 'personal')" -> HTTP 500.
  for (const id of ALL_TEMPLATES) {
    const html = renderResumeHtml(null as unknown as CvData, id as TemplateId);
    assert.ok(html.length > 0, `${id} produced no html`);
    assert.ok(!html.includes("undefined"), `${id} leaked "undefined" into the page`);
  }
});

test("an unvalidated template id cannot reach the document markup", () => {
  const injected = '<img src=x onerror="alert(1)">' as TemplateId;
  const html = wrapResumeDocument("<p>halo</p>", injected, "CV");
  assert.ok(!html.includes("<img"), "template id was interpolated into the markup");
  assert.ok(html.includes('class="resume template-jake"'), "did not fall back to jake");

  // Same fallback for the body renderer, so preview and PDF agree.
  assert.equal(
    renderResumeHtml(SAMPLE_CV, "not-a-template" as TemplateId),
    renderResumeHtml(SAMPLE_CV, "jake"),
  );
});

test("a template id that is not a string still resolves", () => {
  for (const junk of [null, undefined, 42, {}]) {
    assert.ok(wrapResumeDocument("<p>x</p>", junk as unknown as TemplateId).includes("template-jake"));
  }
});

test("every template survives a partially filled draft", () => {
  const draft = {
    personal: { fullName: "Surya" },
    experience: [{ company: "UNIKOM" }],
  } as unknown as CvData;
  for (const id of ALL_TEMPLATES) {
    const html = renderResumeHtml(draft, id as TemplateId);
    assert.ok(html.includes("Surya"), `${id} dropped the name`);
    assert.ok(!html.includes("undefined"), `${id} leaked "undefined"`);
  }
});
