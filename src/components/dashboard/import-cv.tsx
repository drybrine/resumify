"use client";

import { useRef, useState, useTransition } from "react";
import { createCv } from "@/lib/actions/cvs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TEMPLATE_META } from "@/lib/templates/render";
import type { CvData, TemplateId } from "@/lib/types";

type Found = {
  sections: string[];
  entries: number;
  contact: string[];
  pageCount: number;
  charCount: number;
};

type Parsed = { data: CvData; warnings: string[]; found: Found };

const ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** What the parse actually produced, so the summary reflects the result not the guess. */
function counts(data: CvData) {
  return [
    { label: "Pendidikan", n: data.education.length },
    { label: "Pengalaman", n: data.experience.length },
    { label: "Proyek", n: data.projects.length },
    { label: "Publikasi", n: data.publications.length },
    { label: "Keahlian", n: data.skills.length },
    { label: "Bahasa", n: data.languages.length },
  ].filter((row) => row.n > 0);
}

export function ImportCv({ allowed, atLimit }: { allowed: TemplateId[]; atLimit: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [template, setTemplate] = useState<TemplateId>(allowed[0] ?? "jake");
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();

  async function upload(file: File) {
    setBusy(true);
    setError("");
    setParsed(null);
    setFileName(file.name);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/cvs/import", { method: "POST", body });
      const json = (await res.json()) as Parsed & { error?: string };
      if (!res.ok) {
        setError(json.error || "Gagal membaca file-nya.");
        return;
      }
      setParsed(json);
      setTitle(json.data.personal.fullName || file.name.replace(/\.[^.]+$/, ""));
    } catch {
      setError("Koneksinya putus saat upload. Coba lagi ya.");
    } finally {
      setBusy(false);
    }
  }

  function confirm() {
    if (!parsed) return;
    startTransition(async () => {
      try {
        await createCv({ title: title.trim() || "CV hasil impor", template, data: parsed.data });
      } catch (err) {
        // redirect() works by throwing; swallowing it would leave the user stuck
        // on a dashboard that looks like nothing happened.
        const digest = (err as { digest?: string })?.digest;
        if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw err;
        setError(err instanceof Error ? err.message : "Gagal membuat CV-nya.");
      }
    });
  }

  function reset() {
    setParsed(null);
    setError("");
    setFileName("");
    if (input.current) input.current.value = "";
  }

  return (
    <section className="mt-8 border border-rule bg-sheet">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-[15px] text-ink">Punya CV lama? Impor saja.</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
            Kirim PDF atau Word-nya — isinya dibaca jadi data yang bisa diedit, lalu
            tinggal pilih salah satu dari 20 template.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? "Tutup" : "Impor CV lama"}
        </Button>
      </div>

      {open && (
        <div className="border-t border-rule px-5 py-5">
          {atLimit ? (
            <p className="text-[13px] leading-relaxed text-ink-2">
              Slot CV kamu sudah penuh, jadi belum bisa menambah hasil impor. Hapus satu
              CV dulu, atau tambah slot lewat paket Pro.
            </p>
          ) : (
            <>
              <input
                ref={input}
                id="cv-import-file"
                type="file"
                accept={ACCEPT}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(file);
                }}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => input.current?.click()}
                  disabled={busy}
                >
                  {busy ? "Membaca…" : parsed ? "Ganti file" : "Pilih file PDF / Word"}
                </Button>
                {fileName && <span className="text-[13px] text-ink-2">{fileName}</span>}
              </div>

              {error && (
                <p role="alert" className="mt-4 border-l-2 border-accent pl-3 text-[13px] leading-relaxed text-ink">
                  {error}
                </p>
              )}

              {parsed && (
                <div className="mt-5">
                  <p className="micro">Yang kebaca</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink">
                    {parsed.data.personal.fullName || "(nama belum kebaca)"}
                    {parsed.data.personal.email ? ` · ${parsed.data.personal.email}` : ""}
                  </p>

                  <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-ink-2">
                    {counts(parsed.data).map((row) => (
                      <div key={row.label} className="flex items-baseline gap-2">
                        <dt>{row.label}</dt>
                        <dd className="num text-ink">{row.n}</dd>
                      </div>
                    ))}
                  </dl>

                  {counts(parsed.data).length === 0 && (
                    <p className="mt-2 text-[13px] text-ink-2">
                      Belum ada satu bagian pun yang kebaca.
                    </p>
                  )}

                  {parsed.warnings.length > 0 && (
                    <ul className="mt-4 space-y-1 border-l-2 border-rule-strong pl-3">
                      {parsed.warnings.map((w) => (
                        <li key={w} className="text-[13px] leading-relaxed text-ink-2">
                          {w}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="micro">Judul CV</span>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="CV hasil impor"
                        className="mt-2 h-9 text-[14px]"
                      />
                    </label>
                    <label className="block">
                      <span className="micro">Template</span>
                      <select
                        value={template}
                        onChange={(e) => setTemplate(e.target.value as TemplateId)}
                        className="mt-2 h-9 w-full border border-rule-strong bg-canvas px-2 text-[14px] text-ink"
                      >
                        {allowed.map((id) => (
                          <option key={id} value={id}>
                            {TEMPLATE_META[id]?.name ?? id}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Button type="button" onClick={confirm} disabled={pending}>
                      {pending ? "Membuat…" : "Buat CV & buka editor"}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={pending}>
                      Batal
                    </Button>
                    <span className="text-[12px] text-ink-3">
                      Hasil bacaannya bisa dirapikan di editor setelah ini.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
