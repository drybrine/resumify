import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "ink" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/** Squared, printed look. No gradients, no lift, no glow — hierarchy comes from weight and fill. */
const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-sheet border border-accent hover:bg-[#9c2a17] hover:border-[#9c2a17]",
  ink: "bg-ink text-sheet border border-ink hover:bg-[#000] hover:border-black",
  secondary:
    "bg-sheet text-ink border border-rule-strong hover:border-ink hover:bg-ink-veil",
  ghost:
    "bg-transparent text-ink-2 border border-transparent hover:text-ink hover:bg-ink-veil",
  danger:
    "bg-transparent text-danger border border-rule-strong hover:border-danger hover:bg-[#f7e6e4]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px]",
  md: "h-11 px-4 text-[14px]",
  lg: "h-12 px-6 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-print font-medium",
        "transition-colors duration-150 disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
