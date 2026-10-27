"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

/**
 * The signed-in half of the header.
 *
 * Deliberately client-side: reading the session on the server pulls `cookies()`
 * into the root layout, which makes *every* route dynamic — including the
 * marketing pages that should be prerendered and cached at the edge. Here the
 * server renders the signed-out markup (correct for crawlers and first paint)
 * and the browser swaps it once it knows there is a session.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function AuthMenu() {
  // Start signed-out, not blank: this renders the primary call to action in the
  // server HTML (so it is there for crawlers and for the first paint), and the
  // browser only ever swaps *towards* the signed-in state. The alternative — a
  // placeholder until the session resolves — left a hole where "Daftar gratis"
  // belongs on the one page that has to convert.
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_KEY) return;

    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
    let active = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (active) setSignedIn(Boolean(data.user));
      })
      .catch(() => {
        if (active) setSignedIn(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setSignedIn(Boolean(session?.user));
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (signedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="px-2 text-[13px] text-ink-2 transition-colors hover:text-ink"
        >
          Dasbor
        </Link>
        <form action={signOut}>
          <Button variant="secondary" size="sm" type="submit">
            Keluar
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="nav-link relative px-2 text-[13px] text-ink-2 transition-colors hover:text-ink"
      >
        Masuk
      </Link>
      <Link href="/signup">
        <Button size="sm">Daftar gratis</Button>
      </Link>
    </div>
  );
}
