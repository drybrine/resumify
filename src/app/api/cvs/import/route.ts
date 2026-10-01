import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractCvLines, MAX_IMPORT_BYTES } from "@/lib/import/extract";
import { parseCvLines } from "@/lib/import/parse";

/**
 * Parse an uploaded CV into structured data.
 *
 * Returns the data instead of creating anything: the parse is heuristic, so the
 * user should see what was recognised — and what was not — before a CV lands in
 * their dashboard. The client then creates it with the template they pick.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = MAX_IMPORT_BYTES;

function message(error: unknown): string {
  return error instanceof Error ? error.message : "Gagal membaca file-nya.";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Parsing is CPU work on someone else's file; keep it behind a session.
  if (!user) return NextResponse.json({ error: "Masuk dulu ya." }, { status: 401 });

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declared) && declared > MAX_UPLOAD_BYTES + 512 * 1024) {
    return NextResponse.json({ error: "File-nya lebih dari 8 MB." }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload-nya tidak terbaca. Coba lagi." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Pilih file CV-nya dulu." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "File-nya kosong." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File-nya lebih dari 8 MB." }, { status: 413 });
  }

  let extracted;
  try {
    extracted = await extractCvLines({
      name: file.name,
      type: file.type,
      bytes: Buffer.from(await file.arrayBuffer()),
    });
  } catch (error) {
    // A malformed or unsupported file is the user's mistake, not a server fault.
    return NextResponse.json({ error: message(error) }, { status: 422 });
  }

  const parsed = parseCvLines(extracted.lines);
  const warnings = [...parsed.warnings];

  // A scanned CV has pages but almost no text layer, so the parse comes back
  // empty and looks like a bug unless it is named as one.
  if (extracted.pageCount > 0 && extracted.charCount < 40) {
    warnings.unshift(
      "Hampir tidak ada teks yang bisa dibaca — sepertinya CV-nya hasil scan (gambar). Coba kirim PDF asli hasil ketik, atau Word-nya.",
    );
  }

  return NextResponse.json({
    data: parsed.data,
    warnings,
    found: {
      ...parsed.found,
      pageCount: extracted.pageCount,
      charCount: extracted.charCount,
    },
  });
}
