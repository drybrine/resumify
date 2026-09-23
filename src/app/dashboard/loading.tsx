import { SiteHeader } from "@/components/site-header";

export default function DashboardLoading() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl animate-pulse px-4 py-10 sm:px-6 sm:py-14">
          <div className="h-3 w-16 bg-rule" />
          <div className="mt-4 h-8 w-52 bg-rule" />

          <div className="mt-10 border-t border-rule-strong pt-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="border-b border-rule py-5">
                <div className="h-5 w-64 bg-rule" />
                <div className="mt-3 h-3 w-44 bg-rule/70" />
              </div>
            ))}
          </div>

          <p className="mt-6 text-[12px] text-ink-3">Memuat daftar CV…</p>
        </div>
      </main>
    </>
  );
}
