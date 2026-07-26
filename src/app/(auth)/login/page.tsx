import Link from "next/link";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";
import { Check } from "lucide-react";

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="min-h-screen mesh-gradient-bg flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center sm:text-left">
            <Link href="/" className="inline-flex mb-6">
              <Logo markSize={36} subtitle="ATS Resume" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Selamat datang kembali
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Masuk untuk lanjut edit CV dan export PDF.
            </p>
          </div>

          <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl">
            <LoginForm next={next || "/dashboard"} />
            <p className="mt-6 text-center text-sm text-slate-400">
              Belum punya akun?{" "}
              <Link href="/signup" className="font-semibold text-indigo-400 hover:text-indigo-300">
                Daftar gratis
              </Link>
            </p>
          </div>

          <ul className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-500">
            {["Data terenkripsi", "Autosave cloud", "Export PDF"].map((t) => (
              <li key={t} className="flex items-center gap-1">
                <Check className="h-3 w-3 text-emerald-500" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
