import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  tone = "default",
  variant,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "pro" | "ok" | "warn";
  variant?: "default" | "secondary" | "outline" | "destructive";
}) {
  const tones = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    pro: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    ok: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    warn: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  };

  const variants = {
    default: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    secondary: "bg-white/10 text-slate-300 border-transparent",
    outline: "border-slate-700 bg-white/5 text-slate-300",
    destructive: "bg-red-500/15 text-red-300 border-red-500/30",
  };

  const activeStyle = variant ? variants[variant] : tones[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        activeStyle,
        className
      )}
    >
      {children}
    </span>
  );
}
