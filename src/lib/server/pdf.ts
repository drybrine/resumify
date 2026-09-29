import "server-only";
import { existsSync } from "node:fs";
import type { Browser } from "puppeteer-core";
import { attachmentFilename } from "@/lib/server/attachment-filename";

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
  return { launchCount, hasCachedBrowser: Boolean(cached) };
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
      const pdf = await page.pdf({
        format: "Letter",
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
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
