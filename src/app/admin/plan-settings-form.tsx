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
      className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="pro_price_idr">Harga Pro (IDR)</Label>
          <Input
            id="pro_price_idr"
            name="pro_price_idr"
            type="number"
            inputMode="numeric"
            min={10000}
            max={10000000}
            step={1000}
            defaultValue={priceIdr}
            required
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Saat ini: {formatIdr(priceIdr)}. Range 10rb–10jt.
          </p>
        </div>
        <div>
          <Label htmlFor="pro_period_days">Durasi (hari)</Label>
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
          <p className="mt-1 text-[11px] text-slate-500">
            Masa aktif Pro setelah bayar (1–365 hari).
          </p>
        </div>
      </div>

      {state?.error && (
        <p className="mt-3 text-sm text-red-400">{state.error}</p>
      )}
      {state?.success && (
        <p className="mt-3 text-sm text-emerald-400">{state.success}</p>
      )}

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-slate-500">
          Harga baru berlaku invoice QRIS berikutnya. Pending lama tetap pakai
          nominal lama.
        </p>
        <Button type="submit" size="sm" disabled={pending} className="sm:shrink-0">
          {pending ? "Menyimpan…" : "Simpan harga"}
        </Button>
      </div>
    </form>
  );
}
