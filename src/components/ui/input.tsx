import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-print border border-rule-strong bg-sheet px-2.5 text-[14px] text-ink",
        "placeholder:text-ink-3/70",
        "outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-ink hover:border-ink-3",
        "focus:border-accent focus:ring-2 focus:ring-accent/25",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export function Label({
  children,
  className,
  htmlFor,
}: {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("micro mb-1.5 block", className)}>
      {children}
    </label>
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[92px] w-full resize-y rounded-print border border-rule-strong bg-sheet px-2.5 py-2 text-[14px] leading-relaxed text-ink",
        "placeholder:text-ink-3/70",
        "outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-ink hover:border-ink-3",
        "focus:border-accent focus:ring-2 focus:ring-accent/25",
        className
      )}
      {...props}
    />
  );
}

/** Small square tag used for plan/status words. */
export function Tag({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "ok" | "warn";
  className?: string;
}) {
  const tones = {
    neutral: "border-rule-strong text-ink-3",
    accent: "border-accent text-accent",
    ok: "border-ok text-ok",
    warn: "border-warn text-warn",
  };

  return (
    <span
      className={cn(
        "micro inline-flex items-center gap-1 rounded-print border px-1.5 py-0.5 text-[10px]",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
