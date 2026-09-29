import { NextResponse } from "next/server";
import { normalizeApplicationKit } from "@/lib/apply/kit";
import { generateLetterDocx } from "@/lib/server/letter-docx";
import { attachmentFilename } from "@/lib/server/attachment-filename";
import { loadCvForExport } from "@/lib/server/export-cv";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const loaded = await loadCvForExport(id);
  if (!loaded.ok) return loaded.response;
  const cv = loaded.cv;

  const kit = normalizeApplicationKit((cv.data as { apply?: unknown } | null)?.apply);
  if (!kit.letter.trim()) {
    return NextResponse.json(
      { error: "Surat lamaran masih kosong. Buat dulu drafnya.", code: "letter_empty" },
      { status: 400 },
    );
  }

  const label = `${cv.title || "CV"} - Surat Lamaran`;

  try {
    const docx = await generateLetterDocx(kit.letter, label);
    return new NextResponse(new Uint8Array(docx), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Length": String(docx.byteLength),
        "Content-Disposition": attachmentFilename(label, "docx"),
        "Cache-Control": "no-store",
      },
    });
  } catch (cause) {
    console.error("[letter] docx generation failed", cause);
    return NextResponse.json(
      { error: "Gagal membuat file Word surat lamaran. Coba lagi.", code: "docx_failed" },
      { status: 500 },
    );
  }
}
