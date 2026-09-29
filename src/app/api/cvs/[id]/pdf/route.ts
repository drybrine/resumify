import { NextResponse } from "next/server";
import { renderResumeHtml } from "@/lib/templates/render";
import { wrapResumeDocument } from "@/lib/templates/styles";
import {
  generatePdf,
  pdfFilename,
  PdfBrowserUnavailableError,
} from "@/lib/server/pdf";
import { loadCvForExport } from "@/lib/server/export-cv";
import type { CvData, TemplateId } from "@/lib/types";

export const runtime = "nodejs";
// Chromium launch on a cold serverless instance can take a while; the default
// 10s function budget is not enough for it plus the render.
export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth + ownership lookup is shared with the DOCX route so the two cannot drift.
  const loaded = await loadCvForExport(id);
  if (!loaded.ok) return loaded.response;
  const cv = loaded.cv;

  const template = (cv.template as TemplateId) || "jake";
  const body = renderResumeHtml(cv.data as CvData, template);
  const html = wrapResumeDocument(body, template, cv.title ?? "Resume");

  try {
    const pdf = await generatePdf(html);
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.byteLength),
        "Content-Disposition": pdfFilename(cv.title),
        "Cache-Control": "no-store",
      },
    });
  } catch (cause) {
    // Never hand the client a raw driver/stack message.
    console.error("[pdf] generation failed", cause);
    if (cause instanceof PdfBrowserUnavailableError) {
      return NextResponse.json(
        {
          error:
            "Server PDF lagi tidak tersedia. Coba lagi sebentar, atau pakai Print → Save as PDF di browser.",
          code: "pdf_unavailable",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Gagal membuat PDF. Coba lagi.", code: "pdf_failed" },
      { status: 500 }
    );
  }
}
