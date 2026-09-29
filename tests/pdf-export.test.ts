import assert from "node:assert/strict";
import test, { after } from "node:test";
import { SAMPLE_CV } from "../src/lib/cv-data";
import { renderResumeHtml } from "../src/lib/templates/render";
import { wrapResumeDocument } from "../src/lib/templates/styles";
import type { TemplateId } from "../src/lib/types";
import {
  generatePdf,
  isServerlessRuntime,
  pdfDiagnostics,
  pdfFilename,
  resolveLocalExecutable,
  __resetPdfBrowserForTests,
} from "../src/lib/server/pdf";

after(async () => {
  await __resetPdfBrowserForTests();
});

const pageCount = (pdf: Buffer) =>
  (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;

function documentFor(id: TemplateId, title = "John Doe CV"): string {
  return wrapResumeDocument(renderResumeHtml(SAMPLE_CV, id), id, title);
}

// --- filename / header safety ----------------------------------------------

test("pdfFilename keeps the header on one line and encodes non-ASCII titles", () => {
  // A title with CR/LF would otherwise split the Content-Disposition header.
  const injected = pdfFilename('CV\r\nX-Injected: 1"evil');
  assert.ok(!/[\r\n]/.test(injected), "header value must not contain CR/LF");
  assert.equal(injected.split("\r").length, 1);
  assert.match(injected, /filename="[^"]*\.pdf"/);
  assert.ok(!injected.includes('evil"'), "quotes must be replaced in the ASCII fallback");

  const unicode = pdfFilename("CV Résumé — John Doe");
  assert.match(unicode, /filename\*=UTF-8''/);
  assert.match(unicode, /%C3%A9/); // é survives for the browser that honours filename*
  assert.match(unicode, /filename="[\x20-\x7e]+\.pdf"/);

  for (const empty of ["", "   ", "...", null, undefined]) {
    assert.equal(pdfFilename(empty), pdfFilename("resume"));
  }

  // Path separators must never survive into the header value.
  for (const nasty of ["../../etc/passwd", "..\\..\\win.ini", 'a"b'] .map(pdfFilename)) {
    assert.ok(!/[\r\n]/.test(nasty), `CR/LF survived: ${JSON.stringify(nasty)}`);
    const ascii = nasty.match(/filename="([^"]*)"/)?.[1] ?? "";
    assert.ok(ascii.endsWith(".pdf"), `no .pdf suffix: ${ascii}`);
    assert.ok(!/[/\\]/.test(ascii), `path separator survived: ${ascii}`);
  }
});

// --- executable resolution --------------------------------------------------

test("resolveLocalExecutable prefers the configured path and ignores a broken one", () => {
  const real = "C:\\chrome\\chrome.exe";
  assert.equal(resolveLocalExecutable({ PUPPETEER_EXECUTABLE_PATH: real }, (p) => p === real), real);
  // A stale env pointing at a removed install must not win over a real one.
  const broken = (p: string) => p !== "C:\\gone\\chrome.exe";
  assert.equal(
    resolveLocalExecutable({ PUPPETEER_EXECUTABLE_PATH: "C:\\gone\\chrome.exe" }, broken),
    resolveLocalExecutable({}, broken),
  );
  // Nothing installed anywhere -> null, so the route can answer 503 instead of crashing.
  assert.equal(resolveLocalExecutable({}, () => false), null);
});

test("serverless runtimes are detected, local ones are not", () => {
  assert.equal(isServerlessRuntime({ VERCEL: "1" }), true);
  assert.equal(isServerlessRuntime({ AWS_LAMBDA_FUNCTION_NAME: "fn" }), true);
  assert.equal(isServerlessRuntime({} as Record<string, string | undefined>), false);
});

// --- real PDF output --------------------------------------------------------

test(
  "generatePdf produces a one-page PDF and reuses a single browser",
  { timeout: 180_000 },
  async () => {
    const before = pdfDiagnostics().launchCount;

    const classic = await generatePdf(documentFor("jake"));
    assert.equal(classic.subarray(0, 5).toString("latin1"), "%PDF-", "output is not a PDF");
    assert.ok(classic.byteLength > 5_000, `suspiciously small PDF: ${classic.byteLength} bytes`);
    assert.match(classic.toString("latin1").slice(-1024), /%%EOF/);
    assert.equal(pageCount(classic), 1, "sample CV should fit on a single Letter page");

    // A structurally different template goes through the same path.
    const grid = await generatePdf(documentFor("mono-grid", "CV Grid"));
    assert.equal(grid.subarray(0, 5).toString("latin1"), "%PDF-");
    assert.equal(pageCount(grid), 1);
    assert.notEqual(grid.toString("latin1").slice(0, 2000), classic.toString("latin1").slice(0, 2000));

    const launches = pdfDiagnostics().launchCount - before;
    assert.equal(launches, 1, `expected one Chromium launch for two exports, got ${launches}`);
  },
);

test("the exported PDF carries the CV content, not a blank page", { timeout: 120_000 }, async () => {
  await generatePdf(documentFor("swiss", "John Doe"));
  const pdf = await generatePdf(documentFor("swiss", "John Doe"));
  const raw = pdf.toString("latin1");
  assert.ok(pageCount(pdf) >= 1);
  // Chromium compresses content streams; a page with no text at all would be a
  // silent regression, so require a text-drawing operator somewhere.
  assert.match(raw, /\/Type\s*\/Page/, "no page object found");
  assert.ok(/\/(Font|Contents)/.test(raw), "page has no font/content resources");
  assert.ok(raw.includes("/MediaBox"), "page has no MediaBox");
});
