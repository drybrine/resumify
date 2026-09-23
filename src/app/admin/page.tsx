import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { formatIdr } from "@/lib/plans";
import { getProPricing } from "@/lib/plan-pricing";
import { setUserPlan, confirmPaymentAction } from "@/lib/actions/admin";
import { listPendingPayments } from "@/lib/actions/payments";
import { Button } from "@/components/ui/button";
import { PlanSettingsForm } from "./plan-settings-form";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!me?.is_admin) redirect("/dashboard");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, plan, is_admin, created_at, plan_expires_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const { count: cvCount } = await supabase
    .from("cvs")
    .select("*", { count: "exact", head: true });

  const [payments, proPricing] = await Promise.all([
    listPendingPayments(),
    getProPricing(),
  ]);

  const users = profiles || [];
  const proCount = users.filter((u) => u.plan === "pro").length;
  const pendingPays = payments.filter((p) => p.status === "pending");

  return (
    <>
      <SiteHeader />

      <main id="main" className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="micro">Admin</p>
          <h1 className="mt-3 text-[32px] leading-tight text-ink">Operasional</h1>
          <p className="mt-2 text-[14px] text-ink-2">
            Pengguna, harga paket, dan konfirmasi pembayaran QRIS.
          </p>

          {/* Monitor strip — the numbers actually drive what you do next */}
          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-y border-rule py-6 lg:grid-cols-4">
            {[
              { label: "Pengguna", value: String(users.length), note: "100 terbaru" },
              { label: "Pro aktif", value: String(proCount), note: "dari daftar di atas" },
              { label: "Total CV", value: String(cvCount || 0), note: "seluruh akun" },
              {
                label: "QRIS menunggu",
                value: String(pendingPays.length),
                note: "perlu konfirmasi",
              },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="micro">{stat.label}</dt>
                <dd className="font-display num mt-2 text-[30px] leading-none text-ink">
                  {stat.value}
                </dd>
                <p className="mt-1.5 text-[12px] text-ink-3">{stat.note}</p>
              </div>
            ))}
          </dl>

          <section className="mt-14">
            <h2 className="font-display text-[24px] text-ink">Harga paket Pro</h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-2">
              Nilai ini dipakai di halaman harga dan saat membuat invoice QRIS
              baru. Invoice yang sudah terbit tetap memakai nominal lama.
            </p>
            <div className="mt-5">
              <PlanSettingsForm
                priceIdr={proPricing.priceIdr}
                periodDays={proPricing.periodDays}
              />
            </div>
          </section>

          <section className="mt-14">
            <div className="flex items-baseline justify-between gap-4 border-b border-rule-strong pb-2">
              <h2 className="font-display text-[24px] text-ink">Pembayaran QRIS</h2>
              <span className="micro num">{payments.length} baris</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr>
                    {["Pengguna", "Nominal", "Referensi", "Status", "Waktu", "Aksi"].map(
                      (h) => (
                        <th key={h} scope="col" className="border-b border-rule py-3 pr-4">
                          <span className="micro">{h}</span>
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="border-b border-rule py-8 text-[14px] text-ink-3"
                      >
                        Belum ada pembayaran tercatat.
                      </td>
                    </tr>
                  )}

                  {payments.map((p) => {
                    const u = Array.isArray(p.user) ? p.user[0] : p.user;
                    return (
                      <tr key={p.id} className="transition-colors hover:bg-sheet">
                        <td className="border-b border-rule py-3 pr-4">
                          <div className="text-[14px] text-ink">
                            {(u as { full_name?: string } | null)?.full_name || "—"}
                          </div>
                          <div className="text-[12px] text-ink-3">
                            {(u as { email?: string } | null)?.email}
                          </div>
                        </td>
                        <td className="num border-b border-rule py-3 pr-4 text-[14px] text-ink">
                          {formatIdr(p.amount_idr)}
                        </td>
                        <td className="num border-b border-rule py-3 pr-4 text-[12px] text-ink-3">
                          {p.reference}
                        </td>
                        <td className="border-b border-rule py-3 pr-4">
                          <Badge
                            tone={
                              p.status === "paid"
                                ? "ok"
                                : p.status === "pending"
                                  ? "warn"
                                  : "default"
                            }
                          >
                            {p.status}
                          </Badge>
                        </td>
                        <td className="num border-b border-rule py-3 pr-4 text-[13px] text-ink-2">
                          {formatDate(p.created_at)}
                        </td>
                        <td className="border-b border-rule py-3 pr-4">
                          {p.status === "pending" && (
                            <form
                              action={async () => {
                                "use server";
                                await confirmPaymentAction(p.id);
                              }}
                            >
                              <Button type="submit" size="sm">
                                Konfirmasi
                              </Button>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-14">
            <div className="flex items-baseline justify-between gap-4 border-b border-rule-strong pb-2">
              <h2 className="font-display text-[24px] text-ink">Pengguna</h2>
              <span className="micro num">{users.length} akun terakhir</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left">
                <thead>
                  <tr>
                    {["Akun", "Paket", "Terdaftar", "Ubah paket"].map((h) => (
                      <th key={h} scope="col" className="border-b border-rule py-3 pr-4">
                        <span className="micro">{h}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="transition-colors hover:bg-sheet">
                      <td className="border-b border-rule py-3 pr-4">
                        <div className="flex items-center gap-2 text-[14px] text-ink">
                          {u.full_name || "—"}
                          {u.is_admin && <Badge tone="pro">admin</Badge>}
                        </div>
                        <div className="text-[12px] text-ink-3">{u.email}</div>
                      </td>
                      <td className="border-b border-rule py-3 pr-4">
                        <Badge tone={u.plan === "pro" ? "pro" : "default"}>
                          {u.plan}
                        </Badge>
                        {u.plan_expires_at && (
                          <div className="num mt-1 text-[11px] text-ink-3">
                            sampai {formatDate(u.plan_expires_at)}
                          </div>
                        )}
                      </td>
                      <td className="num border-b border-rule py-3 pr-4 text-[13px] text-ink-2">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="border-b border-rule py-3 pr-4">
                        {!u.is_admin && (
                          <div className="flex gap-2">
                            <form
                              action={async () => {
                                "use server";
                                await setUserPlan(u.id, "pro");
                              }}
                            >
                              <Button type="submit" size="sm" variant="secondary">
                                Jadikan Pro
                              </Button>
                            </form>
                            <form
                              action={async () => {
                                "use server";
                                await setUserPlan(u.id, "free");
                              }}
                            >
                              <Button type="submit" size="sm" variant="ghost">
                                Turunkan
                              </Button>
                            </form>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
