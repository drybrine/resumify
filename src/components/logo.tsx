import { cn } from "@/lib/utils";

/**
 * Wordmark mark: a printed sheet — solid ink block, three paper rules, one
 * accent bar. Reads at 16px in a favicon and needs no gradients.
 */
export function LogoMark({
  className,
  size = 30,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size * (32 / 26)}
      viewBox="0 0 26 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect x="0.5" y="0.5" width="25" height="31" rx="2.5" fill="#191712" />
      <rect x="0.5" y="0.5" width="25" height="31" rx="2.5" stroke="#191712" />
      <rect x="5" y="6" width="16" height="2.6" fill="#B4311C" />
      <rect x="5" y="12.5" width="16" height="1.5" fill="#F4F1E9" />
      <rect x="5" y="17" width="16" height="1.5" fill="#F4F1E9" opacity="0.72" />
      <rect x="5" y="21.5" width="10.5" height="1.5" fill="#F4F1E9" opacity="0.72" />
      <rect x="5" y="26" width="16" height="1.5" fill="#F4F1E9" opacity="0.45" />
    </svg>
  );
}

export function Logo({
  className,
  markSize = 26,
  showWordmark = true,
  subtitle = "CV Studio",
}: {
  className?: string;
  markSize?: number;
  showWordmark?: boolean;
  subtitle?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={markSize} />
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[19px] font-semibold tracking-[-0.01em] text-ink">
            Resumify
          </span>
          {subtitle ? (
            <span className="micro mt-1 text-[10px] normal-case tracking-[0.08em]">
              {subtitle}
            </span>
          ) : null}
        </span>
      )}
    </span>
  );
}
