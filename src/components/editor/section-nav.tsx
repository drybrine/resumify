"use client";

import { cn } from "@/lib/utils";
import {
  User,
  FileText,
  GraduationCap,
  Briefcase,
  FolderGit2,
  BookOpen,
  Wrench,
  Languages,
} from "lucide-react";

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  personal: User,
  summary: FileText,
  education: GraduationCap,
  experience: Briefcase,
  projects: FolderGit2,
  publications: BookOpen,
  skills: Wrench,
  languages: Languages,
};

export function SectionNav({
  sections,
  active,
  onChange,
}: {
  sections: readonly string[];
  active: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="shrink-0 border-b border-white/10 bg-slate-950/80 p-2 backdrop-blur-xl relative">
      <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
        {sections.map((s) => {
          const Icon = SECTION_ICONS[s] || FileText;
          const isActive = active === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className={cn(
                "relative group flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold capitalize whitespace-nowrap transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/40 scale-[1.02]"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-400"
                )}
              />
              <span>{s}</span>
              {isActive && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-1 bg-indigo-400 rounded-full blur-[1px]"></span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
