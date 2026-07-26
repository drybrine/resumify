"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatIdr } from "@/lib/plans";
import { CheckCircle2, Copy, Loader2, QrCode, RefreshCw } from "lucide-react";

type PaymentInfo = {
  id: string;
  amount_idr: number;
  base_amount_idr: number;
  reference: string;
  status: string;
  expires_at: string;
  merchant_name?: string | null;
};

export function CheckoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const start = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/create", { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Gagal buat QRIS");
        return;
      }
      setPayment(data.payment);
      setQr(data.qrDataUrl);
    } catch {
      setError("Jaringan error");
    } finally {
      setLoading(false);
    }
  };

  const poll = useCallback(async () => {
    if (!payment?.id || payment.status === "paid") return;
    try {
      const res = await fetch(`/api/payments/status?id=${payment.id}`);
      const data = await res.json();
      if (data.payment) {
        setPayment((p) =>
          p ? { ...p, ...data.payment, merchant_name: p.merchant_name } : p
        );
        if (data.qrDataUrl) setQr(data.qrDataUrl);
        if (data.payment.status === "paid") {
          router.refresh();
        }
      }
    } catch {
      /* ignore poll errors */
    }
  }, [payment?.id, payment?.status, router]);

  useEffect(() => {
    if (!payment || payment.status !== "pending") return;
    const t = setInterval(poll, 5000);
    return () => clearInterval(t);
  }, [payment, poll]);

  async function copyAmount() {
    if (!payment) return;
    await navigator.clipboard.writeText(String(payment.amount_idr));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (payment?.status === "paid") {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
        <p className="mt-2 font-medium text-emerald-200">Pembayaran diterima!</p>
        <p className="mt-1 text-xs text-emerald-300/80">Plan Pro aktif 30 hari.</p>
        <Button
          className="mt-4 w-full"
          variant="secondary"
          onClick={() => router.push("/dashboard")}
        >
          Ke Dashboard
        </Button>
      </div>
    );
  }

  if (payment && qr) {
    const expired = new Date(payment.expires_at) < new Date();
    const uniqueFee = payment.amount_idr - payment.base_amount_idr;

    return (
      <div className="space-y-3 rounded-xl border border-indigo-500/30 bg-slate-950/60 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-indigo-200">
          <QrCode className="h-4 w-4" />
          Bayar via QRIS
        </div>

        {expired || payment.status === "expired" ? (
          <p className="text-sm text-amber-300">
            QRIS kedaluwarsa. Buat invoice baru.
          </p>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr}
              alt="QRIS Pro"
              className="mx-auto rounded-lg bg-white p-2"
              width={240}
              height={240}
            />
            <div className="text-center">
              <p className="text-xs text-slate-400">Transfer tepat</p>
              <p className="text-2xl font-bold tabular-nums text-white">
                {formatIdr(payment.amount_idr)}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Base {formatIdr(payment.base_amount_idr)} + kode unik{" "}
                {uniqueFee}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={copyAmount}
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied" : "Copy nominal"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={poll}
                title="Cek status"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Scan dengan e-wallet / m-banking (GoPay, Dana, OVO, ShopeePay,
              BCA, dll). Ref:{" "}
              <span className="font-mono text-slate-400">
                {payment.reference}
              </span>
              . Berlaku s/d{" "}
              {new Date(payment.expires_at).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              . Setelah transfer, admin konfirmasi (atau tunggu auto jika
              terhubung mutasi).
            </p>
            {payment.merchant_name && (
              <p className="text-center text-[11px] text-slate-500">
                Merchant: {payment.merchant_name}
              </p>
            )}
          </>
        )}

        {(expired || payment.status === "expired") && (
          <Button className="w-full" onClick={start} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Buat QRIS baru
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button className="w-full" onClick={start} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generate QRIS…
          </>
        ) : (
          <>
            <QrCode className="h-4 w-4" />
            Bayar dengan QRIS
          </>
        )}
      </Button>
      <p className="text-center text-[11px] text-slate-500">
        Indonesia · e-wallet & m-banking
      </p>
    </div>
  );
}
