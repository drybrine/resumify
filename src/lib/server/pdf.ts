import "server-only";
import { existsSync } from "node:fs";
import type { Browser, Page } from "puppeteer-core";
import { attachmentFilename } from "@/lib/server/attachment-filename";
import { PAPER } from "@/lib/paper";

/**
 * Server-side PDF generation for CV export.
 *
 * Two environments, two very different browsers:
 *   - serverless (Vercel / Lambda): the Chromium binary ships in
 *     `@sparticuz/chromium` and is unpacked at runtime.
 *   - local dev: we borrow a Chrome/Chromium that is already installed.
 *
 * Anything that makes the browser unavailable throws `PdfBrowserUnavailableError`
 * so the route can answer with a clean 503 instead of leaking internals.
 */
export class PdfBrowserUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfBrowserUnavailableError";
  }
}

const LOCAL_CANDIDATES: Partial<Record<NodeJS.Platform, string[]>> = {
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    // per-user install — the default for Chrome without admin rights
    `${process.env.LOCALAPPDATA ?? "C:\\Users\\Default\\AppData\\Local"}\\Google\\Chrome\\Application\\chrome.exe`,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ],
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ],
  linux: [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
    "/usr/bin/microsoft-edge",
  ],
};

/** Local (non-serverless) Chrome path: env override first, then known installs. */
export function resolveLocalExecutable(
  env: Record<string, string | undefined> = process.env,
  exists: (p: string) => boolean = existsSync,
): string | null {
  const configured = env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (configured && exists(configured)) return configured;

  for (const candidate of LOCAL_CANDIDATES[process.platform] ?? []) {
    if (candidate && exists(candidate)) return candidate;
  }
  return null;
}

export function isServerlessRuntime(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return Boolean(
    env.VERCEL ||
      env.AWS_LAMBDA_FUNCTION_NAME ||
      env.AWS_EXECUTION_ENV ||
      env.NETLIFY ||
      env.FUNCTIONS_WORKER_RUNTIME, // Azure
  );
}

const CHROME_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--font-render-hinting=none",
];

/** How long an idle browser is kept around before it is closed. */
const IDLE_CLOSE_MS = 30_000;
/** Cap on waiting for fonts before printing — a CV must not hang on a webfont. */
const FONT_WAIT_MS = 3_000;

let cached: { browser: Browser; timer: NodeJS.Timeout | null } | null = null;
let launchCount = 0;

/** Test/diagnostic hook: how many browsers this process has launched. */
export function pdfDiagnostics() {
  return { launchCount, hasCachedBrowser: Boolean(cached), lastFitScale };
}

async function loadPuppeteer() {
  const puppeteer = await import("puppeteer-core");
  return puppeteer.default ?? puppeteer;
}

async function launchBrowser(): Promise<Browser> {
  const puppeteer = await loadPuppeteer();

  if (isServerlessRuntime()) {
    let chromium: typeof import("@sparticuz/chromium").default;
    try {
      chromium = (await import("@sparticuz/chromium")).default;
    } catch (cause) {
      throw new PdfBrowserUnavailableError(
        `Chromium bundle for serverless PDF export is missing (${(cause as Error).message}).`,
      );
    }
    try {
      return await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1200, height: 1600 },
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    } catch (cause) {
      throw new PdfBrowserUnavailableError(
        `Could not launch the serverless Chromium build: ${(cause as Error).message}`,
      );
    }
  }

  const executablePath = resolveLocalExecutable();
  if (!executablePath) {
    const checked = (LOCAL_CANDIDATES[process.platform] ?? []).join(", ");
    throw new PdfBrowserUnavailableError(
      `No Chrome/Chromium found for PDF export. Set PUPPETEER_EXECUTABLE_PATH. Checked: ${checked}`,
    );
  }

  try {
    return await puppeteer.launch({ executablePath, headless: true, args: CHROME_ARGS });
  } catch (cause) {
    throw new PdfBrowserUnavailableError(
      `Chrome at ${executablePath} could not be launched: ${(cause as Error).message}`,
    );
  }
}

/* ------------------------------------------------------------ fit to page */

/** The sheet, as the document's stylesheets define it. */
const SHEET_SELECTOR = ".resume";

/**
 * Never shrink below this. A CV that needs more than a fifth off its type is not
 * a one-pager — the honest answer there is a second page, not 7pt text.
 */
export const FIT_FLOOR = 0.8;

/** Re-measurements allowed after applying a scale, since scaling reflows the text. */
const FIT_STEPS = 3;

/**
 * Sub-pixel tolerance around the page box.
 *
 * Deliberately tight. A sheet 0.68px taller than the page box (1123.2px against
 * 1122.5px) really does print as two pages, so a looser tolerance reports "fits"
 * while Chrome disagrees and the fit loop stops one step early — which is exactly
 * how a 0.95 scale produced a two-page PDF.
 */
const FIT_TOLERANCE_PX = 0.25;

/**
 * Land strictly inside the page rather than on its boundary.
 *
 * Scaling widens the measure, which reflows the text, so the height that comes
 * back after applying a scale is never quite the one that was predicted. Half a
 * percent of headroom (about 5.6px, or 1.5mm, on an A4 sheet) absorbs that drift
 * and the printer's own rounding; the type loses 0.05pt, which is invisible.
 */
const FIT_HEADROOM = 0.995;

/**
 * The scale to print at, given the sheet's measured height.
 *
 * A CV that runs a few lines past the page box used to arrive as two pages whose
 * second one held three lines — which reads as "the export cut off my CV". Word
 * never does this: a .docx reflows and the same content lands on one page. So the
 * PDF does the same thing, by shrinking just enough to fit, and only while that
 * stays above FIT_FLOOR.
 *
 * Pure so the rule can be tested without a browser; `fitToPage` applies it.
 */
