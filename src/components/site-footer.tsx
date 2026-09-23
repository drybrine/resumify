import Link from "next/link";
import { Logo } from "@/components/logo";
import { Reveal } from "@/components/reveal";

const COLUMNS = [
  {
    title: "Produk",
    links: [
      { href: "/#template", label: "12 template" },
      { href: "/#cara-kerja", label: "Cara kerja" },
      { href: "/#faq", label: "Tanya jawab" },
      { href: "/pricing", label: "Harga & QRIS" },
    ],
  },
  {
    title: "Akun",
    links: [
      { href: "/signup", label: "Daftar gratis" },
      { href: "/login", label: "Masuk" },
      { href: "/dashboard", label: "Dasbor" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Kebijakan privasi" },
      { href: "/terms", label: "Syarat penggunaan" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-rule bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <Reveal>
            <Logo markSize={24} />
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-ink-2">
              Editor CV dengan pratinjau langsung. Isi data, pilih template ATS,
              unduh PDF — tanpa langganan otomatis.
            </p>
          </Reveal>

          {COLUMNS.map((col, i) => (
            <Reveal key={col.title} as="nav" aria-label={col.title} delay={90 + i * 70}>
              <h2 className="micro">{col.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-ink-2 transition-colors hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-rule pt-5 text-[12px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Resumify — dibuat untuk pelamar kerja di
            Indonesia.
          </p>
          <p className="num">Pembayaran Pro: QRIS (GoPay · OVO · DANA · m-banking)</p>
        </div>
      </div>
    </footer>
  );
}
