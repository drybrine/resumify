import { NextResponse } from "next/server";
import { generateDocx, docxFilename } from "@/lib/server/docx";
import { loadCvForExport } from "@/lib/server/export-cv";
import type { CvData, TemplateId } from "@/lib/types";

export const runtime = "nodejs";
// No browser involved, so this stays comfortably inside the default budget — the
// Word export keeps working even when the PDF route cannot find a Chromium.
export const maxDuration = 30;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const loaded = await loadCvForExport(id);
  if (!loaded.ok) return loaded.response;
  const cv = loaded.cv;

  const template = (cv.template as TemplateId) || "jake";

  try {
    const docx = await generateDocx(cv.data as CvData, template, cv.title);
    return new NextResponse(new Uint8Array(docx), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Length": String(docx.byteLength),
        "Content-Disposition": docxFilename(cv.title),
        "Cache-Control": "no-store",
      },
    });
  } catch (cause) {
    // Never hand the client a raw stack message.
    console.error("[docx] generation failed", cause);
    return NextResponse.json(
      { error: "Gagal membuat file Word. Coba lagi.", code: "docx_failed" },
      { status: 500 }
    );
  }
}
