import assert from "node:assert/strict";
import test, { after } from "node:test";
import { getDocumentProxy } from "unpdf";
import { SAMPLE_CV } from "../src/lib/cv-data";
import { PAPER } from "../src/lib/paper";
import { __resetPdfBrowserForTests, generatePdf } from "../src/lib/server/pdf";
import { renderResumeHtml } from "../src/lib/templates/render";
import { wrapResumeDocument } from "../src/lib/templates/styles";
import type { CvData } from "../src/lib/types";

after(async () => {
  await __resetPdfBrowserForTests();
});

const MARGIN_PT = PAPER.printMarginIn * 72;
/** Text may reach the content-box edge; it must not go past it. */
const TOL = 1.5;

/**
 * A CV long enough to break onto a second page. Every extra experience entry is a
 * few real lines, which is the only honest way to exercise pagination.
 */
function longCv(): CvData {
  const base = SAMPLE_CV.experience[0];
  return {
    ...SAMPLE_CV,
    experience: [
      ...SAMPLE_CV.experience,
      ...Array.from({ length: 14 }, (_, i) => ({ ...base, company: `${base.company} (${i + 2})` })),
    ],
  };
}

async function pageEdges(pdf: Buffer) {
  const doc = await getDocumentProxy(new Uint8Array(pdf));
  const pages: Array<{ page: number; gapTop: number; gapBottom: number }> = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const pg = await doc.getPage(i);
    const [x0, y0, , y1] = (pg as unknown as { view: number[] }).view;
    const content = await pg.getTextContent();
    let minY = Infinity;
    let maxY = -Infinity;
    for (const raw of content.items as Array<{ str?: string; transform?: number[] }>) {
      if (!raw.transform || !raw.str?.trim()) continue;
      minY = Math.min(minY, raw.transform[5]);
      maxY = Math.max(maxY, raw.transform[5]);
    }
    void x0;
    pages.push({
      page: i,
      gapTop: Number.isFinite(maxY) ? y1 - maxY : Infinity,
      gapBottom: Number.isFinite(minY) ? minY - y0 : Infinity,
    });
  }
  return { count: doc.numPages, pages };
}

test(
  "every page of a two-page CV keeps the print margin at the top and bottom",
  { timeout: 180_000 },
  async () => {
    // The sheet's own padding only applies at the very top of page 1 and the end of
    // the last page. At a page break the text used to run on to the paper edge —
    // measured at 4.2mm from the bottom of page 1 and 3.5mm from the top of page 2,
    // which is inside most printers' non-printable area. A page margin is the only
    // mechanism that repeats, and this is the assertion that keeps it there.
    const html = wrapResumeDocument(renderResumeHtml(longCv(), "jake"), "jake", "Margins");
    const { count, pages } = await pageEdges(await generatePdf(html));

    assert.ok(count > 1, `expected a multi-page CV, got ${count} page(s)`);
    for (const p of pages) {
      assert.ok(
        p.gapTop >= MARGIN_PT - TOL,
        `page ${p.page}: text is ${p.gapTop.toFixed(1)}pt from the top edge, margin is ${MARGIN_PT.toFixed(1)}pt`,
      );
      assert.ok(
        p.gapBottom >= MARGIN_PT - TOL,
        `page ${p.page}: text is ${p.gapBottom.toFixed(1)}pt from the bottom edge, margin is ${MARGIN_PT.toFixed(1)}pt`,
      );
    }
  },
);

test("the horizontal margins stay 0 so full-bleed panels still reach the edge", async () => {
  // sidebar and atlas paint a coloured panel out to the paper edge on purpose.
  // Moving the vertical space into a page margin must not have touched that.
  for (const template of ["sidebar", "atlas"] as const) {
    const html = wrapResumeDocument(renderResumeHtml(SAMPLE_CV, template), template, "Bleed");
    const doc = await getDocumentProxy(new Uint8Array(await generatePdf(html)));
    const pg = await doc.getPage(1);
    const [x0, , x1] = (pg as unknown as { view: number[] }).view;
    const content = await pg.getTextContent();
    let minX = Infinity;
    let maxX = -Infinity;
    for (const raw of content.items as Array<{ str?: string; transform?: number[]; width?: number }>) {
      if (!raw.transform || !raw.str?.trim()) continue;
      minX = Math.min(minX, raw.transform[4]);
      maxX = Math.max(maxX, raw.transform[4] + (raw.width ?? 0));
    }
    assert.ok(
      minX - x0 < MARGIN_PT - TOL,
      `${template}: the left panel no longer bleeds (${(minX - x0).toFixed(1)}pt inset)`,
    );
    assert.ok(x1 - maxX > 0, `${template}: text overflows the right edge`);
  }
});
