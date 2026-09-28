import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderResumeHtml } from "@/lib/templates/render";
import { wrapResumeDocument } from "@/lib/templates/styles";
import {
  generatePdf,
  pdfFilename,
  PdfBrowserUnavailableError,
} from "@/lib/server/pdf";
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

  let cv: { title: string | null; template: string | null; data: unknown };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("cvs")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    // `.single()` normally answers 406 + PGRST116 when nothing matches, but a
    // proxy or a mocked client can hand back an empty array instead — treat both
    // as "not yours / not there" rather than letting an undefined row reach the
    // renderer and surface as a bare 500.
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }
    cv = row;
  } catch (cause) {
    console.error("[pdf] auth/lookup failed", cause);
    return NextResponse.json(
      { error: "Tidak bisa memuat CV ini.", code: "lookup_failed" },
      { status: 500 }
    );
  }

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
