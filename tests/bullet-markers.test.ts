import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * List bullets are load-bearing copy: the education, experience and project
 * entries are read as bullets, and without the marker the preview looks like
 * plain paragraphs.
 *
 * The preview does not get them for free. `globals.css` starts with
 * `@import "tailwindcss"`, and Tailwind's preflight resets lists with
 * `list-style: none` — while the PDF document (`lib/templates/styles.ts`) is a
 * standalone HTML file with no preflight, so it kept its discs. The two surfaces
 * therefore disagreed: the preview showed no bullets and the exported PDF did.
 *
 * A pixel probe on the real app measured it: 0 dark pixels in the marker band
 * before the fix, 69–272 per template after, and 0 again when the marker was
 * turned back off (which is what proves the probe can fail). These assertions are
 * the cheap guard that keeps the explicit declaration in place.
 */

const previewCss = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const pdfCss = readFileSync(new URL("../src/lib/templates/styles.ts", import.meta.url), "utf8");

/** The declaration block of the first rule matching `selector`. */
function ruleBody(css: string, selector: string): string | null {
  const at = css.indexOf(selector);
  if (at < 0) return null;
  const open = css.indexOf("{", at);
  const close = css.indexOf("}", open);
  if (open < 0 || close < 0) return null;
  return css.slice(open + 1, close);
}

test("preview stylesheet restores list markers that Tailwind's preflight removes", () => {
  assert.match(
    previewCss,
    /@import\s+["']tailwindcss["']/,
    "globals.css no longer imports Tailwind — this guard assumes its preflight is in play",
  );

  const body = ruleBody(previewCss, ".resume-preview ul {");
  assert.ok(body, "the preview has no `.resume-preview ul` rule");
  assert.match(
    body,
    /list-style(-type)?\s*:[^;]*\bdisc\b/,
    `the preview list rule must declare a disc marker, otherwise the CV shows no bullets (rule: {${body}})`,
  );
});

test("PDF stylesheet declares the same markers, so both surfaces agree", () => {
  const body = ruleBody(pdfCss, ".resume ul {");
  assert.ok(body, "the PDF stylesheet has no `.resume ul` rule");
  assert.match(
    body,
    /list-style(-type)?\s*:[^;]*\bdisc\b/,
    `the PDF list rule must declare the marker explicitly (rule: {${body}})`,
  );
});

test("markers stay outside the text flow, keeping the bullet indent intact", () => {
  // `inside` would push the bullet into the text and shift every bullet line to
  // the right, which would also break the importer's indent-based detection.
  for (const [name, css] of [
    ["preview", previewCss],
    ["pdf", pdfCss],
  ] as const) {
    const selector = name === "preview" ? ".resume-preview ul {" : ".resume ul {";
    const body = ruleBody(css, selector) ?? "";
    if (/list-style-position\s*:/.test(body)) {
      assert.doesNotMatch(body, /list-style-position\s*:\s*inside/, `${name} must not use inside markers`);
    }
    assert.match(body, /margin/, `${name} list rule should keep its indent margin`);
  }
});
