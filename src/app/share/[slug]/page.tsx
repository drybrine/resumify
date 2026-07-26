import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicCv } from "@/lib/actions/cvs";
import { renderResumeHtml } from "@/lib/templates/render";
import type { CvData, TemplateId } from "@/lib/types";
import { Button } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cv = await getPublicCv(slug);
  return {
    title: cv?.title || "Shared Resume",
    description: "Shared resume from Resumify",
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
    <div className="min-h-screen bg-slate-200">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-300 bg-white/90 px-4 py-3 backdrop-blur">
        <div>
          <p className="text-sm font-medium text-slate-900">{cv.title}</p>
          <p className="text-xs text-slate-500">Shared via Resumify</p>
        </div>
        <Link href="/">
          <Button size="sm" variant="outline">
            Make your own
          </Button>
        </Link>
      </header>
      <div className="flex justify-center p-6">
        <article
          className={`resume-preview template-${cv.template}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
