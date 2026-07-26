import { Loader2 } from "lucide-react";

export default function EditorLoading() {
  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100 overflow-hidden">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-slate-950 px-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-800 animate-pulse"></div>
          <div className="h-5 w-40 rounded bg-slate-800 animate-pulse"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 rounded-lg bg-slate-800 animate-pulse"></div>
          <div className="h-8 w-28 rounded-lg bg-slate-800 animate-pulse"></div>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center mesh-gradient-bg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-xs font-mono text-slate-400">Loading CV Editor workspace...</p>
        </div>
      </div>
    </div>
  );
}