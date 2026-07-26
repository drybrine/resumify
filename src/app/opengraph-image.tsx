import { ImageResponse } from "next/og";

export const alt = "CV Builder — ATS Resume SaaS";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "#070a12",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 480,
            height: 480,
            borderRadius: 999,
            background: "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "linear-gradient(135deg, #6366F1, #A855F7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            CV
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span style={{ color: "#F8FAFC", fontSize: 36, fontWeight: 700 }}>
              CV Builder
            </span>
            <span
              style={{
                color: "#64748B",
                fontSize: 16,
                letterSpacing: 2,
                marginTop: 4,
              }}
            >
              ATS RESUME · INDONESIA
            </span>
          </div>
        </div>
        <div
          style={{
            color: "#F1F5F9",
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: 900,
          }}
        >
          Buat CV ATS-friendly, bayar QRIS.
        </div>
        <div
          style={{
            marginTop: 24,
            color: "#94A3B8",
            fontSize: 24,
            maxWidth: 720,
          }}
        >
          Live preview · multi template · cloud save · share link
        </div>
      </div>
    ),
    { ...size }
  );
}
