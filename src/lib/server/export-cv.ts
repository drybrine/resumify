import "server-only";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** The columns every export route needs from a CV row. */
export type ExportCvRow = {
  title: string | null;
  template: string | null;
  data: unknown;
};

export type LoadCvResult =
  | { ok: true; cv: ExportCvRow }
  | { ok: false; response: NextResponse };

/**
 * Authenticate the caller and load their CV, for the export routes.
 *
 * Shared by PDF and DOCX on purpose: when each route hand-rolled this, the
 * empty-array-from-`.single()` case was handled in one and missed in others, and
 * an undefined row reached the renderer as a 500. One implementation means one
 * place to be right.
 */
export async function loadCvForExport(id: string): Promise<LoadCvResult> {
  let row: ExportCvRow;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
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
    const found = Array.isArray(data) ? data[0] : data;
    if (error || !found) {
      return {
        ok: false,
        response: NextResponse.json({ error: "CV not found" }, { status: 404 }),
      };
    }
    row = found;
  } catch (cause) {
    console.error("[export] auth/lookup failed", cause);
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Tidak bisa memuat CV ini.", code: "lookup_failed" },
        { status: 500 },
      ),
    };
  }

  return { ok: true, cv: row };
}