export function fitScale(currentScale: number, sheetHeightPx: number, pageHeightPx: number): number {
  if (!(sheetHeightPx > pageHeightPx + FIT_TOLERANCE_PX)) return currentScale;
  // Cumulative: the sheet is measured *after* the current scale is in effect, and
  // shrinking widens the measure, which reflows the text and changes the height.
  const needed = (currentScale * pageHeightPx * FIT_HEADROOM) / sheetHeightPx;
  return needed >= FIT_FLOOR ? needed : 1;
}

/**
 * Height of the sheet as the page box sees it, in CSS pixels.
 *
 * `zoom` scales what the printer lays out, and `getBoundingClientRect` reports
 * that scaled height — it is the number that decides pagination. `scrollHeight`
 * would report the pre-zoom layout height instead, which would shrink the sheet
 * twice.
 */
function sheetHeightPx(page: Page): Promise<number> {
  return page.evaluate((selector) => {
    const el = document.querySelector(selector);
    return el ? el.getBoundingClientRect().height : 0;
  }, SHEET_SELECTOR);
}

/**
 * Apply a fit factor by scaling the sheet and widening its box to compensate.
 *
 * `zoom` alone would shrink the sheet *and* leave a band of unused paper on the
 * right; pairing it with `width: pageWidth / zoom` keeps the printed width at
 * exactly one page while the type comes down. Verified: 1 page and 80-84% of the
 * width inked, against 55-73% for `page.pdf({ scale })`.
 */
async function applyFit(page: Page, scale: number, width: string, height: string): Promise<void> {
  await page.evaluate(
    (s, w, h) => {
      const ID = "paper-fit";
      let style = document.getElementById(ID) as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement("style");
        style.id = ID;
        document.head.appendChild(style);
      }
      style.textContent =
        s === 1 ? "" : `.resume{zoom:${s};width:calc(${w} / ${s});min-height:calc(${h} / ${s})}`;
    },
    scale,
    width,
    height,
  );
}

/**
 * Shrink the sheet until it fits one page, or give up (leaving it at 100%).
 *
 * Measured against the page's *content* height — the page box minus the print
 * margins — because that is the space a page actually has to offer.
 */
async function fitToPage(page: Page): Promise<number> {
  const pageHeightPx = PAPER.contentHeightPx;
  let scale = 1;

  for (let step = 0; step < FIT_STEPS; step++) {
    const height = await sheetHeightPx(page);
    if (!height) return scale;
    const next = fitScale(scale, height, pageHeightPx);
    if (next === scale) return scale;
    scale = next;
    // The content height, not the full sheet: the vertical space is a page margin
    // now, so the sheet inside it is only PAGE.contentHeight tall.
    await applyFit(page, scale, PAPER.widthCss, PAPER.contentHeightCss);
  }
  return scale;
}

/** The scale the last export printed at — 1 when the sheet fitted or was left alone. */
let lastFitScale = 1;

/** Launching Chromium costs ~1s, so a warm browser is reused for consecutive exports. */
async function acquireBrowser(): Promise<Browser> {
  if (cached?.timer) {
    clearTimeout(cached.timer);
    cached.timer = null;
  }
  if (cached && cached.browser.connected) return cached.browser;

  const browser = await launchBrowser();
  launchCount += 1;
  browser.on("disconnected", () => {
    if (cached?.browser === browser) cached = null;
  });
  cached = { browser, timer: null };
  return browser;
}

function releaseBrowser() {
  if (!cached) return;
  cached.timer = setTimeout(() => {
    const browser = cached?.browser;
    cached = null;
    browser?.close().catch(() => {});
  }, IDLE_CLOSE_MS);
  // Do not hold the event loop open just for the idle timer.
  cached.timer.unref?.();
}

export async function generatePdf(html: string): Promise<Buffer> {
  const browser = await acquireBrowser();

  try {
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: "load" });
      // `load` does not cover font loading; printing earlier can produce a PDF in
      // fallback typefaces. Bounded so a stalled font can never hang the export.
      await Promise.race([
        page.evaluate(() => (globalThis as { document?: Document }).document?.fonts?.ready),
        new Promise((resolve) => setTimeout(resolve, FONT_WAIT_MS)),
      ]);
      // Measured after the fonts settle: a fallback typeface is wider than the one
      // the CV asks for, and that changes whether the content still fits a page.
      lastFitScale = await fitToPage(page);
      const pdf = await page.pdf({
        format: PAPER.printFormat,
        printBackground: true,
        // Vertical space is a page margin, not sheet padding: it has to repeat on
        // every page. Left/right stay 0 so the full-bleed side columns still reach
        // the paper edge; the templates supply their own horizontal padding.
        margin: {
          top: PAPER.printMarginCss,
          bottom: PAPER.printMarginCss,
          left: "0",
          right: "0",
        },
      });
      return Buffer.from(pdf);
    } finally {
      await page.close().catch(() => {});
    }
  } catch (cause) {
    if (cause instanceof PdfBrowserUnavailableError) throw cause;
    throw new PdfBrowserUnavailableError(
      `Rendering the CV document failed: ${(cause as Error).message}`,
    );
  } finally {
    releaseBrowser();
  }
}

/** Test seam: drop the cached browser and reset the counter. */
export async function __resetPdfBrowserForTests() {
  const browser = cached?.browser;
  if (cached?.timer) clearTimeout(cached.timer);
  cached = null;
  launchCount = 0;
  await browser?.close().catch(() => {});
}

/** Build a `Content-Disposition` header that survives odd CV titles. */
export function pdfFilename(title: string | null | undefined): string {
  return attachmentFilename(title, "pdf");
}
