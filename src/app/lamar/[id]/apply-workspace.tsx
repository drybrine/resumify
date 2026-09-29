"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { normalizeCvData } from "@/lib/cv-data";
import { buildLetter, matchKeywords } from "@/lib/apply/letter";
import { normalizeApplicationKit } from "@/lib/apply/kit";
import { saveApplication } from "@/lib/actions/cvs";
import type { ApplicationKit, Cv } from "@/lib/types";
import { cn } from "@/lib/utils";

const SOURCES = ["LinkedIn", "Glints", "JobStreet", "Kalibrr", "Instagram", "Referensi teman"];

export function ApplyWorkspace({ cvId, cv }: { cvId: string; cv: Cv; isPro: boolean }) {
  const data = useMemo(() => normalizeCvData(cv.data), [cv.data]);
  const [kit, setKit] = useState<ApplicationKit>(() =>
    normalizeApplicationKit(data.apply),
  );
  const [status, setStatus] = useState("Belum disimpan");
  const [alert, setAlert] = useState(false);
  const [busy, setBusy] = useState<"save" | "pdf" | "docx" | null>(null);
  const [pending, startTransition] = useTransition();

  const match = useMemo(() => matchKeywords(kit.jobAd, data), [kit.jobAd, data]);

  const set = <K extends keyof ApplicationKit>(field: K, value: ApplicationKit[K]) =>
    setKit((k) => ({ ...k, [field]: value }));

  function onDraft() {
    set("letter", buildLetter(data, kit));
    setStatus("Draf dibuat — baca dan sesuaikan dulu");
    setAlert(false);
  }

  function onSave() {
    startTransition(async () => {
      setStatus("Menyimpan…");
      setAlert(false);
      const res = await saveApplication(cvId, kit);
      if (res?.error) {
        setStatus(res.error);
        setAlert(true);
        return;
      }
      setStatus("Tersimpan");
    });
  }

  async function onDownload(kind: "pdf" | "docx") {
    setBusy(kind);
    setAlert(false);
    try {
      // Save first: the file is rendered from the stored row, so an unsaved letter
      // would produce a download of the previous draft.
      const saved = await saveApplication(cvId, kit);
      if (saved?.error) {
        setStatus(saved.error);
        setAlert(true);
        return;
      }

      const res = await fetch(`/api/cvs/${cvId}/letter/${kind}`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setStatus(err?.error || `Gagal mengunduh (${res.status})`);
        setAlert(true);
        return;
      }

      const blob = await res.blob();
      if (!blob.size) {
        setStatus("File kosong — coba lagi");
        setAlert(true);
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cv.title} - Surat Lamaran.${kind}`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setStatus(kind === "pdf" ? "Surat terunduh (PDF)" : "Surat terunduh (Word)");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Gagal mengunduh");
      setAlert(true);
    } finally {
      setBusy(null);
    }
  }

  const hasLetter = kit.letter.trim().length > 0;

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* ---------------- kiri: data lamaran ---------------- */}
      <section className="min-w-0">
        <h2 className="font-display text-[19px] text-ink">Lowongan yang dituju</h2>
        <p className="mt-1 border-b border-rule-strong pb-2 text-[12px] text-ink-3">
          Dipakai untuk menyusun surat dan mengecek kata kunci. Tidak ada yang dikirim
          ke pihak lain.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Perusahaan</Label>
            <Input
              value={kit.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="PT Contoh Sejahtera"
            />
          </div>
          <div>
            <Label>Posisi</Label>
            <Input
              value={kit.role}
              onChange={(e) => set("role", e.target.value)}
              placeholder="Backend Engineer"
            />
          </div>
          <div>
            <Label>Dari mana tahu lowongannya</Label>
            <Input
              value={kit.source}
              onChange={(e) => set("source", e.target.value)}
              placeholder="LinkedIn"
              list="sumber-lowongan"
            />
            <datalist id="sumber-lowongan">
              {SOURCES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div>
            <Label>Bahasa surat</Label>
            <div className="flex gap-2">
              {(["id", "en"] as const).map((lang) => (
                <Button
                  key={lang}
                  type="button"
                  size="sm"
                  variant={kit.language === lang ? "primary" : "secondary"}
                  onClick={() => set("language", lang)}
                >
                  {lang === "id" ? "Indonesia" : "English"}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Label>Teks iklan lowongan (opsional)</Label>
          <Textarea
            rows={10}
            value={kit.jobAd}
            onChange={(e) => set("jobAd", e.target.value)}
            placeholder="Tempel seluruh isi iklan di sini — persyaratan, tanggung jawab, apa saja. Makin lengkap, makin akurat analisisnya."
          />
          <p className="mt-2 text-[11px] leading-relaxed text-ink-3">
            Dipakai hanya untuk mencocokkan kata kunci dengan isi CV-mu.
          </p>
        </div>

        {kit.jobAd.trim() && (
          <div className="mt-5 rounded-print border border-rule bg-sheet p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="micro">Kecocokan kata kunci</p>
              <p className="num text-[15px] text-ink">{match.score}%</p>
            </div>
            <div className="mt-2 h-[4px] w-full bg-rule-strong">
              <div
                className={cn(
                  "h-[4px] transition-[width] duration-500 ease-print",
                  match.score >= 60 ? "bg-ok" : match.score >= 30 ? "bg-warn" : "bg-accent",
                )}
                style={{ width: `${match.score}%` }}
              />
            </div>

            {match.matched.length > 0 && (
              <>
                <p className="micro mt-4 text-[10px]">Sudah ada di CV</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {match.matched.map((w) => (
                    <li
                      key={w}
                      className="rounded-print border border-rule-strong px-2 py-0.5 text-[11px] text-ink-2"
                    >
                      {w}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {match.missing.length > 0 && (
              <>
                <p className="micro mt-4 text-[10px]">
                  Belum ada di CV — pertimbangkan ditambah kalau memang kamu punya
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {match.missing.map((w) => (
                    <li
                      key={w}
                      className="rounded-print border border-accent px-2 py-0.5 text-[11px] text-accent"
                    >
                      {w}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <p className="mt-4 border-t border-rule pt-3 text-[11px] leading-relaxed text-ink-3">
              Ini pencocokan kata, bukan penilaian. Jangan menambahkan keahlian yang
              belum kamu punya — hanya pakai daftar ini untuk memastikan hal yang
              memang sudah kamu kuasai benar-benar tertulis.
            </p>
          </div>
        )}
      </section>

      {/* ---------------- kanan: surat ---------------- */}
      <section className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-[19px] text-ink">Surat lamaran</h2>
          <Button size="sm" variant="secondary" onClick={onDraft} disabled={!data.personal.fullName}>
            Buat draf dari CV
          </Button>
        </div>
        <p className="mt-1 border-b border-rule-strong pb-2 text-[12px] text-ink-3">
          Draf disusun dari isi CV-mu sendiri — tidak ada pengalaman yang dikarang. Baca
          ulang dan sesuaikan sebelum dikirim.
        </p>

        <Textarea
          rows={22}
          className="mt-4 font-[inherit] text-[13px]"
          value={kit.letter}
          onChange={(e) => set("letter", e.target.value)}
          placeholder="Klik “Buat draf dari CV” untuk mulai, atau tulis sendiri di sini."
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={onSave} disabled={pending || busy !== null}>
            {pending ? "Menyimpan…" : "Simpan"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onDownload("docx")}
            disabled={!hasLetter || busy !== null}
            title="Unduh surat sebagai Word (.docx)"
          >
            {busy === "docx" ? "Menyiapkan…" : "Unduh Word"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onDownload("pdf")}
            disabled={!hasLetter || busy !== null}
            title="Unduh surat sebagai PDF"
          >
            {busy === "pdf" ? "Menyiapkan…" : "Unduh PDF"}
          </Button>
          <p
            role="status"
            className={cn("text-[12px]", alert ? "text-accent" : "text-ink-3")}
          >
            {status}
          </p>
        </div>
      </section>
    </div>
  );
}
