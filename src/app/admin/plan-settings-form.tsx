"use client";

import { useActionState } from "react";
import {
  updatePlanSettings,
  type PlanSettingsState,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatIdr } from "@/lib/plans";

export function PlanSettingsForm({
  priceIdr,
  periodDays,
}: {
  priceIdr: number;
  periodDays: number;
}) {
  const [state, action, pending] = useActionState<PlanSettingsState, FormData>(
    updatePlanSettings,
    null
  );

  return (
    <form
      action={action}
      className="rounded-print border border-rule bg-sheet p-5 sm:p-6"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="pro_price_idr">Harga Pro (IDR)</Label>
          <Input
            id="pro_price_idr"
            name="pro_price_idr"
            type="number"
            inputMode="numeric"
            min={1}
            max={10000000}
            step={1}
            defaultValue={priceIdr}
            required
          />
          <p className="num mt-2 text-[12px] text-ink-3">
            Sekarang {formatIdr(priceIdr)} · min Rp 1, maks Rp 10.000.000.
          </p>
        </div>

        <div>
          <Label htmlFor="pro_period_days">Masa aktif (hari)</Label>
          <Input
            id="pro_period_days"
            name="pro_period_days"
            type="number"
            inputMode="numeric"
            min={1}
            max={365}
            step={1}
            defaultValue={periodDays}
            required
          />
          <p className="mt-2 text-[12px] text-ink-3">
            Dihitung dari waktu pembayaran dikonfirmasi (1–365 hari).
          </p>
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="mt-4 text-[13px] text-danger">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="mt-4 text-[13px] text-ok">{state.success}</p>
      )}

      <div className="mt-5 flex flex-col-reverse gap-3 border-t border-rule pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-[12px] leading-relaxed text-ink-3">
          Perubahan berlaku untuk invoice berikutnya. Tagihan yang sudah terbit
          tetap memakai nominal saat dibuat.
        </p>
        <Button type="submit" size="sm" disabled={pending} className="sm:shrink-0">
          {pending ? "Menyimpan…" : "Simpan harga"}
        </Button>
      </div>
    </form>
  );
}
