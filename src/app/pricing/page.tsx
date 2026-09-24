import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { PLANS, formatIdr } from "@/lib/plans";
import { getProPricing } from "@/lib/plan-pricing";
import { Reveal } from "@/components/reveal";
import { CheckoutButton } from "./checkout-button";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Harga" };

const ROWS: { label: string; free: string; pro: string }[] = [
  { label: "Jumlah CV", free: "1", pro: "50" },
  { label: "Template", free: "Jake, Minimal", pro: "20 template (18 Pro)" },
  { label: "Ekspor PDF", free: "Termasuk", pro: "Termasuk" },
  { label: "Simpan otomatis ke cloud", free: "Termasuk", pro: "Termasuk" },
  { label: "Link share publik", free: "Tidak ada", pro: "Termasuk" },
  { label: "Dukungan", free: "Email biasa", pro: "Diprioritaskan" },
];

const QRIS_STEPS = [
  "Klik Bayar dengan QRIS — sistem membuat nominal unik (harga + kode 3 digit) supaya transfermu mudah dicocokkan.",
  "Scan QR dari GoPay, OVO, DANA, ShopeePay, atau m-banking, lalu transfer nominal persis seperti yang tertulis.",
  "Status dicek otomatis. Setelah dana masuk, Pro aktif 30 hari — kalau mutasi belum terhubung, admin mengonfirmasi manual.",
];

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const proPricing = await getProPricing();

  let plan = "free";
  let planExpires: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("plan, is_admin, plan_expires_at")
      .eq("id", user.id)
      .single();
    plan = data?.is_admin ? "admin" : data?.plan || "free";
    planExpires = data?.plan_expires_at || null;
  }

  const isPro = plan === "pro" || plan === "admin";

  const freeCta = user ? (
    plan === "free" ? (
      <p className="micro">Paket kamu sekarang</p>
    ) : (
      <Link href="/dashboard">
        <Button variant="secondary" size="sm">
          Buka dasbor
        </Button>
      </Link>
    )
  ) : (
    <Link href="/signup">
      <Button variant="secondary" size="sm">
        Mulai gratis
      </Button>
    </Link>
  );

  const proCta = !user ? (
    <Link href="/signup">
      <Button size="sm">Daftar &amp; bayar QRIS</Button>
    </Link>
  ) : isPro ? (
    <div>
      <p className="micro text-accent">Pro aktif</p>
      {planExpires && (
        <p className="num mt-1 text-[12px] text-ink-2">
          berlaku sampai{" "}
          {new Date(planExpires).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}
    </div>
  ) : (
    <CheckoutButton />
  );

  return (
    <>
      <SiteHeader />

      <main id="main" className="flex-1">
        <section className="border-b border-rule">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:py-18">
            <p className="micro enter">Harga</p>
            <h1
              className="enter mt-4 max-w-2xl text-[34px] leading-[1.08] text-ink sm:text-[44px]"
              style={{ "--d": "70ms" } as React.CSSProperties}
            >
              Gratis untuk mencoba. Pro saat lamaranmu menumpuk.
            </h1>
            <p
              className="enter mt-5 max-w-xl text-[15px] leading-relaxed text-ink-2"
              style={{ "--d": "150ms" } as React.CSSProperties}
            >
              Tidak ada langganan otomatis. Pro dibeli per 30 hari, dan setelah
              masa itu habis paketmu kembali ke Free tanpa penagihan lanjutan.
            </p>
          </div>
        </section>

        {/* Comparison table — row parity so the differences are readable */}
        <section className="border-b border-rule bg-sheet">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
            <table className="hidden w-full border-collapse text-left md:table">
              <caption className="sr-only">
                Perbandingan paket Free dan Pro
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="w-[40%] border-b border-rule-strong pb-4">
                    <span className="micro">Paket</span>
                  </th>
                  <th scope="col" className="border-b border-rule-strong px-5 pb-4">
                    <span className="micro">Free</span>
                    <span className="font-display mt-2 block text-[26px] text-ink">
                      {formatIdr(PLANS.free.priceIdr)}
                    </span>
                  </th>
                  <th
                    scope="col"
                    className="border-b-2 border-accent border-t-2 border-t-accent bg-accent-soft/45 px-5 pb-4"
                  >
                    <span className="micro text-accent">Pro · 30 hari</span>
                    <span className="font-display num mt-2 block text-[26px] text-ink">
                      {formatIdr(proPricing.priceIdr)}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, i) => (
                  <Reveal
                    key={row.label}
                    as="tr"
                    rise="6px"
                    delay={Math.min(i, 5) * 70}
                  >
                    <th
                      scope="row"
                      className="border-b border-rule py-4 text-[14px] font-normal text-ink"
                    >
                      {row.label}
                    </th>
                    <td className="border-b border-rule px-5 py-4 text-[14px] text-ink-2">
                      {row.free}
                    </td>
                    <td className="border-b border-rule bg-accent-soft/45 px-5 py-4 text-[14px] text-ink">
                      {row.pro}
                    </td>
                  </Reveal>
                ))}
                <tr>
                  <td className="py-6" />
                  <td className="px-5 py-6 align-top">{freeCta}</td>
                  <td className="border-b-2 border-b-accent bg-accent-soft/45 px-5 py-6 align-top">
                    {proCta}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Mobile: same rows, stacked */}
            <div className="space-y-10 md:hidden">
              <Reveal>
                <div className="flex items-baseline justify-between border-b border-rule-strong pb-3">
                  <span className="micro">Free</span>
                  <span className="font-display text-[26px] text-ink">
                    {formatIdr(PLANS.free.priceIdr)}
                  </span>
                </div>
                <dl>
                  {ROWS.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-4 border-b border-rule py-3"
                    >
                      <dt className="text-[14px] text-ink-2">{row.label}</dt>
                      <dd className="text-[14px] text-ink">{row.free}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-5">{freeCta}</div>
              </Reveal>

              <Reveal delay={90} className="border-t-2 border-accent pt-4">
                <div className="flex items-baseline justify-between border-b border-rule-strong pb-3">
                  <span className="micro text-accent">Pro · 30 hari</span>
                  <span className="font-display num text-[26px] text-ink">
                    {formatIdr(proPricing.priceIdr)}
                  </span>
                </div>
                <dl>
                  {ROWS.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-4 border-b border-rule py-3"
                    >
                      <dt className="text-[14px] text-ink-2">{row.label}</dt>
                      <dd className="text-[14px] text-ink">{row.pro}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-5">{proCta}</div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* QRIS explainer */}
        <section className="border-b border-rule">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.6fr] lg:gap-16">
              <Reveal>
                <p className="micro">Pembayaran</p>
                <h2 className="mt-4 text-[28px] leading-tight text-ink">
                  Bayarnya lewat QRIS.
                </h2>
              </Reveal>

              <ol className="border-t border-rule">
                {QRIS_STEPS.map((step, i) => (
                  <Reveal
                    key={step}
                    as="li"
                    rise="8px"
                    delay={i * 110}
                    className="grid grid-cols-[40px_1fr] gap-4 border-b border-rule py-5"
                  >
                    <span className="micro num pt-1">{`0${i + 1}`}</span>
                    <p className="text-[14px] leading-relaxed text-ink-2">{step}</p>
                  </Reveal>
                ))}
              </ol>
            </div>

            <p className="mt-10 max-w-2xl text-[12px] leading-relaxed text-ink-3">
              Catatan: tanpa integrasi mutasi rekening, konfirmasi pembayaran
              bisa dilakukan manual oleh admin. Simpan bukti transfer sampai
              status berubah menjadi Pro.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
