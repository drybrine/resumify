import assert from "node:assert/strict";
import test, { after } from "node:test";
import { getDocumentProxy } from "unpdf";
import { SAMPLE_CV } from "../src/lib/cv-data";
import { PAPER } from "../src/lib/paper";
import { renderResumeHtml } from "../src/lib/templates/render";
import { wrapResumeDocument } from "../src/lib/templates/styles";
import type { CvData } from "../src/lib/types";
import {
  FIT_FLOOR,
  __resetPdfBrowserForTests,
  fitScale,
  generatePdf,
  pdfDiagnostics,
} from "../src/lib/server/pdf";

after(async () => {
  await __resetPdfBrowserForTests();
});

const pageCount = (pdf: Buffer) =>
  (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;

function documentFor(id: "jake", cv: CvData = SAMPLE_CV): string {
  return wrapResumeDocument(renderResumeHtml(cv, id), id, "Fit");
}

/** Fraction of the paper width that the text actually reaches across. */
async function widthFill(pdf: Buffer): Promise<number> {
  const doc = await getDocumentProxy(new Uint8Array(pdf));
  const page = await doc.getPage(1);
  const view = (page as unknown as { view: number[] }).view;
  const content = await page.getTextContent();
  let min = Infinity;
  let max = -Infinity;
  for (const item of content.items as Array<{ str?: string; transform?: number[] }>) {
    if (!item.transform || !item.str?.trim()) continue;
    min = Math.min(min, item.transform[4]);
    max = Math.max(max, item.transform[4]);
  }
  return (max - min) / (view[2] - view[0]);
}

/**
 * Grow the sample CV until it runs past one page. Each extra experience entry is a
 * few lines of real content, which is what actually pushes a sheet over the edge.
 */
function grow(extraExperiences: number): CvData {
  const base = SAMPLE_CV.experience[0];
  return {
    ...SAMPLE_CV,
    experience: [
      ...SAMPLE_CV.experience,
      ...Array.from({ length: extraExperiences }, (_, i) => ({
        ...base,
        company: `${base.company} (${i + 2})`,
      })),
    ],
  };
}

/* --------------------------------------------------------- the scale rule */

test("a sheet that already fits is left alone", () => {
  assert.equal(fitScale(1, PAPER.heightPx - 5, PAPER.heightPx), 1);
  assert.equal(fitScale(1, PAPER.heightPx, PAPER.heightPx), 1);
  assert.equal(fitScale(1, PAPER.heightPx + 0.2, PAPER.heightPx), 1);
});

test("an overflow is scaled to land inside the page, not on its edge", () => {
  const height = PAPER.heightPx * 1.1;
  const scale = fitScale(1, height, PAPER.heightPx);
  // The invariant that matters: after scaling, the sheet is strictly inside the
  // page box — an exact edge is what printed as a second page.
  assert.ok((height * scale) / PAPER.heightPx < 1, `scale ${scale} leaves the sheet over the edge`);
  assert.ok(scale >= FIT_FLOOR);
});

test("an overflow too small to be worth scaling stays put, but a real one does not", () => {
  // 0.68px over really is two pages, so it must be scaled.
  assert.ok(fitScale(1, PAPER.heightPx + 0.68, PAPER.heightPx) < 1);
  // 0.2px over is rounding.
  assert.equal(fitScale(1, PAPER.heightPx + 0.2, PAPER.heightPx), 1);
});

test("the scale is cumulative, because the sheet is re-measured after each step", () => {
  // Already at 0.9 and still 5% over: the answer builds on 0.9, not on 1.
  const height = PAPER.heightPx * 1.05;
  const scale = fitScale(0.9, height, PAPER.heightPx);
  assert.ok(scale < 0.9, `expected a tightening below 0.9, got ${scale}`);
  assert.ok((height * scale) / (PAPER.heightPx * 0.9) < 1, "should land inside relative to the current scale");
});

test("the floor is reachable, and just past it the fit declines", () => {
  // 24% over needs 0.995/1.24 = 0.8024, just above the floor: still fitted.
  const fitted = fitScale(1, PAPER.heightPx * 1.24, PAPER.heightPx);
  assert.ok(
    fitted >= FIT_FLOOR && fitted < 0.81,
    `expected a scale at the floor, got ${fitted}`,
  );
  // 25% over needs 0.796, below the floor: refuse rather than print 7pt type.
  assert.equal(fitScale(1, PAPER.heightPx * 1.25, PAPER.heightPx), 1);
});

test("an overflow that would need unreadable type is not scaled at all", () => {
  // 40% over -> ~0.71, under the floor. A second page beats 7pt text.
  assert.equal(fitScale(1, PAPER.heightPx * 1.4, PAPER.heightPx), 1);
  // And a floor already in effect is reversed rather than tightened further.
  assert.equal(fitScale(0.82, PAPER.heightPx * 1.1, PAPER.heightPx), 1);
});

/* ------------------------------------------------- end to end, real Chrome */

test("a CV that runs past one page still exports as a single page", { timeout: 180_000 }, async () => {
  // Five extra entries is the measured sweet spot: four still fit unaided, and
  // eight need more than the floor allows (verified against the real renderer).
  const pdf = await generatePdf(documentFor("jake", grow(5)));

  assert.ok(
    pdfDiagnostics().lastFitScale < 1,
    "the fixture no longer overflows — grow() needs to add more content",
  );
  assert.equal(pageCount(pdf), 1, "the fitted CV should be one page");
  // The point of widening the box while zooming: the type still spans the paper.
  // `page.pdf({ scale })` reached only 55-73% and left a band of blank paper.
  const fill = await widthFill(pdf);
  assert.ok(fill > 0.7, `text only reaches ${(fill * 100).toFixed(0)}% of the paper width`);
  assert.ok(
    pdfDiagnostics().lastFitScale >= FIT_FLOOR,
    "the fit must not go below the readable floor",
  );
});

test("a CV far too long keeps its second page instead of being squeezed", { timeout: 180_000 }, async () => {
  const pdf = await generatePdf(documentFor("jake", grow(14)));

  assert.equal(pdfDiagnostics().lastFitScale, 1, "the floor should have declined to shrink");
  assert.ok(pageCount(pdf) > 1, "content this long genuinely needs more than one page");
});

test("the fit never goes below the floor", { timeout: 180_000 }, async () => {
  await generatePdf(documentFor("jake", grow(14)));
  assert.ok(pdfDiagnostics().lastFitScale >= FIT_FLOOR);
});
