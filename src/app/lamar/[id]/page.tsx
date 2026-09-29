import { notFound } from "next/navigation";
import Link from "next/link";
import { getCv, getProfile } from "@/lib/actions/cvs";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import type { Cv } from "@/lib/types";
import { ApplyWorkspace } from "./apply-workspace";

export const metadata = { title: "Lamar" };

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [cv, profile] = await Promise.all([getCv(id), getProfile()]);
  if (!cv) notFound();

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-rule-strong pb-5">
          <div className="min-w-0">
            <p className="micro">Melamar kerja</p>
            <h1 className="font-display mt-2 text-[26px] leading-tight text-ink sm:text-[32px]">
              {cv.title}
            </h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-2">
              Tempel iklan lowongannya, lihat kata kunci yang belum ada di CV-mu, lalu
              buat surat lamaran dari isi CV yang sudah kamu tulis.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link href={`/editor/${id}`}>
              <Button variant="secondary" size="sm">
                Buka editor CV
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dasbor
              </Button>
            </Link>
          </div>
        </div>

        <ApplyWorkspace
          cvId={id}
          cv={cv as Cv}
          isPro={profile?.plan === "pro" || Boolean(profile?.is_admin)}
        />
      </main>
    </>
  );
}
