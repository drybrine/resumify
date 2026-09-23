"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatIdr } from "@/lib/plans";
import { cn } from "@/lib/utils";

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
        setError(data.error || "Gagal membuat QRIS.");
        return;
      }
      setPayment(data.payment);
      setQr(data.qrDataUrl);
    } catch {
      setError("Jaringan bermasalah. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const poll = useCallback(async () => {
    if (!payment || payment.status === "paid") return;
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
      /* polling errors are not worth surfacing */
    }
  }, [payment, router]);

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
      <div className="bg-ink px-5 py-4 text-sheet">
        <p className="micro text-rule-strong">Pembayaran diterima</p>
        <p className="mt-2 text-[14px]">
          Pro aktif 30 hari. Semua template dan link share sudah terbuka.
        </p>
        <Button
          className="mt-4"
          variant="secondary"
          size="sm"
          onClick={() => router.push("/dashboard")}
        >
          Buka dasbor
        </Button>
      </div>
    );
  }

  if (payment && qr) {
    const expired = new Date(payment.expires_at) < new Date();
    const uniqueFee = payment.amount_idr - payment.base_amount_idr;
    const isExpired = expired || payment.status === "expired";

    return (
      <div className="rounded-print border border-rule-strong bg-sheet p-5">
        <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-3">
          <p className="micro text-accent">Bayar via QRIS</p>
          <p className="micro num text-[10px]">{payment.reference}</p>
        </div>

        {isExpired ? (
          <div className="pt-4">
            <p className="text-[13px] text-warn">
              QRIS ini sudah kedaluwarsa. Buat invoice baru untuk mencoba lagi.
            </p>
            <Button className="mt-4 w-full" onClick={start} disabled={loading}>
              {loading ? "Membuat…" : "Buat QRIS baru"}
            </Button>
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr}
              alt="Kode QRIS untuk pembayaran Pro"
              className="mx-auto mt-5 w-[220px] border border-rule bg-white p-2"
              width={220}
              height={220}
            />

            <div className="mt-5 text-center">
              <p className="micro">Transfer tepat sejumlah</p>
              <p className="font-display num mt-1.5 text-[28px] text-ink">
                {formatIdr(payment.amount_idr)}
              </p>
              <p className="num mt-1 text-[12px] text-ink-3">
                Harga {formatIdr(payment.base_amount_idr)}
                {uniqueFee > 0 ? ` + kode unik ${uniqueFee}` : ""}
              </p>
              <p className="num mt-1 text-[12px] text-ink-3">
                Berlaku sampai{" "}
                {new Date(payment.expires_at).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {payment.amount_idr < 10_000 && (
              <p className="mt-4 border-l-2 border-warn pl-3 text-[12px] leading-relaxed text-warn">
                Mode harga uji: sebagian e-wallet menolak nominal di bawah
                Rp 10.000.
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={copyAmount}
              >
                {copied ? "Nominal disalin" : "Salin nominal"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={poll}>
                Cek status
              </Button>
            </div>

            <p
              className={cn(
                "mt-4 text-[11px] leading-relaxed text-ink-3",
                "border-t border-rule pt-3"
              )}
            >
              Status diperiksa otomatis tiap 5 detik. Setelah transfer, halaman
              ini berubah sendiri begitu pembayaran tercatat — kalau belum juga
              berubah, admin bisa mengonfirmasi manual.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-3 text-[13px] text-danger">
          {error}
        </p>
      )}
      <Button className="w-full" onClick={start} disabled={loading}>
        {loading ? "Membuat QRIS…" : "Bayar dengan QRIS"}
      </Button>
      <p className="mt-2 text-[11px] text-ink-3">
        GoPay · OVO · DANA · ShopeePay · m-banking
      </p>
    </div>
  );
}
