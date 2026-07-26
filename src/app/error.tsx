"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

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
    <div className="flex min-h-screen flex-col items-center justify-center mesh-gradient-bg p-4 text-center">
      <div className="glass-panel max-w-md rounded-3xl border border-red-500/20 p-8 sm:p-10 shadow-2xl backdrop-blur-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">Terjadi Kesalahan Sistem</h1>
        <p className="mt-2 text-xs text-slate-400 font-mono bg-slate-900/60 p-2.5 rounded-xl border border-white/5 truncate max-w-full">
          {error.message || "An unexpected error occurred."}
        </p>
        <div className="mt-6 flex justify-center">
          <Button onClick={() => reset()} size="md" variant="secondary">
            <RotateCcw className="h-4 w-4" />
            <span>Coba Lagi</span>
          </Button>
        </div>
      </div>
    </div>
  );
}