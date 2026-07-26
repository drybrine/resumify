"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Share2,
  Save,
  Loader2,
  Link2Off,
  LayoutGrid,
  X,
  Check,
  Crown,
} from "lucide-react";
import type { Cv, CvData, Plan, TemplateId } from "@/lib/types";
import { PLAN_LIMITS, SAMPLE_CV } from "@/lib/cv-data";
import { updateCv, toggleShare } from "@/lib/actions/cvs";
import { renderResumeHtml, TEMPLATE_META } from "@/lib/templates/render";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Textarea } from "@/components/ui/input";
import { SectionNav } from "./section-nav";
import { ListSection } from "./list-section";

const SECTIONS = [
  "personal",
  "summary",
  "education",
  "experience",
  "projects",
  "publications",
  "skills",
  "languages",
] as const;

type Section = (typeof SECTIONS)[number];

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
  const [section, setSection] = useState<Section>("personal");
  const [status, setStatus] = useState("Ready");
  const [shareSlug, setShareSlug] = useState(cv.share_slug);
  const [isPublic, setIsPublic] = useState(cv.is_public);
  const [zoom, setZoom] = useState(0.75);
  const [pending, startTransition] = useTransition();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const previewHtml = useMemo(
    () => renderResumeHtml(data, template),
    [data, template]
  );

  const completeness = useMemo(() => {
    let score = 0;
    const p = data.personal || {};
    if (p.fullName?.trim()) score += 15;
    if (p.email?.trim()) score += 10;
    if (p.phone?.trim() || p.location?.trim()) score += 5;
    if (data.summary?.trim()) score += 15;
    if ((data.experience || []).some((e) => e.role?.trim() || e.company?.trim()))
      score += 25;
    if ((data.education || []).some((e) => e.school?.trim() || e.degree?.trim()))
      score += 15;
    if ((data.skills || []).some((s) => s.items?.trim() || s.category?.trim()))
      score += 10;
    if ((data.projects || []).some((pr) => pr.name?.trim())) score += 5;
    return Math.min(100, score);
  }, [data]);

  const save = useCallback(
    (payload?: { title?: string; template?: TemplateId; data?: CvData }) => {
      startTransition(async () => {
        setStatus("Saving…");
        const res = await updateCv(cv.id, {
          title: payload?.title ?? title,
          template: payload?.template ?? template,
          data: payload?.data ?? data,
        });
        if (res?.error) setStatus(res.error);
        else setStatus("Saved");
      });
    },
    [cv.id, title, template, data]
  );

  // Debounced auto-save
  useEffect(() => {
    const t = setTimeout(() => {
      save({ title, template, data });
    }, 900);
    return () => clearTimeout(t);
  }, [title, template, data]); // eslint-disable-line react-hooks/exhaustive-deps

  function setPersonal(field: keyof CvData["personal"], value: string) {
    setData((d) => ({
      ...d,
      personal: { ...d.personal, [field]: value },
    }));
  }

  async function onShare() {
    startTransition(async () => {
      const res = await toggleShare(cv.id, !isPublic);
      if (res?.error) {
        setStatus(res.error);
        return;
      }
      setIsPublic(!!res.is_public);
      setShareSlug(res.share_slug ?? null);
      if (res.share_slug) {
        const link = `${appUrl}/share/${res.share_slug}`;
        navigator.clipboard.writeText(link).catch(() => {});
        setStatus("Link copied to clipboard!");
      } else {
        setStatus("Share link disabled");
      }
    });
  }

  async function onPdf() {
    setPdfLoading(true);
    try {
      // Save first
      await updateCv(cv.id, { title, template, data });
      const res = await fetch(`/api/cvs/${cv.id}/pdf`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStatus(err.error || "PDF failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "resume"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("PDF downloaded");
    } finally {
      setPdfLoading(false);
    }
  }

  const shareUrl = shareSlug ? `${appUrl}/share/${shareSlug}` : null;

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Bar Toolbar */}
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-slate-950/80 px-4 py-2.5 backdrop-blur-xl z-20">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="px-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 border-l border-white/10 pl-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="min-w-0 max-w-[200px] truncate bg-transparent text-sm font-bold text-white outline-none focus:ring-1 focus:ring-indigo-500/50 rounded px-1.5 py-0.5 sm:max-w-xs"
              placeholder="CV Title..."
            />
            <Badge tone={pending ? "warn" : "ok"} className="text-[10px] font-semibold">
              {pending ? "Saving…" : status}
            </Badge>
            <div
              className="hidden sm:flex items-center gap-2 ml-1"
              title="Kelengkapan CV (bukan skor ATS formal)"
            >
              <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                {completeness}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowTemplateModal(true)}
            className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Template ({TEMPLATE_META[template].name})</span>
          </Button>

          <Button variant="ghost" size="sm" onClick={() => save()} disabled={pending} className="hidden sm:inline-flex">
            <Save className="h-4 w-4" />
            <span>Save</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onShare}
            disabled={pending}
            title={limits.share ? "Toggle share" : "Pro only"}
          >
            {isPublic ? (
              <Link2Off className="h-4 w-4 text-emerald-400" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{isPublic ? "Unshare" : "Share"}</span>
          </Button>

          <Button
            size="sm"
            onClick={onPdf}
            disabled={pdfLoading}
            className="shadow-indigo-500/25"
          >
            {pdfLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>Export PDF</span>
          </Button>
        </div>
      </header>

      {shareUrl && (
        <div className="shrink-0 border-b border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold uppercase tracking-wider text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">Public Link Active</span>
            <a href={shareUrl} target="_blank" rel="noreferrer" className="underline font-mono truncate">
              {shareUrl}
            </a>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[450px_1fr]">
        {/* Left Form Sidebar */}
        <aside className="flex min-h-0 flex-col border-r border-white/10 bg-slate-950/40 backdrop-blur-xl">
          <SectionNav
            sections={SECTIONS}
            active={section}
            onChange={(s) => setSection(s as Section)}
          />
          <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-4 animate-fade-in" key={section}>
            {section === "personal" && (
              <div className="glass-card rounded-2xl p-5 space-y-4 border border-white/10">
                <h2 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-2">
                  Personal Information
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ["fullName", "Full Name", true],
                      ["location", "Location", false],
                      ["email", "Email", false],
                      ["phone", "Phone", false],
                      ["github", "GitHub Username / Link", false],
                      ["website", "Portfolio / Website", false],
                      ["linkedin", "LinkedIn URL", true],
                    ] as const
                  ).map(([field, label, full]) => (
                    <div key={field} className={full ? "col-span-2" : ""}>
                      <Label>{label}</Label>
                      <Input
                        value={data.personal[field] || ""}
                        onChange={(e) => setPersonal(field, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section === "summary" && (
              <div className="glass-card rounded-2xl p-5 border border-white/10">
                <h2 className="mb-3 text-sm font-bold text-white border-b border-white/5 pb-2">
                  Professional Summary
                </h2>
                <Textarea
                  rows={9}
                  value={data.summary || ""}
                  onChange={(e) =>
                    setData((d) => ({ ...d, summary: e.target.value }))
                  }
                  placeholder="Write 2-4 sentences highlighting your core competencies and experience…"
                />
              </div>
            )}

            {section === "education" && (
              <ListSection
                title="Education History"
                items={data.education}
                fields={[
                  { key: "school", label: "School / University" },
                  { key: "location", label: "Location" },
                  { key: "degree", label: "Degree & Major", full: true },
                  { key: "period", label: "Time Period" },
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
                title="Work Experience"
                items={data.experience}
                fields={[
                  { key: "company", label: "Company Name" },
                  { key: "location", label: "Location" },
                  { key: "role", label: "Job Title", full: true },
                  { key: "period", label: "Time Period" },
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
                title="Key Projects"
                items={data.projects}
                fields={[
                  { key: "name", label: "Project Name", full: true },
                  { key: "link", label: "Link / Repo" },
                  { key: "period", label: "Period" },
                ]}
                hasBullets
                emptyItem={() => ({
                  name: "",
                  link: "",
                  period: "",
                  bullets: [""],
                })}
                onChange={(projects) => setData((d) => ({ ...d, projects }))}
              />
            )}

            {section === "publications" && (
              <ListSection
                title="Publications & Research"
                items={data.publications}
                fields={[
                  { key: "text", label: "Citation / Title", full: true, textarea: true },
                  { key: "url", label: "URL", full: true },
                ]}
                emptyItem={() => ({ text: "", url: "" })}
                onChange={(publications) =>
                  setData((d) => ({ ...d, publications }))
                }
              />
            )}

            {section === "skills" && (
              <ListSection
                title="Skills & Technologies"
                items={data.skills}
                fields={[
                  { key: "category", label: "Category (e.g. Languages, Frameworks)" },
                  { key: "items", label: "Items (comma-separated)", full: true },
                ]}
                emptyItem={() => ({ category: "", items: "" })}
                onChange={(skills) => setData((d) => ({ ...d, skills }))}
              />
            )}

            {section === "languages" && (
              <ListSection
                title="Languages"
                items={data.languages}
                fields={[
                  { key: "name", label: "Language" },
                  { key: "level", label: "Proficiency Level" },
                ]}
                emptyItem={() => ({ name: "", level: "" })}
                onChange={(languages) => setData((d) => ({ ...d, languages }))}
              />
            )}
          </div>
        </aside>

        {/* Right Preview Canvas */}
        <section className="flex min-h-0 flex-col bg-slate-900/60 mesh-gradient-bg">
          <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-slate-950/40 px-6 py-2 text-xs text-slate-400 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-slate-200">Live Preview</span>
              <span>·</span>
              <span className="text-indigo-300 font-medium">{TEMPLATE_META[template].name} Template</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-mono">Zoom</span>
              <div className="flex items-center rounded-lg border border-white/10 bg-slate-950/80 p-0.5">
                <button
                  type="button"
                  className="px-2 py-0.5 hover:bg-white/10 rounded font-bold text-slate-300"
                  onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
                >
                  −
                </button>
                <span className="w-12 text-center font-mono text-[11px] text-slate-200">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  className="px-2 py-0.5 hover:bg-white/10 rounded font-bold text-slate-300"
                  onClick={() => setZoom((z) => Math.min(1.2, z + 0.1))}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8 flex justify-center items-start">
            <div
              className="shrink-0 transition-transform duration-150 shadow-2xl rounded-sm"
              style={{
                width: `${8.5 * zoom}in`,
                minHeight: `${11 * zoom}in`,
              }}
            >
              <div
                className="origin-top-left"
                style={{
                  transform: `scale(${zoom})`,
                  width: "8.5in",
                }}
              >
                <article
                  className={`resume-preview template-${template}`}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
      {/* Template Selector Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 animate-fade-in">
          <div className="glass-panel relative flex flex-col max-h-[90vh] w-full max-w-5xl rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-indigo-400" />
                  Pilih Template CV
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  12 template · pratinjau layout (contoh). Data CV kamu tetap aman di editor.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(TEMPLATE_META) as TemplateId[]).map((id) => {
                const meta = TEMPLATE_META[id];
                const locked = !limits.templates.includes(id) && meta.pro;
                const isSelected = template === id;
                // Always preview with SAMPLE_CV so empty CVs still show template layout
                const sampleHtml = renderResumeHtml(SAMPLE_CV, id);

                return (
                  <div
                    key={id}
                    onClick={() => {
                      if (locked) {
                        setStatus("Template requires Pro plan");
                        return;
                      }
                      setTemplate(id);
                      setShowTemplateModal(false);
                    }}
                    className={`glass-card rounded-2xl p-4 flex flex-col justify-between cursor-pointer border transition-all relative overflow-hidden group ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/50"
                        : locked
                        ? "opacity-60 border-white/5 bg-slate-900/20"
                        : "border-white/10 hover:border-indigo-400/50"
                    }`}
                  >
                    {/* Template layout thumbnail (sample data, not user's blank CV) */}
                    <div className="h-48 w-full bg-white rounded-xl overflow-hidden relative shadow-inner mb-3 border border-slate-200 pointer-events-none select-none">
                      <div
                        className="origin-top-left absolute top-0 left-0"
                        style={{
                          transform: "scale(0.28)",
                          width: "8.5in",
                          height: "11in",
                        }}
                      >
                        <article
                          className={`resume-preview template-${id}`}
                          dangerouslySetInnerHTML={{ __html: sampleHtml }}
                        />
                      </div>

                      {locked && (
                        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-amber-400 gap-1 font-bold text-xs z-10">
                          <Crown className="h-6 w-6 text-amber-400" />
                          <span>PRO ONLY</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white text-sm">{meta.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                            {meta.category}
                          </span>
                          {meta.pro && (
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              PRO
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {meta.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[11px] text-indigo-400 font-medium">
                        {isSelected ? "Sedang Digunakan" : locked ? "Kunci (Upgrade)" : "Pilih Template"}
                      </span>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
