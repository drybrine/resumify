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
          <p className="micro">Akun</p>
          <h1 className="mt-4 text-[32px] leading-tight text-ink">Masuk</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
            Lanjutkan mengisi CV dan unduh PDF-nya. Semua perubahan tersimpan
            otomatis setelah kamu masuk.
          </p>

          <div className="mt-8 rounded-print border border-rule bg-sheet p-6 sm:p-7">
            <LoginForm next={next || "/dashboard"} />
          </div>

          <p className="mt-6 text-[13px] text-ink-3">
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
