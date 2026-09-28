import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Only meaningful over HTTPS. Emitting a `preload` directive from a local or dev
  // origin is a footgun: it forces every other project on that host to HTTPS too.
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // The PDF route drives puppeteer-core, and on serverless it unpacks the
  // @sparticuz/chromium binary at runtime. Both must stay external: when they get
  // bundled, the Chromium archives are never traced into the function, so export
  // dies on every deploy with "browser could not be launched".
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  outputFileTracingIncludes: {
    // Keys are picomatch globs against the route path, so the dynamic segment has
    // to be escaped — an unescaped `[id]` is a character class, not a route part.
    "/api/cvs/\\[id\\]/pdf": [
      "./node_modules/@sparticuz/chromium/bin/**",
      "./node_modules/@sparticuz/chromium/build/**",
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
