import Link from "next/link";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export const metadata = { title: "Masuk" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-rule">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Resumify — beranda">
            <Logo markSize={22} subtitle="" />
          </Link>
          <Link
            href="/signup"
            className="text-[13px] text-ink-2 transition-colors hover:text-ink"
          >
            Belum punya akun? Daftar
          </Link>
        </div>
      </header>

      <main id="main" className="flex flex-1 items-start justify-center px-4 py-14 sm:py-20">
        <div className="w-full max-w-[420px]">
          <p className="micro enter">Akun</p>
          <h1
            className="enter mt-4 text-[32px] leading-tight text-ink"
            style={{ "--d": "70ms" } as React.CSSProperties}
          >
            Masuk
          </h1>
          <p
            className="enter mt-3 text-[14px] leading-relaxed text-ink-2"
            style={{ "--d": "140ms" } as React.CSSProperties}
          >
            Lanjutkan mengisi CV dan unduh PDF-nya. Semua perubahan tersimpan
            otomatis setelah kamu masuk.
          </p>

          <div
            className="enter-sheet mt-8 rounded-print border border-rule bg-sheet p-6 sm:p-7"
            style={{ "--d": "200ms" } as React.CSSProperties}
          >
            <LoginForm next={next || "/dashboard"} />
          </div>

          <p
            className="enter mt-6 text-[13px] text-ink-3"
            style={{ "--d": "280ms" } as React.CSSProperties}
          >
            Dengan masuk, kamu menyetujui{" "}
            <Link href="/terms" className="link-rule">
              syarat penggunaan
            </Link>{" "}
            dan{" "}
            <Link href="/privacy" className="link-rule">
              kebijakan privasi
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
