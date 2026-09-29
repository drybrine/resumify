import { NextResponse } from "next/server";
import { renderLetterBody, wrapLetterDocument } from "@/lib/apply/letter-document";
import { normalizeApplicationKit } from "@/lib/apply/kit";
import { generatePdf, PdfBrowserUnavailableError } from "@/lib/server/pdf";
import { attachmentFilename } from "@/lib/server/attachment-filename";
import { loadCvForExport } from "@/lib/server/export-cv";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const loaded = await loadCvForExport(id);
  if (!loaded.ok) return loaded.response;
  const cv = loaded.cv;

  // Rendered from what is saved, like the CV exports, so the file always matches
  // what the editor showed when the button was pressed.
  const kit = normalizeApplicationKit((cv.data as { apply?: unknown } | null)?.apply);
  if (!kit.letter.trim()) {
    return NextResponse.json(
      { error: "Surat lamaran masih kosong. Buat dulu drafnya.", code: "letter_empty" },
      { status: 400 },
    );
  }

  const label = `${cv.title || "CV"} - Surat Lamaran`;
  const html = wrapLetterDocument(renderLetterBody(kit.letter), label);

  try {
    const pdf = await generatePdf(html);
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.byteLength),
        "Content-Disposition": attachmentFilename(label, "pdf"),
        "Cache-Control": "no-store",
      },
    });
  } catch (cause) {
    console.error("[letter] pdf generation failed", cause);
    if (cause instanceof PdfBrowserUnavailableError) {
      return NextResponse.json(
        {
          error:
            "Server PDF lagi tidak tersedia. Coba lagi sebentar, atau pakai Print → Save as PDF di browser.",
          code: "pdf_unavailable",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "Gagal membuat PDF surat lamaran. Coba lagi.", code: "pdf_failed" },
      { status: 500 },
    );
  }
}
