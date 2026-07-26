import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center mesh-gradient-bg p-4">
      <div className="glass-panel flex flex-col items-center gap-4 rounded-3xl border border-white/10 p-8 shadow-2xl backdrop-blur-xl">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        <p className="text-sm font-semibold text-slate-300">Loading Resumify...</p>
      </div>
    </div>
  );
}