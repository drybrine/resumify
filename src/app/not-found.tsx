import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader />

      <main id="main" className="flex flex-1 items-center px-4 py-20 sm:px-6">
        <div className="mx-auto w-full max-w-xl">
          <p className="micro num">404</p>
          <h1 className="mt-4 text-[34px] leading-tight text-ink">
            Halaman ini tidak ada.
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
            Alamatnya mungkin salah ketik, atau CV yang kamu cari sudah dihapus
            pemiliknya sehingga link publiknya dimatikan.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/dashboard">
              <Button>Buka dasbor</Button>
            </Link>
            <Link href="/">
              <Button variant="secondary">Ke beranda</Button>
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
