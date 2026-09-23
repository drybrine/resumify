"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Uncaught application error:", error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center px-4 py-20 sm:px-6">
      <div className="mx-auto w-full max-w-xl">
        <p className="micro text-accent">Terjadi kesalahan</p>
        <h1 className="mt-4 text-[32px] leading-tight text-ink">
          Halaman ini gagal dimuat.
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
          Perubahan yang sudah tersimpan tetap aman. Coba muat ulang halaman;
          kalau tetap gagal, buka dasbor lalu masuk ke CV-nya lagi.
        </p>

        {error.message && (
          <p className="num mt-6 rounded-print border border-rule bg-sheet px-3 py-2.5 text-[12px] leading-relaxed text-ink-3">
            {error.message}
            {error.digest ? ` · ${error.digest}` : ""}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button onClick={() => reset()}>Coba lagi</Button>
          <Link href="/dashboard">
            <Button variant="secondary">Ke dasbor</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
