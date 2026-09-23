"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistance } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { deleteCv } from "@/lib/actions/cvs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TEMPLATE_META } from "@/lib/templates/render";
import type { TemplateId } from "@/lib/types";

type CvRow = {
  id: string;
  title: string;
  template: string;
  share_slug: string | null;
  is_public: boolean;
  updated_at: string;
  created_at?: string;
};

export function CvList({ cvs, now }: { cvs: CvRow[]; now: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Server time is the hydration-safe baseline. A ticking client value is
  // layered on only after mount, so SSR and hydration always agree — using
  // Date.now() during render is what triggered the mismatch in the first place.
  const [tick, setTick] = useState<string | null>(null);
  useEffect(() => {
    const id = setInterval(() => setTick(new Date().toISOString()), 60_000);
    return () => clearInterval(id);
  }, []);
  const clock = tick ?? now;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cvs;
    return cvs.filter((cv) => cv.title.toLowerCase().includes(q));
  }, [cvs, query]);

  function remove(id: string) {
    startTransition(async () => {
      await deleteCv(id);
      setConfirming(null);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-rule-strong pb-2">
        <h2 className="micro">
          {cvs.length} CV{cvs.length > 1 ? "" : ""}
        </h2>

        {cvs.length > 3 && (
          <label className="flex items-center gap-2">
            <span className="sr-only">Cari CV berdasarkan judul</span>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari judul…"
              className="h-8 w-44 text-[13px]"
              type="search"
            />
          </label>
        )}
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-[14px] text-ink-2">
          Tidak ada CV dengan judul “{query}”.
        </p>
      )}

      <ul>
        {filtered.map((cv) => {
          const meta = TEMPLATE_META[cv.template as TemplateId] || TEMPLATE_META.jake;
          // Base date comes from the server (see `now` above) so the label is
          // byte-identical during SSR and hydration — reading Date.now() here
          // made the label depend on wall-clock time at render, which can differ
          // between the server render and hydration. `clock` only moves after mount.
          const updated = formatDistance(
            new Date(cv.updated_at),
            new Date(clock),
            { addSuffix: true, locale: idLocale }
          );

          return (
            <li
              key={cv.id}
              className="flex flex-col gap-3 border-b border-rule py-5 transition-colors hover:bg-sheet sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <div className="min-w-0">
                <Link
                  href={`/editor/${cv.id}`}
                  className="font-display block truncate text-[19px] text-ink hover:text-accent"
                >
                  {cv.title}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-3">
                  <span>{meta.name}</span>
                  <span aria-hidden>·</span>
                  <span className="num">diperbarui {updated}</span>
                  {cv.is_public && cv.share_slug && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="text-accent">link publik aktif</span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {cv.is_public && cv.share_slug && (
                  <Link
                    href={`/share/${cv.share_slug}`}
                    target="_blank"
                    className="text-[13px] text-ink-2 transition-colors hover:text-accent"
                  >
                    Lihat link
                  </Link>
                )}

                {confirming === cv.id ? (
                  <>
                    <span className="text-[13px] text-ink-2">Hapus permanen?</span>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => remove(cv.id)}
                      disabled={pending}
                    >
                      {pending ? "Menghapus…" : "Hapus"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirming(null)}
                    >
                      Batal
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href={`/editor/${cv.id}`}>
                      <Button size="sm" variant="secondary">
                        Buka editor
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirming(cv.id)}
                    >
                      Hapus
                    </Button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
