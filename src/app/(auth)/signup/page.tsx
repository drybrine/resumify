import Link from "next/link";
import { Logo } from "@/components/logo";
import { SignupForm } from "./signup-form";
import { Check } from "lucide-react";

export const metadata = { title: "Sign up" };

const perks = [
  "1 CV gratis + export PDF",
  "Template ATS Jake & Minimal",
  "Tanpa kartu kredit",
];

export default function SignupPage() {
  return (
    <div className="min-h-screen mesh-gradient-bg flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Value panel — desktop */}
          <div className="hidden lg:block">
            <Link href="/" className="inline-flex mb-8">
              <Logo markSize={40} subtitle="ATS Resume" />
            </Link>
            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Buat CV yang siap dilamar —{" "}
              <span className="text-gradient-purple">mulai gratis</span>
            </h1>
            <p className="mt-3 text-slate-400 text-sm leading-relaxed">
              Live preview, template profesional, PDF instan. Upgrade Pro via QRIS
              hanya saat butuh lebih banyak CV & share link.
            </p>
            <ul className="mt-8 space-y-3">
              {perks.map((p) => (
                <li key={p} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="h-6 w-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Form card */}
          <div>
            <div className="lg:hidden mb-6">
              <Link href="/" className="inline-flex mb-4">
                <Logo markSize={36} subtitle="ATS Resume" />
              </Link>
              <h1 className="text-2xl font-extrabold text-white">Buat akun gratis</h1>
              <p className="mt-1 text-sm text-slate-400">
                Free: 1 CV + PDF. Siap dalam 1 menit.
              </p>
            </div>

            <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl">
              <p className="hidden lg:block text-lg font-bold text-white mb-1">
                Daftar Resumify
              </p>
              <p className="hidden lg:block text-sm text-slate-400 mb-6">
                Free plan includes 1 CV and PDF export.
              </p>
              <SignupForm />
              <p className="mt-6 text-center text-sm text-slate-400">
                Sudah punya akun?{" "}
                <Link href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">
                  Log in
                </Link>
              </p>
            </div>

            <p className="mt-4 text-center text-[11px] text-slate-600">
              Dengan daftar, kamu setuju{" "}
              <Link href="/terms" className="underline hover:text-slate-400">Terms</Link>
              {" "}&{" "}
              <Link href="/privacy" className="underline hover:text-slate-400">Privacy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
