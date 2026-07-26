import { SiteHeader } from "@/components/site-header";

export default function DashboardLoading() {
  return (
    <>
      <SiteHeader />
      <main className="mesh-gradient-bg min-h-[calc(100vh-4rem)] flex-1 px-4 py-10 sm:px-6">
        <div className="mx-auto w-full max-w-6xl space-y-8 animate-pulse">
          {/* Header Card Skeleton */}
          <div className="glass-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-3xl border border-white/10 p-6 sm:p-8">
            <div className="space-y-3 flex-1">
              <div className="h-8 w-60 rounded-xl bg-slate-800"></div>
              <div className="h-4 w-80 rounded-lg bg-slate-800/60"></div>
            </div>
            <div className="h-10 w-36 rounded-xl bg-slate-800"></div>
          </div>

          {/* Grid Cards Skeleton */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass-card flex h-48 flex-col justify-between rounded-2xl border border-white/10 p-6"
              >
                <div className="space-y-3">
                  <div className="h-6 w-3/4 rounded-lg bg-slate-800"></div>
                  <div className="h-4 w-1/2 rounded-md bg-slate-800/60"></div>
                </div>
                <div className="flex gap-2 pt-4 border-t border-white/5">
                  <div className="h-9 flex-1 rounded-xl bg-slate-800"></div>
                  <div className="h-9 w-10 rounded-xl bg-slate-800"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}