import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";

/** Shared shell for the legal pages: one readable column, hairline sections. */
export function LegalPage({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />

      <main id="main" className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <p className="micro enter">{eyebrow}</p>
          <h1
            className="enter mt-4 text-[34px] leading-tight text-ink"
            style={{ "--d": "70ms" } as React.CSSProperties}
          >
            {title}
          </h1>
          <p
            className="enter num mt-3 border-b border-rule pb-6 text-[13px] text-ink-3"
            style={{ "--d": "130ms" } as React.CSSProperties}
          >
            Terakhir diperbarui {updated}
          </p>

          <Reveal className="mt-10 space-y-10 [&_h2]:font-display [&_h2]:text-[22px] [&_h2]:text-ink [&_p]:mt-3 [&_p]:text-[14px] [&_p]:leading-relaxed [&_p]:text-ink-2 [&_ul]:mt-3 [&_ul]:space-y-2 [&_li]:text-[14px] [&_li]:leading-relaxed [&_li]:text-ink-2 [&_strong]:font-medium [&_strong]:text-ink">
            {children}
          </Reveal>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
