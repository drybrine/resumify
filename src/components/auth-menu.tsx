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
  // null = "not known yet". Without credentials there is nothing to resolve, so
  // start at the signed-out markup instead of waiting for an effect.
  const [signedIn, setSignedIn] = useState<boolean | null>(
    SUPABASE_URL && SUPABASE_KEY ? null : false,
  );

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

  // Reserve the exact height so resolving the session does not shift the layout.
  if (signedIn === null) {
    return <div className="h-8 w-[150px]" aria-hidden />;
  }

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
