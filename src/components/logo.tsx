import { cn } from "@/lib/utils";

/** Inline mark — sharp on any bg, no extra request */
export function LogoMark({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  const id = "resumify-logo";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 transition-transform duration-300 hover:scale-105", className)}
      aria-hidden
    >
      <defs>
        {/* Main Background Mesh Gradient */}
        <linearGradient
          id={`${id}-bg`}
          x1="0"
          y1="0"
          x2="64"
          y2="64"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#4F46E5" />
          <stop offset="0.5" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#EC4899" />
        </linearGradient>

        {/* Glossy Overlay */}
        <linearGradient
          id={`${id}-shine`}
          x1="0"
          y1="0"
          x2="64"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Letter 'R' Gradient */}
        <linearGradient
          id={`${id}-r-grad`}
          x1="18"
          y1="14"
          x2="46"
          y2="50"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E0E7FF" />
        </linearGradient>
      </defs>

      {/* Outer Glow Container */}
      <rect width="64" height="64" rx="18" fill={`url(#${id}-bg)`} />
      <rect width="64" height="64" rx="18" fill={`url(#${id}-shine)`} />
      
      {/* Inner Subtle Border Ring */}
      <rect
        x="1.5"
        y="1.5"
        width="61"
        height="61"
        rx="16.5"
        stroke="#ffffff"
        strokeOpacity="0.25"
        strokeWidth="1.5"
      />

      {/* Stylized Modern 'R' + Resume Paper Shape */}
      <path
        d="M20 14H35C41.6274 14 47 19.3726 47 26C47 31.8906 42.7483 36.7869 37.1121 37.7618L46.5 50H37L29 38H28V50H20V14Z"
        fill={`url(#${id}-r-grad)`}
      />
      <rect x="28" y="21" width="9" height="9" rx="2" fill="#6366F1" />

      {/* Glowing AI Sparkle Star Badge */}
      <circle cx="50" cy="14" r="7" fill="#10B981" />
      <path
        d="M50 9.5L51.2 12.8L54.5 14L51.2 15.2L50 18.5L48.8 15.2L45.5 14L48.8 12.8L50 9.5Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function Logo({
  className,
  markSize = 32,
  showWordmark = true,
  subtitle,
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
          <span className="text-[16px] font-extrabold tracking-tight text-white bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
            Resumify
          </span>
          {subtitle !== undefined ? (
            subtitle ? (
              <span className="mt-0.5 text-[10px] font-medium tracking-wider text-slate-500 uppercase">
                {subtitle}
              </span>
            ) : null
          ) : (
            <span className="mt-0.5 text-[10px] font-medium tracking-wider text-slate-500 uppercase">
              ATS Resume
            </span>
          )}
        </span>
      )}
    </span>
  );
}
