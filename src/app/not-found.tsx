import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center mesh-gradient-bg p-4 text-center">
      <div className="glass-panel max-w-md rounded-3xl border border-white/10 p-8 sm:p-10 shadow-2xl backdrop-blur-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <FileQuestion className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">Halaman Tidak Ditemukan</h1>
        <p className="mt-2 text-sm text-slate-400">
          Maaf, halaman atau CV yang Anda cari tidak ada atau telah dihapus.
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="shadow-indigo-500/30">
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}