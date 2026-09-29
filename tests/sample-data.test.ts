import assert from "node:assert/strict";
import test from "node:test";
import { SAMPLE_CV } from "../src/lib/cv-data";

/**
 * SAMPLE_CV is not just gallery decoration. It renders every template preview in
 * the showcase and the editor picker, AND `createCv({ sample: true })` seeds a
 * brand-new user's CV with it — so whatever is in here ships inside someone
 * else's document. It must stay a placeholder.
 */
const REAL_PERSON =
  /surya|alamsyah|putera|pratama|aasurya|drybrine|stokmanager|unikom|tristek|injuratech|ahass|hidayat/i;

test("SAMPLE_CV carries no real personal data", () => {
  const hit = JSON.stringify(SAMPLE_CV).match(REAL_PERSON);
  assert.equal(hit, null, `sample CV leaks "${hit?.[0]}"`);
});

test("SAMPLE_CV contacts stay on reserved placeholder domains", () => {
  const { fullName, email, github, website } = SAMPLE_CV.personal;
  assert.equal(fullName, "John Doe");
  // example.com is reserved for documentation, so a stray sample address can
  // never point at a real inbox.
  assert.ok(email.endsWith("@example.com"), `email: ${email}`);
  for (const handle of [github, website]) {
    assert.match(handle, /johndoe/i, `expected a placeholder handle, got ${handle}`);
  }
});

test("SAMPLE_CV fills every section a template can render", () => {
  // Empty sections would make the gallery previews look broken, so the sample has
  // to exercise each one.
  assert.ok(SAMPLE_CV.education.length > 0, "no education");
  assert.ok(SAMPLE_CV.experience.length > 0, "no experience");
  assert.ok(SAMPLE_CV.projects.length > 0, "no projects");
  assert.ok(SAMPLE_CV.publications.length > 0, "no publications");
  assert.ok(SAMPLE_CV.skills.length > 0, "no skills");
  assert.ok(SAMPLE_CV.languages.length > 0, "no languages");
  assert.ok(SAMPLE_CV.personal.email.length > 0, "no contact details");
});
