import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/auth-redirect";

function callbackRedirect(next: string, origin: string): URL {
  const path = safeInternalPath(next, origin);
  return new URL(path, origin);
}

export { callbackRedirect };


export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(callbackRedirect(next, origin));
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
