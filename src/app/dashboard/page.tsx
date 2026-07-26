import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { listCvs, getProfile, createCv, deleteCv } from "@/lib/actions/cvs";
import { PLAN_LIMITS } from "@/lib/cv-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { TEMPLATE_META } from "@/lib/templates/render";
import type { Plan, TemplateId } from "@/lib/types";
import {
  FilePlus,
  Trash2,
  ExternalLink,
  Crown,
  Sparkles,
  Layers,
  ShieldCheck,
  Edit3,
  ArrowRight,
} from "lucide-react";

export const metadata = { title: "Dashboard — Resumify" };

export default async function DashboardPage() {
  const [cvs, profile] = await Promise.all([listCvs(), getProfile()]);
  const plan = (profile?.is_admin ? "admin" : profile?.plan || "free") as Plan;
  const limits = PLAN_LIMITS[plan];
  const atLimit = cvs.length >= limits.maxCvs;
  const usedPct = Math.min(100, Math.round((cvs.length / limits.maxCvs) * 100));

  return (
    <>
      <SiteHeader />
      <main className="mesh-gradient-bg flex-1 min-h-[calc(100vh-4rem)] py-8 sm:py-10 px-4 sm:px-6">
        <div className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="glass-card rounded-3xl p-5 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
            <div className="relative min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  CV kamu
                </h1>
                <Badge
                  tone={plan === "free" ? "default" : "pro"}
                  className="uppercase font-semibold tracking-wider"
                >
                  {plan}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                {cvs.length === 0
                  ? "Belum ada CV. Buat yang pertama — kosong, siap diisi."
                  : `${cvs.length} dari ${limits.maxCvs} slot terpakai.`}
              </p>
              {cvs.length > 0 && (
                <div className="mt-3 max-w-xs">
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="relative flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {plan === "free" && (
                <Link href="/pricing" className="flex-1 sm:flex-none">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                  >
                    <Crown className="h-4 w-4 text-amber-400" />
                    Upgrade Pro
                  </Button>
                </Link>
              )}
              {profile?.is_admin && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="text-purple-300">
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}
              <form
                className="flex-1 sm:flex-none"
                action={async () => {
                  "use server";
                  await createCv({ title: "Untitled CV" });
                }}
              >
                <Button type="submit" size="sm" disabled={atLimit} className="w-full shadow-indigo-500/20">
                  <FilePlus className="h-4 w-4" />
                  Buat CV baru
                </Button>
              </form>
            </div>
          </div>

          {atLimit && plan === "free" && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  Limit Free tercapai (1 CV). Pro: 50 CV + 12 template + share link.
                </span>
              </div>
              <Link
                href="/pricing"
                className="font-semibold text-amber-200 hover:text-white inline-flex items-center gap-1 shrink-0"
              >
                Lihat Pro <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {cvs.length === 0 ? (
            <div className="glass-card rounded-3xl border border-dashed border-white/15 p-10 sm:p-16 text-center flex flex-col items-center animate-fade-in">
              <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5">
                <Layers className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Mulai CV pertama</h3>
              <p className="mt-2 text-sm text-slate-400 max-w-md">
                Form kosong + live preview. Isi data, pilih template, export PDF — tanpa data contoh.
              </p>
              <ol className="mt-6 flex flex-col sm:flex-row gap-3 text-left text-xs text-slate-500 max-w-lg w-full">
                {["Isi identitas & pengalaman", "Pilih template ATS", "Download PDF"].map(
                  (step, i) => (
                    <li
                      key={step}
                      className="flex-1 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 flex items-center gap-2"
                    >
                      <span className="h-5 w-5 rounded-md bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-bold">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  )
                )}
              </ol>
              <form
                className="mt-8"
                action={async () => {
                  "use server";
                  await createCv({ title: "My Resume" });
                }}
              >
                <Button type="submit" size="lg" className="shadow-indigo-500/30 px-8">
                  <FilePlus className="h-4 w-4" />
                  Buat CV kosong
                </Button>
              </form>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
              {cvs.map((cv) => {
                const meta =
                  TEMPLATE_META[cv.template as TemplateId] || TEMPLATE_META.jake;
                return (
                  <div
                    key={cv.id}
                    className="glass-card rounded-2xl p-5 flex flex-col justify-between border border-white/10 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/editor/${cv.id}`}
                            className="block truncate text-base font-bold text-white hover:text-indigo-300 transition-colors"
                          >
                            {cv.title}
                          </Link>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="font-medium text-slate-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                              {meta.name}
                            </span>
                            <span>Updated {formatDate(cv.updated_at)}</span>
                          </div>
                        </div>
                        {cv.is_public && cv.share_slug && (
                          <Badge tone="ok" className="shrink-0">
                            Public
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-2">
                      <Link href={`/editor/${cv.id}`} className="flex-1">
                        <Button variant="secondary" size="sm" className="w-full">
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </Link>
                      {cv.is_public && cv.share_slug && (
                        <Link href={`/share/${cv.share_slug}`} target="_blank">
                          <Button variant="ghost" size="sm" className="px-2.5" title="Open share">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      <form
                        action={async () => {
                          "use server";
                          await deleteCv(cv.id);
                        }}
                      >
                        <Button
                          type="submit"
                          variant="danger"
                          size="sm"
                          className="px-2.5"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
