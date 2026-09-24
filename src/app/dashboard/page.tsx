import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { listCvs, getProfile, createCv } from "@/lib/actions/cvs";
import { PLAN_LIMITS } from "@/lib/cv-data";
import { Button } from "@/components/ui/button";
import { CvList } from "./cv-list";
import type { Plan } from "@/lib/types";

export const metadata = { title: "Dasbor" };

export default async function DashboardPage() {
  const [cvs, profile] = await Promise.all([listCvs(), getProfile()]);
  const plan = (profile?.is_admin ? "admin" : profile?.plan || "free") as Plan;
  const limits = PLAN_LIMITS[plan];
  const atLimit = cvs.length >= limits.maxCvs;
  const remaining = Math.max(0, limits.maxCvs - cvs.length);

  return (
    <>
      <SiteHeader />

      <main id="main" className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-col gap-6 border-b border-rule pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="micro">Dasbor</p>
              <h1 className="mt-3 text-[32px] leading-tight text-ink sm:text-[38px]">
                CV kamu
              </h1>
              <p className="num mt-3 text-[13px] text-ink-2">
                Paket {plan} · {cvs.length} dari {limits.maxCvs} slot terpakai
                {plan !== "admin" && remaining > 0 && ` · sisa ${remaining}`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {plan === "free" && (
                <Link
                  href="/pricing"
                  className="text-[13px] text-ink-2 transition-colors hover:text-accent"
                >
                  Lihat paket Pro
                </Link>
              )}
              {profile?.is_admin && (
                <Link
                  href="/admin"
                  className="text-[13px] text-ink-2 transition-colors hover:text-accent"
                >
                  Admin
                </Link>
              )}
              <form
                action={async () => {
                  "use server";
                  await createCv({ title: "CV tanpa judul" });
                }}
              >
                <Button type="submit" disabled={atLimit}>
                  Buat CV baru
                </Button>
              </form>
            </div>
          </div>

          {atLimit && plan !== "admin" && (
            <div className="mt-8 border-l-2 border-accent bg-sheet px-5 py-4">
              <p className="text-[14px] text-ink">
                Slot paket {plan} sudah penuh ({limits.maxCvs} CV).
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
                Pro menambah sampai 50 CV, membuka 18 template Pro, dan mengaktifkan
                link share publik. Sekali bayar Rp 49.000 lewat QRIS untuk 30
                hari.{" "}
                <Link href="/pricing" className="link-rule text-ink">
                  Lihat paket Pro
                </Link>
              </p>
            </div>
          )}

          <section className="mt-10">
            {cvs.length === 0 ? (
              <div className="max-w-2xl">
                <p className="micro">Belum ada apa-apa di sini</p>
                <h2 className="mt-4 text-[26px] leading-tight text-ink">
                  Mulai dari CV kosong, bukan dari contoh orang lain.
                </h2>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
                  Editor dibuka dengan form kosong supaya kamu tidak perlu
                  menghapus isi bawaan. Data terisi sambil kamu melihat hasilnya
                  di kertas sebelah kanan.
                </p>

                <ol className="mt-8 border-t border-rule">
                  {[
                    "Isi identitas, lalu tambahkan pengalaman dan pendidikan.",
                    "Pilih satu dari 20 template — isi CV tidak ikut berubah.",
                    "Unduh PDF-nya, atau aktifkan link publik kalau sudah Pro.",
                  ].map((step, i) => (
                    <li
                      key={step}
                      className="grid grid-cols-[32px_1fr] gap-3 border-b border-rule py-4 text-[14px] leading-relaxed text-ink-2"
                    >
                      <span className="micro num pt-1">{`0${i + 1}`}</span>
                      {step}
                    </li>
                  ))}
                </ol>

                <form
                  className="mt-8"
                  action={async () => {
                    "use server";
                    await createCv({ title: "CV tanpa judul" });
                  }}
                >
                  <Button type="submit" size="lg">
                    Buat CV pertama
                  </Button>
                </form>
              </div>
            ) : (
              <CvList cvs={cvs} now={new Date().toISOString()} />
            )}
          </section>
        </div>
      </main>
    </>
  );
}
