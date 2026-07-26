"use client";

import { useEffect, useState } from "react";
import { User, Sparkles, Check, RefreshCw } from "lucide-react";

const DEMO_STEPS = [
  { name: "Surya Alamsyah", role: "Senior Software Engineer", loc: "Bandung, ID" },
  { name: "Surya Alamsyah P. P.", role: "IoT & Fullstack Developer", loc: "Bandung, Indonesia" },
  { name: "Alex Pratama", role: "Lead Systems Architect", loc: "Jakarta, Indonesia" },
];

export function HeroInteractiveDemo() {
  const [stepIdx, setStepIdx] = useState(0);
  const [typedName, setTypedName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const currentStep = DEMO_STEPS[stepIdx];

  useEffect(() => {
    const targetText = currentStep.name;
    let timer: NodeJS.Timeout;

    if (!isDeleting && typedName.length < targetText.length) {
      timer = setTimeout(() => {
        setTypedName(targetText.slice(0, typedName.length + 1));
      }, 70);
    } else if (!isDeleting && typedName.length === targetText.length) {
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 2500);
    } else if (isDeleting && typedName.length > 0) {
      timer = setTimeout(() => {
        setTypedName(targetText.slice(0, typedName.length - 1));
      }, 40);
    } else if (isDeleting && typedName.length === 0) {
      setIsDeleting(false);
      setStepIdx((prev) => (prev + 1) % DEMO_STEPS.length);
    }

    return () => clearTimeout(timer);
  }, [typedName, isDeleting, currentStep]);

  return (
    <div className="mt-16 sm:mt-20 relative mx-auto max-w-5xl">
      <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-25 blur-2xl animate-pulse-glow"></div>
      
      <div className="relative rounded-2xl border border-white/15 bg-slate-950/90 shadow-2xl backdrop-blur-2xl overflow-hidden">
        {/* Browser Top Window Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
            <div className="h-3 w-3 rounded-full bg-amber-500/80"></div>
            <div className="h-3 w-3 rounded-full bg-emerald-500/80"></div>
            <span className="ml-3 text-xs text-slate-400 font-mono flex items-center gap-1.5 bg-slate-950/60 px-3 py-1 rounded-md border border-white/5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              https://cv-builder.app/editor/live-demo
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-indigo-300 font-semibold bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
            <span>Interactive Realtime Sync Demo</span>
          </div>
        </div>

        {/* Editor Split Canvas */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
          {/* Left Simulation Form */}
          <div className="md:col-span-5 border-r border-white/10 bg-slate-950/50 p-5 text-left space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <User className="h-4 w-4 text-indigo-400" />
                <span>Personal Information</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Typing...
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400">Full Name</label>
                <div className="mt-1 relative flex items-center">
                  <input
                    readOnly
                    value={typedName}
                    className="w-full rounded-xl border border-indigo-500/50 bg-slate-900 px-3 py-2 text-xs font-semibold text-white outline-none ring-2 ring-indigo-500/30"
                  />
                  <span className="absolute right-3 h-4 w-0.5 bg-indigo-400 animate-pulse"></span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400">Job Title / Role</label>
                <input
                  readOnly
                  value={currentStep.role}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400">Location</label>
                <input
                  readOnly
                  value={currentStep.loc}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-[11px] text-indigo-300 flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>Changes save automatically to cloud in 900ms</span>
              </div>
            </div>
          </div>

          {/* Right Live Preview Sheet */}
          <div className="md:col-span-7 bg-slate-900/70 p-6 flex flex-col justify-between text-left relative overflow-hidden">
            <div className="absolute top-3 right-3 text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded border border-white/10 flex items-center gap-1.5">
              <RefreshCw className="h-3 w-3 text-indigo-400 animate-spin" />
              <span>Preview (Jake ATS Template)</span>
            </div>

            {/* Simulated Paper Document */}
            <div className="bg-white text-slate-900 rounded-lg p-6 shadow-2xl border border-slate-200 min-h-[300px] mt-4 font-serif transition-all duration-300">
              <div className="text-center border-b border-slate-900 pb-3 mb-4">
                <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900 min-h-[28px]">
                  {typedName || <span className="opacity-0">A</span>}
                </h1>
                <p className="text-xs text-slate-600 font-sans mt-1">
                  {currentStep.loc} • {currentStep.role} • github.com/drybrine
                </p>
              </div>

              <div className="space-y-3 text-left font-sans text-xs">
                <div>
                  <h2 className="font-bold text-[11px] uppercase tracking-wider border-b border-slate-300 pb-0.5 mb-1.5 text-slate-900 font-serif">
                    Professional Experience
                  </h2>
                  <div className="flex justify-between font-bold">
                    <span>{currentStep.role}</span>
                    <span className="text-slate-500">2022 — Present</span>
                  </div>
                  <p className="text-[11px] text-slate-600 italic">Leading Tech Solutions Ltd.</p>
                  <ul className="list-disc ml-4 mt-1 text-[11px] text-slate-700 space-y-0.5">
                    <li>Architected scalable Next.js applications and cloud serverless pipelines.</li>
                    <li>Improved ATS parsing rates by 95% using structured typography formats.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="font-bold text-[11px] uppercase tracking-wider border-b border-slate-300 pb-0.5 mb-1 text-slate-900 font-serif">
                    Skills & Competencies
                  </h2>
                  <p className="text-[11px] text-slate-700">
                    <strong className="font-semibold text-slate-900">Languages:</strong> TypeScript, JavaScript, Python, C++
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}