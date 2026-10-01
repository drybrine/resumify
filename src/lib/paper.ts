/**
 * The paper size, written down once.
 *
 * It used to be Letter, hardcoded in sixteen places: the PDF print options, both
 * stylesheets, the preview scaler, the editor's fit calculation, the Word section
 * properties and the cover-letter sheet. The product ships to people who print on
 * A4, so a CV laid out for 8.5in x 11in either got scaled down by the printer —
 * which moves every margin and shrinks the text — or clipped at the edges.
 *
 * A4 is 210 x 297 mm: 22px narrower and 66px taller than Letter at 96dpi, which
 * is enough to reflow a template, so a change here has to be re-checked against
 * the page count of all 20 of them (see the paper-size note in the project skill).
 *
 * `src/app/globals.css` cannot import this — it is a real stylesheet that mirrors
 * the PDF one by hand — so its `.resume-preview` size is kept in step manually
 * and `tests/paper-size.test.ts` fails if the two ever disagree.
 */
const MM_PER_IN = 25.4;
const PX_PER_IN = 96;
const PT_PER_IN = 72;

export const PAPER = {
  widthMm: 210,
  heightMm: 297,
  widthIn: 210 / MM_PER_IN,
  heightIn: 297 / MM_PER_IN,
  /** CSS pixels at 96dpi — the unit the on-screen preview scaler works in. */
  widthPx: (210 / MM_PER_IN) * PX_PER_IN,
  heightPx: (297 / MM_PER_IN) * PX_PER_IN,
  /** Points — the unit a PDF reports its page box in. */
  widthPt: (210 / MM_PER_IN) * PT_PER_IN,
  heightPt: (297 / MM_PER_IN) * PT_PER_IN,
  /** Millimetres in CSS: exact, where a rounded inch would drift off the page. */
  widthCss: "210mm",
  heightCss: "297mm",
  /**
   * Twips (twentieths of a point), the unit OOXML measures a page in.
   * Rounded on purpose: A4 is 11905.5 twips wide, and letting the writer floor it
   * produces a page 1/1440in narrower than the A4 every Word install emits.
   */
  widthTwip: Math.round((210 / MM_PER_IN) * 1440),
  heightTwip: Math.round((297 / MM_PER_IN) * 1440),
  /**
   * Vertical print margin, applied by the printer to **every** page.
   *
   * The sheet's own padding only ever applies at the top of page 1 and the end of
   * the last page: at a page break the text simply carried on to the paper edge —
   * measured at 4.2mm from the bottom of page 1 and 3.5mm from the top of page 2,
   * which is inside most printers' non-printable area and reads as "cut off".
   * A page margin is the only mechanism that repeats on every page.
   *
   * 0.35in is chosen to be the smallest vertical padding any template declared, so
   * each template's padding is reduced by exactly this much and the printed result
   * is unchanged for the 17 that had room to give. The three full-bleed templates
   * (modern, sidebar, creative) declared none, so they gain this margin and lose
   * the same amount of height — a deliberate trade: a bleeding band cannot be
   * printed to the edge anyway.
   */
  printMarginIn: 0.35,
  printMarginCss: "0.35in",
  /** Height inside the margins: what one page can actually hold. */
  contentHeightCss: "279.22mm",
  contentHeightMm: 297 - 0.35 * 2 * MM_PER_IN,
  contentHeightPx: (297 - 0.35 * 2 * MM_PER_IN) * (PX_PER_IN / MM_PER_IN),
  /** The value Chrome's `page.pdf()` expects for `format`. */
  printFormat: "A4",
} as const;
