import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderResumeHtml } from "@/lib/templates/render";
import { wrapResumeDocument } from "@/lib/templates/styles";
import type { CvData, TemplateId } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: cv, error } = await supabase
    .from("cvs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !cv) {
    return NextResponse.json({ error: "CV not found" }, { status: 404 });
  }

  const body = renderResumeHtml(
    cv.data as CvData,
    (cv.template as TemplateId) || "jake"
  );
  const html = wrapResumeDocument(
    body,
    (cv.template as TemplateId) || "jake",
    cv.title
  );

  try {
    const pdf = await generatePdf(html);
    const safeTitle = (cv.title || "resume").replace(/[^\w\s.-]/g, "_").trim();
    const filename = `${safeTitle}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "PDF generation failed";
    // Fallback: return HTML for browser print if Chromium unavailable
    if (message.includes("chromium") || message.includes("Executable") || message.includes("browser")) {
      return NextResponse.json(
        {
          error:
            "Server PDF unavailable in this environment. Use browser Print → Save as PDF, or deploy with Chromium support.",
          fallback: "print",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function generatePdf(html: string): Promise<Buffer> {
  const isVercel = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isVercel) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = await import("puppeteer-core");
    const browser = await puppeteer.default.launch({
      args: chromium.args,
      defaultViewport: { width: 1200, height: 1600 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load" });
      const pdf = await page.pdf({
        format: "Letter",
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  // Local: try puppeteer-core with system chrome
  const puppeteer = await import("puppeteer-core");
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    (process.platform === "linux"
      ? "/usr/bin/google-chrome"
      : process.platform === "darwin"
        ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        : "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe");

  const browser = await puppeteer.default.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
