import { cn } from "@/lib/utils";

type Tone = "default" | "pro" | "ok" | "warn" | "danger";

/**
 * Backwards-compatible status badge, restyled to the print system:
 * a squared hairline tag in micro caps instead of a glowing pill.
 */
export function Badge({
  children,
  className,
  tone = "default",
  variant,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: Tone;
  variant?: "default" | "secondary" | "outline" | "destructive";
}) {
  const tones: Record<Tone, string> = {
    default: "border-rule-strong text-ink-3",
    pro: "border-accent text-accent",
    ok: "border-ok text-ok",
    warn: "border-warn text-warn",
    danger: "border-danger text-danger",
  };

  const variants: Record<string, string> = {
    default: tones.default,
    secondary: "border-rule text-ink-3",
    outline: "border-rule-strong text-ink-2",
    destructive: tones.danger,
  };

  return (
    <span
      className={cn(
        "micro inline-flex items-center rounded-print border px-1.5 py-0.5 text-[10px]",
        variant ? variants[variant] : tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
