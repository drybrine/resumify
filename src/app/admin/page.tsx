import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { formatIdr, getProPricing } from "@/lib/plans";
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
      <main className="mx-auto max-w-6xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-semibold text-white">Admin</h1>
        <p className="mt-1 text-sm text-slate-400">
          User, plan, konfirmasi QRIS.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Users" value={String(users.length)} />
          <Stat label="Pro" value={String(proCount)} />
          <Stat label="Total CVs" value={String(cvCount || 0)} />
          <Stat label="QRIS pending" value={String(pendingPays.length)} />
        </div>

        <h2 className="mt-10 text-lg font-semibold text-white">Harga Plan</h2>
        <p className="mt-1 text-sm text-slate-400">
          Atur harga &amp; durasi paket Pro. Tampil di /pricing &amp; invoice
          QRIS.
        </p>
        <PlanSettingsForm
          priceIdr={proPricing.priceIdr}
          periodDays={proPricing.periodDays}
        />

        <h2 className="mt-10 text-lg font-semibold text-white">
          Pembayaran QRIS
        </h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Nominal</th>
                <th className="px-4 py-3 font-medium">Ref</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Waktu</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Belum ada pembayaran
                  </td>
                </tr>
              )}
              {payments.map((p) => {
                const u = Array.isArray(p.user) ? p.user[0] : p.user;
                return (
                  <tr
                    key={p.id}
                    className="border-b border-slate-800/80 hover:bg-slate-900/40"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-100">
                        {(u as { full_name?: string } | null)?.full_name || "—"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {(u as { email?: string } | null)?.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-indigo-300">
                      {formatIdr(p.amount_idr)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {p.reference}
                    </td>
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3 text-slate-400">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="px-4 py-3">
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

        <h2 className="mt-10 text-lg font-semibold text-white">Users</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-slate-800/80 hover:bg-slate-900/40"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-100">
                      {u.full_name || "—"}
                      {u.is_admin && (
                        <Badge tone="pro" className="ml-2">
                          admin
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={u.plan === "pro" ? "pro" : "default"}>
                      {u.plan}
                    </Badge>
                    {u.plan_expires_at && (
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        s/d {formatDate(u.plan_expires_at)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {!u.is_admin && (
                      <div className="flex gap-1">
                        <form
                          action={async () => {
                            "use server";
                            await setUserPlan(u.id, "pro");
                          }}
                        >
                          <Button type="submit" size="sm" variant="secondary">
                            Pro
                          </Button>
                        </form>
                        <form
                          action={async () => {
                            "use server";
                            await setUserPlan(u.id, "free");
                          }}
                        >
                          <Button type="submit" size="sm" variant="ghost">
                            Free
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
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
