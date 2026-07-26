import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-2xl transition-all">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center transition hover:opacity-90">
          <Logo markSize={34} subtitle="" />
        </Link>
        <nav className="flex items-center gap-1.5">
          <Link href="/pricing">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              Pricing
            </Button>
          </Link>
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  Dashboard
                </Button>
              </Link>
              <form action={signOut}>
                <Button variant="outline" size="sm" type="submit" className="border-slate-800 text-slate-300 hover:text-white">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get started free</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
