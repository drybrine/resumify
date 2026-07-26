import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { HeroInteractiveDemo } from "@/components/hero-interactive-demo";
import {
  Check,
  FileText,
  Cloud,
  Share2,
  Palette,
  Download,
  Shield,
  Sparkles,
  ArrowRight,
  Zap,
  MousePointerClick,
  LayoutTemplate,
  FileDown,
  ChevronDown,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "ATS-friendly templates",
    desc: "Single-column layouts recruiters & parsers love — Jake, Harvard, Corporate, Tech, and more.",
    badge: "Pass ATS",
  },
  {
    icon: Palette,
    title: "Live split editor",
    desc: "Edit left, see right. Every keystroke updates the preview instantly — no refresh, no lag.",
    badge: "Realtime",
  },
  {
    icon: Download,
    title: "Print-ready PDF",
    desc: "Server-side Chromium export for crisp, consistent PDFs — not browser print hacks.",
    badge: "HD Export",
  },
  {
    icon: Share2,
    title: "Shareable link",
    desc: "One-click public URL for recruiters. Perfect for email applications (Pro).",
    badge: "Pro",
  },
  {
    icon: Cloud,
    title: "Cloud autosave",
    desc: "Drafts sync to the cloud every change. Switch devices without losing work.",
    badge: "Safe",
  },
  {
    icon: Shield,
    title: "Private by design",
    desc: "Row-level security on every CV. Your data stays yours — not sold, not scraped.",
    badge: "Secure",
  },
];

const steps = [
  {
    n: "01",
    icon: MousePointerClick,
    title: "Sign up free",
    desc: "Google or email. No credit card. Ready in under a minute.",
  },
  {
    n: "02",
    icon: LayoutTemplate,
    title: "Pick a template",
    desc: "12 professional layouts. Switch anytime without losing content.",
  },
  {
    n: "03",
    icon: FileDown,
    title: "Fill & export PDF",
    desc: "Live preview as you type. Download a recruiter-ready PDF.",
  },
];

const faqs = [
  {
    q: "Apakah CV-nya lolos ATS?",
    a: "Ya. Template Resumify pakai struktur single-column, heading jelas, dan teks selectable — format yang ATS & recruiter suka. Hindari layout multi-kolom berisiko parse error.",
  },
  {
    q: "Gratis sampai mana?",
    a: "Paket Free: 1 CV, template Jake + Minimal, export PDF, simpan cloud. Pro buka 50 CV, 12 template, dan link share publik.",
  },
  {
    q: "Bagaimana bayar Pro?",
    a: "QRIS dinamis (GoPay, OVO, DANA, m-banking, dll). Transfer nominal unik, konfirmasi cepat, Pro aktif 30 hari.",
  },
  {
    q: "Data saya aman?",
    a: "Autentikasi Supabase + Row Level Security. Hanya kamu yang akses CV-mu. Public share hanya jika kamu aktifkan sendiri.",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 overflow-hidden mesh-gradient-bg">
        {/* Hero */}
        <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur-md">
              <Shield className="h-3.5 w-3.5" />
              <span>ATS-optimized · Trusted by job seekers</span>
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-[4.25rem] leading-[1.08] text-white">
              CV profesional yang{" "}
              <span className="text-gradient-purple">lolos ATS</span>
              <br className="hidden sm:block" /> & siap dilamar hari ini
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
              Live preview, 12 template, autosave cloud, export PDF instan.
              Mulai gratis — upgrade Pro lewat QRIS kapan saja.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto px-8 h-12 shadow-indigo-500/30">
                  Buat CV gratis
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto px-8 h-12">
                  Lihat harga Pro
                </Button>
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
              {["Tanpa kartu kredit", "1 CV gratis", "Export PDF"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>

            <HeroInteractiveDemo />
          </div>
        </section>

        {/* Social proof strip — honest, no fake metrics */}
        <section className="border-y border-white/5 bg-slate-950/70 py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { k: "12+", v: "Template profesional" },
                { k: "ATS", v: "Layout parser-friendly" },
                { k: "PDF", v: "Export server-side" },
                { k: "QRIS", v: "Bayar Pro lokal" },
              ].map((s) => (
                <div key={s.v}>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{s.k}</p>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 sm:py-24 border-b border-white/5">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-3">Cara kerja</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Dari kosong ke PDF dalam 3 langkah
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {steps.map(({ n, icon: Icon, title, desc }) => (
                <div
                  key={n}
                  className="glass-card relative rounded-2xl p-6 sm:p-7 border border-white/10"
                >
                  <span className="text-[11px] font-mono font-bold text-indigo-400/80">{n}</span>
                  <div className="mt-3 mb-4 h-11 w-11 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href="/signup">
                <Button size="lg" className="px-8">
                  Mulai langkah 1
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 sm:py-28 bg-slate-950/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-3">Fitur</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Semua yang dibutuhkan job seeker modern
              </h2>
              <p className="mt-3 text-slate-400 text-base">
                Fokus ke hasil lamar kerja — bukan fitur yang bikin bingung.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, desc, badge }) => (
                <div
                  key={title}
                  className="glass-card rounded-2xl p-6 flex flex-col border border-white/8 group"
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-300 group-hover:scale-105 transition-transform">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold tracking-wider text-indigo-300/90 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase">
                      {badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{title}</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed flex-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust / ATS callout */}
        <section className="py-16 border-y border-white/5">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="glass-card rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8 sm:p-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  Dirancang lolos sistem ATS
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-400 leading-relaxed">
                  Banyak CV indah gagal di parsing otomatis. Resumify pakai hierarki heading jelas,
                  bullet bersih, dan font standar — supaya isimu terbaca manusia <em>dan</em> mesin.
                </p>
              </div>
              <Link href="/signup" className="shrink-0 w-full sm:w-auto">
                <Button className="w-full sm:w-auto">Coba template ATS</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-3">FAQ</p>
              <h2 className="text-3xl font-extrabold text-white">Pertanyaan umum</h2>
            </div>
            <div className="space-y-3">
              {faqs.map(({ q, a }) => (
                <details
                  key={q}
                  className="group glass-card rounded-2xl border border-white/10 open:border-indigo-500/30 open:bg-indigo-500/5 transition-colors"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left text-sm sm:text-base font-semibold text-white marker:content-none">
                    {q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-180 group-open:text-indigo-400" />
                  </summary>
                  <p className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                    {a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="pb-20 sm:pb-28 px-4 sm:px-6">
          <div className="mx-auto max-w-4xl relative rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/70 to-slate-950 p-8 sm:p-14 text-center overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
            <h2 className="relative text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Siap kirim CV yang lebih meyakinkan?
            </h2>
            <p className="relative mt-3 text-slate-400 max-w-lg mx-auto text-sm sm:text-base">
              Buat akun gratis, pilih template, export PDF. Upgrade Pro hanya jika butuh lebih.
            </p>
            <div className="relative mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto px-8 shadow-indigo-500/40">
                  <Zap className="h-4 w-4" />
                  Buat CV sekarang
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-8">
                  Bandingkan paket
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-10 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Resumify · CV builder untuk job seeker Indonesia
          </p>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
