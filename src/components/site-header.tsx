import Link from "next/link";
import { AuthMenu } from "@/components/auth-menu";
import { Logo } from "@/components/logo";

const NAV = [
  { href: "/#template", label: "Template" },
  { href: "/#ats", label: "Soal ATS" },
  { href: "/#faq", label: "FAQ" },
  { href: "/pricing", label: "Harga" },
];

export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-50 border-b border-rule bg-paper/95 backdrop-blur-[2px]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Resumify — beranda">
          <Logo markSize={22} subtitle="" />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <div className="mr-2 hidden items-center gap-5 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link relative text-[13px] text-ink-2 transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <Link
            href="/pricing"
            className="px-2 text-[13px] text-ink-2 transition-colors hover:text-ink md:hidden"
          >
            Harga
          </Link>

          <AuthMenu />
        </nav>
      </div>
    </header>
  );
}
