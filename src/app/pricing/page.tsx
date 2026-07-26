import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { PLANS, formatIdr, getProPricing } from "@/lib/plans";
import { Check } from "lucide-react";
import { CheckoutButton } from "./checkout-button";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Pricing" };

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

  return (
    <>
      <SiteHeader />
      <main className="mesh-gradient-bg flex-1 min-h-[calc(100vh-4rem)] py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 shadow-sm backdrop-blur-md mb-4">
              <span>Harga jelas · Bayar via QRIS</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white sm:text-5xl tracking-tight">
              Mulai gratis.{" "}
              <span className="text-gradient-purple">Upgrade saat butuh.</span>
            </h1>
            <p className="mt-4 text-slate-400 text-base sm:text-lg">
              Free untuk coba. Pro untuk 50 CV, 12 template, dan link share ke recruiter.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2 max-w-4xl mx-auto items-stretch">
            <PlanCard
              name={PLANS.free.name}
              price={formatIdr(PLANS.free.priceIdr)}
              period=""
              features={[...PLANS.free.features]}
              cta={
                user ? (
                  plan === "free" ? (
                    <Button variant="outline" className="w-full" disabled>
                      Plan Saat Ini
                    </Button>
                  ) : (
                    <Link href="/dashboard">
                      <Button variant="outline" className="w-full">
                        Ke Dashboard
                      </Button>
                    </Link>
                  )
                ) : (
                  <Link href="/signup">
                    <Button variant="outline" className="w-full">
                      Mulai gratis
                    </Button>
                  </Link>
                )
              }
            />
            <PlanCard
              name={PLANS.pro.name}
              price={formatIdr(proPricing.priceIdr)}
              period={`/${proPricing.periodDays} hari`}
              features={[...PLANS.pro.features]}
              highlight
              cta={
                user ? (
                  plan === "pro" || plan === "admin" ? (
                    <div className="space-y-2 text-center">
                      <Button variant="secondary" className="w-full" disabled>
                        Pro Aktif
                      </Button>
                      {planExpires && (
                        <p className="text-xs text-slate-400">
                          Berlaku s/d{" "}
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
                  )
                ) : (
                  <Link href="/signup">
                    <Button className="w-full shadow-indigo-500/30">Daftar & Bayar QRIS</Button>
                  </Link>
                )
              }
            />
          </div>

          <div className="mx-auto mt-12 max-w-xl space-y-2 text-center text-xs text-slate-500">
            <p>
              Bayar Pro lewat QRIS dinamis (GoPay, OVO, DANA, m-banking). Transfer nominal unik → konfirmasi → Pro 30 hari.
            </p>
            <p className="text-slate-600">
              Bisa batalkan kapan saja di akhir periode. Tidak ada auto-renew tersembunyi.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

function PlanCard({
  name,
  price,
  period,
  features,
  cta,
  highlight,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`glass-card rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden ${
        highlight
          ? "border-indigo-500/50 bg-gradient-to-b from-indigo-950/40 to-slate-950/80 shadow-2xl shadow-indigo-500/10"
          : ""
      }`}
    >
      {highlight && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-extrabold uppercase px-4 py-1.5 rounded-bl-xl tracking-wider">
          RECOMMENDED
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold text-white">{name}</h2>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-4xl font-extrabold text-white tracking-tight">{price}</span>
          {period && <span className="text-slate-400 font-medium text-sm">{period}</span>}
        </div>
        <ul className="mt-8 space-y-3.5">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
              <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-10">{cta}</div>
    </div>
  );
}
