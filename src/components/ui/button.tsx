import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30 active:scale-[0.98]",
  secondary: "glass-card hover:bg-slate-800/80 text-slate-100 border-slate-700/60 active:scale-[0.98]",
  ghost: "bg-transparent hover:bg-slate-800/50 text-slate-300 hover:text-white active:scale-[0.98]",
  danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 active:scale-[0.98]",
  outline:
    "bg-slate-900/40 border border-slate-700/80 hover:border-indigo-500/60 hover:bg-indigo-500/10 hover:text-indigo-200 text-slate-300 active:scale-[0.98]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-xs rounded-lg font-medium",
  md: "h-11 px-5 text-sm rounded-xl font-medium",
  lg: "h-13 px-7 text-base rounded-xl font-semibold",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
