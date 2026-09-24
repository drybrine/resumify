import type { Metadata } from "next";
import { Newsreader, Instrument_Sans } from "next/font/google";
import "./globals.css";

const display = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const sans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Resumify — CV ATS-friendly, bayar pakai QRIS",
    template: "%s · Resumify",
  },
  description:
    "Buat CV ATS-friendly dengan editor pratinjau langsung, 20 template siap pakai, dan ekspor PDF server-side. Gratis 1 CV, Pro Rp 49.000 lewat QRIS.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/icon", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/favicon.svg",
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://resumify-weld.vercel.app"
  ),
};

/**
 * Flips on the scroll-reveal hidden state. Runs as the first thing in <body>,
 * before anything below it paints, so there is no flash of visible-then-hidden.
 * Skipped entirely when the reader has asked for reduced motion — in that case
 * the CSS never hides anything.
 */
const MOTION_FLAG = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.dataset.motion='on'}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${display.variable} ${sans.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <script dangerouslySetInnerHTML={{ __html: MOTION_FLAG }} />
        {children}
      </body>
    </html>
  );
}
