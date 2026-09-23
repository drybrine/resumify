import Link from "next/link";
import { Logo } from "@/components/logo";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Daftar" };

const PERKS = [
  "1 CV gratis, dengan ekspor PDF",
  "Template Jake & Minimal langsung tersedia",
  "Tersimpan di cloud — bisa dilanjutkan dari perangkat lain",
];

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-rule">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Resumify — beranda">
            <Logo markSize={22} subtitle="" />
          </Link>
          <Link
            href="/login"
            className="text-[13px] text-ink-2 transition-colors hover:text-ink"
          >
            Sudah punya akun? Masuk
          </Link>
        </div>
      </header>

      <main id="main" className="flex-1 px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto grid w-full max-w-5xl gap-12 lg:grid-cols-[1fr_420px] lg:gap-16">
          <div className="hidden lg:block">
            <p className="micro">Pendaftaran</p>
            <h1 className="mt-4 max-w-md text-[38px] leading-[1.08] text-ink">
              Satu akun, lalu langsung mulai mengisi.
            </h1>
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-ink-2">
              Tidak ada pertanyaan panjang sebelum masuk editor. Buat CV kosong,
              pilih template, dan lihat hasilnya sambil mengetik.
            </p>

            <ul className="mt-10 max-w-md border-t border-rule">
              {PERKS.map((perk) => (
                <li
                  key={perk}
                  className="border-b border-rule py-3.5 text-[14px] text-ink"
                >
                  {perk}
                </li>
              ))}
            </ul>

            <p className="mt-8 max-w-md text-[12px] leading-relaxed text-ink-3">
              Tombol di bawah hanya membuat akun paket gratis. Pro (Rp 49.000 per
              30 hari) dibayar belakangan lewat QRIS, dan hanya kalau kamu butuh
              lebih dari 1 CV.
            </p>
          </div>

          <div>
            <div className="lg:hidden">
              <p className="micro">Pendaftaran</p>
              <h1 className="mt-4 text-[30px] leading-tight text-ink">Buat akun gratis</h1>
              <p className="mt-3 text-[14px] text-ink-2">
                1 CV + ekspor PDF, tanpa kartu kredit.
              </p>
            </div>

            <div className="mt-8 rounded-print border border-rule bg-sheet p-6 sm:p-7 lg:mt-0">
              <h2 className="font-display text-[20px] text-ink">
                Daftar Resumify
              </h2>
              <p className="mt-1.5 text-[13px] text-ink-2">
                Pakai Google atau email — keduanya sama saja.
              </p>
              <div className="mt-6">
                <SignupForm />
              </div>
            </div>

            <p className="mt-5 text-[12px] leading-relaxed text-ink-3">
              Dengan mendaftar, kamu menyetujui{" "}
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
        </div>
      </main>
    </div>
  );
}
