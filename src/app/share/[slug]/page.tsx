import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicCv } from "@/lib/server/public-share";
import { renderResumeHtml } from "@/lib/templates/render";
import type { CvData, TemplateId } from "@/lib/types";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cv = await getPublicCv(slug);
  return {
    title: cv?.title || "CV yang dibagikan",
    description: "CV yang dibagikan lewat Resumify",
    robots: { index: false, follow: false },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cv = await getPublicCv(slug);
  if (!cv) notFound();

  const html = renderResumeHtml(
    cv.data as CvData,
    (cv.template as TemplateId) || "jake"
  );

  return (
    <div className="flex min-h-screen flex-col bg-desk">
      <header className="border-b border-rule bg-paper">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" aria-label="Resumify — beranda">
              <Logo markSize={20} subtitle="" />
            </Link>
            <span aria-hidden className="hidden h-5 w-px bg-rule sm:block" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-[13px] text-ink">{cv.title}</p>
              <p className="micro text-[10px]">CV dibagikan lewat Resumify</p>
            </div>
          </div>

          <Link href="/signup">
            <Button size="sm" variant="secondary">
              Bikin CV sendiri
            </Button>
          </Link>
        </div>
      </header>

      <main id="main" className="flex flex-1 justify-center px-3 py-8 sm:px-6 sm:py-12">
        <div className="enter-sheet">
          <article
            className={`resume-preview template-${cv.template}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </main>

      <footer className="border-t border-rule bg-paper px-4 py-5 text-center text-[12px] text-ink-3">
        Dibagikan oleh pemilik CV. Halaman ini hanya menampilkan dokumen — tidak
        ada data lain yang bisa diakses dari tautan ini.
      </footer>
    </div>
  );
}
