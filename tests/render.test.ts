import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_CV } from "../src/lib/cv-data";
import { renderResumeHtml } from "../src/lib/templates/render";
import { wrapResumeDocument } from "../src/lib/templates/styles";
import type { CvData } from "../src/lib/types";

function renderWithPublicationUrl(url: string): string {
  const data = structuredClone(EMPTY_CV) as CvData;
  data.publications = [{ text: "Publication", url }];
  return renderResumeHtml(data, "jake");
}

test("publication links reject javascript URLs", () => {
  const html = renderWithPublicationUrl("javascript:alert(document.domain)");
  assert.doesNotMatch(html, /href=["']\s*javascript:/i);
});

test("publication links accept HTTPS URLs", () => {
  const html = renderWithPublicationUrl("https://example.com/paper");
  assert.match(html, /href="https:\/\/example\.com\/paper"/);
});

test("publication links accept bare hostnames with ports", () => {
  const html = renderWithPublicationUrl("example.com:8080/paper");
  assert.match(html, /href="https:\/\/example\.com:8080\/paper"/);
});

test("PDF wrapper escapes a user-controlled CV title", () => {
  const html = wrapResumeDocument(
    "",
    "jake",
    "</title><script>globalThis.pwned=true</script>",
  );
  assert.doesNotMatch(html, /<script>globalThis\.pwned/);
  assert.match(html, /&lt;\/title&gt;&lt;script&gt;/);
});
