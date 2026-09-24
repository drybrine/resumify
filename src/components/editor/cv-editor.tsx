"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { Cv, CvData, Plan, TemplateId } from "@/lib/types";
import { PLAN_LIMITS, SAMPLE_CV } from "@/lib/cv-data";
import { updateCv, toggleShare } from "@/lib/actions/cvs";
import { renderResumeHtml, TEMPLATE_META } from "@/lib/templates/render";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Textarea } from "@/components/ui/input";
import { SheetPreview } from "@/components/sheet-preview";
import { SectionRail, SectionTabs, SECTIONS, type SectionId } from "./section-nav";
import { ListSection } from "./list-section";
import { cn } from "@/lib/utils";

const PAPER_W = 8.5 * 96;
const ZOOM_STEPS = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2];

export function CvEditor({
  cv,
  plan,
  appUrl,
}: {
  cv: Cv;
  plan: Plan;
  appUrl: string;
}) {
  const limits = PLAN_LIMITS[plan];
  const [title, setTitle] = useState(cv.title);
  const [template, setTemplate] = useState<TemplateId>(cv.template);
  const [data, setData] = useState<CvData>(cv.data);
  const [section, setSection] = useState<SectionId>("personal");
  const [status, setStatus] = useState("Tersimpan");
  const [alert, setAlert] = useState(false);
  const [shareSlug, setShareSlug] = useState(cv.share_slug);
  const [isPublic, setIsPublic] = useState(cv.is_public);
  const [zoom, setZoom] = useState<number | null>(null); // null = sesuai lebar
  const [fitScale, setFitScale] = useState(0.72);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [mobilePane, setMobilePane] = useState<"form" | "preview">("form");
  const [confirmShareOff, setConfirmShareOff] = useState(false);
  const [pending, startTransition] = useTransition();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);

  const scale = zoom ?? fitScale;
  const previewHtml = useMemo(() => renderResumeHtml(data, template), [data, template]);
  const samplePreviews = useMemo(
    () =>
      (Object.keys(TEMPLATE_META) as TemplateId[]).reduce<Record<string, string>>(
        (acc, id) => {
          acc[id] = renderResumeHtml(SAMPLE_CV, id);
          return acc;
        },
        {}
      ),
    []
  );

  const completed = useMemo<Record<SectionId, boolean>>(
    () => ({
      personal:
        !!data.personal?.fullName?.trim() &&
        !!data.personal?.email?.trim() &&
        !!(data.personal?.location?.trim() || data.personal?.phone?.trim()),
      summary: !!data.summary?.trim(),
      education: (data.education || []).some((e) => e.school?.trim() || e.degree?.trim()),
      experience: (data.experience || []).some((e) => e.company?.trim() || e.role?.trim()),
      projects: (data.projects || []).some((p) => p.name?.trim()),
      publications: (data.publications || []).some((p) => p.text?.trim()),
      skills: (data.skills || []).some((s) => s.category?.trim() || s.items?.trim()),
      languages: (data.languages || []).some((l) => l.name?.trim()),
    }),
    [data]
  );

  const completeness = useMemo(() => {
    const filled = SECTIONS.filter((s) => completed[s.id]).length;
    return Math.round((filled / SECTIONS.length) * 100);
  }, [completed]);

  /* ---------- save ---------- */

  const save = useCallback(
    (payload?: { title?: string; template?: TemplateId; data?: CvData }) => {
      startTransition(async () => {
        setStatus("Menyimpan…");
        setAlert(false);
        const res = await updateCv(cv.id, {
          title: payload?.title ?? title,
          template: payload?.template ?? template,
          data: payload?.data ?? data,
        });
        if (res?.error) {
          setStatus(res.error);
          setAlert(true);
        } else {
          setStatus("Tersimpan");
        }
      });
    },
    [cv.id, title, template, data]
  );

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(() => save({ title, template, data }), 900);
    return () => clearTimeout(t);
  }, [title, template, data]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  /* ---------- preview scaling ---------- */

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const measure = () =>
      setFitScale(Math.min(1.2, Math.max(0.35, (el.clientWidth - 64) / PAPER_W)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mobilePane]);

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const measure = () => setSheetHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [previewHtml, template]);

  /* ---------- template dialog: escape + focus ---------- */

  useEffect(() => {
    if (!dialogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDialogOpen(false);
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [dialogOpen]);

  /* ---------- field helpers ---------- */

  function setPersonal(field: keyof CvData["personal"], value: string) {
    setData((d) => ({ ...d, personal: { ...d.personal, [field]: value } }));
  }

  function notice(message: string, isAlert = false) {
    setStatus(message);
    setAlert(isAlert);
  }

  async function onShare() {
    // Turning sharing off discards the current slug: the next share mints a new
    // link, so the old one stops working. Ask once.
    if (isPublic && !confirmShareOff) {
      setConfirmShareOff(true);
      notice("Klik sekali lagi untuk mematikan link publik", true);
      setTimeout(() => setConfirmShareOff(false), 6000);
      return;
    }
    startTransition(async () => {
      setConfirmShareOff(false);
      const res = await toggleShare(cv.id, !isPublic);
      if (res?.error) {
        notice(res.error, true);
        return;
      }
      setIsPublic(!!res.is_public);
      setShareSlug(res.share_slug ?? null);
      if (res.share_slug) {
        const link = `${appUrl}/share/${res.share_slug}`;
        navigator.clipboard.writeText(link).catch(() => {});
        notice("Link publik aktif & tersalin");
      } else {
        notice("Link publik dimatikan");
      }
    });
  }

  async function onPdf() {
    setPdfLoading(true);
    try {
      await updateCv(cv.id, { title, template, data });
      const res = await fetch(`/api/cvs/${cv.id}/pdf`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notice(err.error || "Gagal membuat PDF", true);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "cv"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      notice("PDF terunduh");
    } finally {
      setPdfLoading(false);
    }
  }

  const shareUrl = shareSlug ? `${appUrl}/share/${shareSlug}` : null;
  const currentMeta = TEMPLATE_META[template];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-paper text-ink">
      {/* ---------- toolbar ---------- */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-rule bg-sheet px-4 py-2 sm:px-5">
        <div className="flex min-w-0 flex-1 basis-[220px] items-center gap-3">
          <Link
            href="/dashboard"
            className="shrink-0 text-[13px] text-ink-2 transition-colors hover:text-accent"
          >
            ← Dasbor
          </Link>

          <span aria-hidden className="hidden h-5 w-px bg-rule sm:block" />

          <div className="min-w-0 max-w-[420px] flex-1">
            <label htmlFor="cv-title" className="sr-only">
              Judul CV
            </label>
            <input
              id="cv-title"
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul CV"
              className="w-full min-w-0 truncate rounded-print border border-transparent bg-transparent px-1 py-0.5 text-[14px] font-medium text-ink outline-none transition-colors hover:border-rule focus:border-accent"
            />
            <p
              className={cn(
                "px-1 text-[11px] transition-colors duration-300 ease-ink",
                alert ? "text-accent" : "text-ink-3",
                (pending || pdfLoading) && "pulse"
              )}
              role="status"
              title="Tersimpan otomatis setiap perubahan · Ctrl/Cmd + S untuk menyimpan sekarang"
            >
              {status}
            </p>
          </div>
        </div>

        <div className="no-scrollbar flex w-full min-w-0 items-center gap-2 overflow-x-auto pb-0.5 sm:w-auto sm:gap-3 sm:pb-0">
          <div
            className="hidden items-center gap-2 xl:flex"
            title="Bagian CV yang sudah terisi"
          >
            <span className="micro text-[10px]">Terisi</span>
            <span className="num text-[12px] text-ink-2">{completeness}%</span>
            <span aria-hidden className="block h-[3px] w-20 bg-rule-strong">
              <span
                className="block h-[3px] bg-accent transition-[width] duration-500 ease-print"
                style={{ width: `${completeness}%` }}
              />
            </span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDialogOpen(true)}
            aria-haspopup="dialog"
          >
            Template
            <span className="hidden sm:inline"> · {currentMeta.name}</span>
            <span aria-hidden className="text-ink-3">
              ▾
            </span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onShare}
            disabled={pending}
            title={
              limits.share
                ? isPublic
                  ? "Matikan link publik — link lama tidak akan aktif lagi"
                  : "Aktifkan link publik"
                : "Butuh paket Pro"
            }
          >
            {isPublic
              ? confirmShareOff
                ? "Yakin? Link lama mati"
                : "Matikan link"
              : "Bagikan link"}
          </Button>

          <Button size="sm" onClick={onPdf} disabled={pdfLoading}>
            {pdfLoading ? "Menyiapkan…" : "Unduh PDF"}
          </Button>
        </div>
      </header>

      {shareUrl && (
        <div className="flex shrink-0 items-center gap-3 overflow-hidden border-b border-rule bg-accent-soft px-4 py-2">
          <span className="micro shrink-0 text-[10px]">Link publik</span>
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="link-rule num min-w-0 truncate text-[12px] text-ink"
          >
            {shareUrl}
          </a>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl).catch(() => {});
              notice("Link disalin");
            }}
            className="shrink-0 rounded-print border border-rule-strong bg-sheet px-2 py-1 text-[12px] text-ink-2 transition-colors hover:text-ink"
          >
            Salin
          </button>
        </div>
      )}

      {/* ---------- workspace ---------- */}
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[196px_430px_1fr]">
        <SectionRail active={section} completed={completed} onChange={setSection} />

        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-col border-r border-rule bg-paper",
            mobilePane === "preview" && "hidden lg:flex"
          )}
        >
          <SectionTabs active={section} completed={completed} onChange={setSection} />

          <div
            key={section}
            className="enter min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5"
            style={{ "--rise": "6px" } as React.CSSProperties}
          >
            {section === "personal" && (
              <div>
                <h2 className="font-display text-[19px] leading-tight text-ink">
                  Identitas
                </h2>
                <p className="mt-1 border-b border-rule-strong pb-2 text-[12px] text-ink-3">
                  Nama dan kontak yang muncul di bagian paling atas CV.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {(
                    [
                      ["fullName", "Nama lengkap", true, "Nama sesuai KTP atau ijazah"],
                      ["location", "Domisili", false, "Kota, negara"],
                      ["phone", "Telepon", false, "+62 812 3456 7890"],
                      ["email", "Email", false, "nama@email.com"],
                      ["linkedin", "LinkedIn", false, "/in/username"],
                      ["github", "GitHub", false, "github.com/username"],
                      ["website", "Situs / portofolio", false, "namadomain.com"],
                    ] as const
                  ).map(([field, label, full, hint]) => (
                    <div key={field} className={full ? "col-span-2" : ""}>
                      <Label>{label}</Label>
                      <Input
                        value={data.personal[field] || ""}
                        onChange={(e) => setPersonal(field, e.target.value)}
                        placeholder={hint}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section === "summary" && (
              <div>
                <h2 className="font-display text-[19px] leading-tight text-ink">
                  Ringkasan
                </h2>
                <p className="mt-1 border-b border-rule-strong pb-2 text-[12px] text-ink-3">
                  2–4 kalimat: siapa kamu, di bidang apa, dan pencapaian paling
                  relevan.
                </p>
                <Textarea
                  rows={9}
                  className="mt-4"
                  value={data.summary || ""}
                  onChange={(e) => setData((d) => ({ ...d, summary: e.target.value }))}
                  placeholder="Contoh: Lulusan Sistem Komputer dengan pengalaman magang di bidang jaringan dan perangkat IoT…"
                />
              </div>
            )}

            {section === "education" && (
              <ListSection
                title="Pendidikan"
                hint="Urutkan dari yang terbaru."
                items={data.education}
                fields={[
                  { key: "school", label: "Institusi" },
                  { key: "location", label: "Kota" },
                  { key: "degree", label: "Jenjang & jurusan", full: true },
                  { key: "period", label: "Periode", full: true },
                ]}
                hasBullets
                emptyItem={() => ({
                  school: "",
                  location: "",
                  degree: "",
                  period: "",
                  bullets: [""],
                })}
                onChange={(education) => setData((d) => ({ ...d, education }))}
              />
            )}

            {section === "experience" && (
              <ListSection
                title="Pengalaman"
                hint="Kerja, magang, atau organisasi — semua boleh."
                items={data.experience}
                fields={[
                  { key: "company", label: "Perusahaan / organisasi" },
                  { key: "location", label: "Kota" },
                  { key: "role", label: "Posisi", full: true },
                  { key: "period", label: "Periode", full: true },
                ]}
                hasBullets
                emptyItem={() => ({
                  company: "",
                  location: "",
                  role: "",
                  period: "",
                  bullets: [""],
                })}
                onChange={(experience) => setData((d) => ({ ...d, experience }))}
              />
            )}

            {section === "projects" && (
              <ListSection
                title="Proyek"
                hint="Tulis hasilnya, bukan hanya teknologinya."
                items={data.projects}
                fields={[
                  { key: "name", label: "Nama proyek", full: true },
                  { key: "link", label: "Tautan / repo" },
                  { key: "period", label: "Periode" },
                ]}
                hasBullets
                emptyItem={() => ({ name: "", link: "", period: "", bullets: [""] })}
                onChange={(projects) => setData((d) => ({ ...d, projects }))}
              />
            )}

            {section === "publications" && (
              <ListSection
                title="Publikasi"
                hint="Paper, artikel, atau penelitian."
                items={data.publications}
                fields={[
                  { key: "text", label: "Kutipan / judul", full: true, textarea: true },
                  { key: "url", label: "Tautan", full: true },
                ]}
                emptyItem={() => ({ text: "", url: "" })}
                onChange={(publications) => setData((d) => ({ ...d, publications }))}
              />
            )}

            {section === "skills" && (
              <ListSection
                title="Keahlian"
                hint="Pisahkan per kategori, item dipisah koma."
                items={data.skills}
                fields={[
                  { key: "category", label: "Kategori" },
                  { key: "items", label: "Daftar (pisahkan dengan koma)", full: true },
                ]}
                emptyItem={() => ({ category: "", items: "" })}
                onChange={(skills) => setData((d) => ({ ...d, skills }))}
              />
            )}

            {section === "languages" && (
              <ListSection
                title="Bahasa"
                items={data.languages}
                fields={[
                  { key: "name", label: "Bahasa" },
                  { key: "level", label: "Tingkat" },
                ]}
                emptyItem={() => ({ name: "", level: "" })}
                onChange={(languages) => setData((d) => ({ ...d, languages }))}
              />
            )}
          </div>
        </div>

        {/* ---------- preview ---------- */}
        <section
          className={cn(
            "flex min-h-0 min-w-0 flex-col bg-desk",
            mobilePane === "form" && "hidden lg:flex"
          )}
        >
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-rule bg-paper px-4 py-2">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="micro shrink-0">Pratinjau</span>
              <span className="truncate text-[12px] text-ink-3">
                {currentMeta.name} · ukuran surat, siap cetak
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setZoom(
                    () =>
                      ZOOM_STEPS.filter((z) => z < scale - 0.001).pop() ?? ZOOM_STEPS[0]
                  )
                }
                className="press h-8 w-8 rounded-print border border-rule-strong bg-sheet text-[13px] text-ink-2 hover:text-ink"
                aria-label="Perkecil"
              >
                −
              </button>
              <span className="num w-11 text-center text-[12px] text-ink-2">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() =>
                  setZoom(
                    () => ZOOM_STEPS.find((z) => z > scale + 0.001) ?? ZOOM_STEPS.at(-1)!
                  )
                }
                className="press h-8 w-8 rounded-print border border-rule-strong bg-sheet text-[13px] text-ink-2 hover:text-ink"
                aria-label="Perbesar"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setZoom(null)}
                className={cn(
                                  "ml-1 h-8 rounded-print border px-2.5 text-[12px]",
                  zoom === null
                    ? "border-accent text-accent"
                    : "border-rule-strong text-ink-2 hover:text-ink"
                )}
              >
                Sesuaikan lebar
              </button>
            </div>
          </div>

          <div ref={canvasRef} className="min-h-0 flex-1 overflow-auto p-4 sm:p-8">
            <div className="mx-auto" style={{ width: `${PAPER_W * scale}px`, maxWidth: "100%" }}>
              <div
                className="overflow-hidden"
                style={{ height: sheetHeight ? `${sheetHeight * scale}px` : undefined }}
              >
                <div
                  ref={sheetRef}
                  style={{
                    width: "8.5in",
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    visibility: sheetHeight ? "visible" : "hidden",
                  }}
                >
                  <article
                    key={template}
                    className={`resume-preview template-${template} enter-sheet`}
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* mobile pane switcher */}
      <div className="flex shrink-0 items-center gap-3 border-t border-rule bg-sheet px-4 py-2 lg:hidden">
        <span className="micro text-[10px]">Tampilan</span>
        {(["form", "preview"] as const).map((pane) => (
          <button
            key={pane}
            type="button"
            onClick={() => setMobilePane(pane)}
            aria-pressed={mobilePane === pane}
            className={cn(
              "press rounded-print border px-3 py-1 text-[12px]",
              mobilePane === pane
                ? "border-accent text-accent"
                : "border-rule-strong text-ink-2"
            )}
          >
            {pane === "form" ? "Isi data" : "Lihat hasil"}
          </button>
        ))}
      </div>

      {/* ---------- template dialog ---------- */}
      {dialogOpen && (
        <div
          className="enter-veil fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/45 p-3 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDialogOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-dialog-title"
            className="enter-sheet w-full max-w-5xl rounded-print border border-rule bg-paper shadow-[0_24px_60px_-24px_rgba(25,23,18,0.5)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
              <div>
                <h2
                  id="template-dialog-title"
                  className="font-display text-[22px] leading-tight text-ink"
                >
                  Pilih template
                </h2>
                <p className="mt-1 text-[13px] text-ink-2">
                  20 layout. Mengganti template tidak mengubah isi CV-mu — hanya
                  tipografi dan susunannya.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>
                Tutup
              </Button>
            </div>

            <div className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(TEMPLATE_META) as TemplateId[]).map((id) => {
                const meta = TEMPLATE_META[id];
                const locked = !limits.templates.includes(id) && meta.pro;
                const isSelected = template === id;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      if (locked) {
                        notice("Template ini butuh paket Pro", true);
                        return;
                      }
                      setTemplate(id);
                      setDialogOpen(false);
                      notice(`Template diganti ke ${meta.name}`);
                    }}
                    className={cn(
                      "press flex flex-col gap-2 rounded-print border p-2 text-left",
                      isSelected
                        ? "border-accent bg-accent-soft/50"
                        : "border-rule hover:border-ink-3 hover:bg-sheet"
                    )}
                  >
                    <div className="border border-rule bg-white p-1">
                      <SheetPreview html={samplePreviews[id]} templateId={id} />
                    </div>

                    <div className="flex items-baseline justify-between gap-2 px-0.5">
                      <span className="font-display text-[16px] text-ink">
                        {meta.name}
                      </span>
                      <span className="micro text-[10px]">
                        {meta.category}
                      </span>
                    </div>
                    <p className="px-0.5 text-[12px] leading-relaxed text-ink-2">
                      {meta.description}
                    </p>
                    <div className="flex items-center gap-2 px-0.5 pb-0.5">
                      {isSelected && <Badge tone="pro">dipakai sekarang</Badge>}
                      {locked && <Badge tone="warn">pro</Badge>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
