import { ImageResponse } from "next/og";

export const alt = "Resumify — CV ATS-friendly, bayar pakai QRIS";
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
          justifyContent: "space-between",
          padding: 72,
          background: "#F4F1E9",
        }}
      >
        {/* masthead */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 40,
              height: 50,
              display: "flex",
              flexDirection: "column",
              background: "#191712",
              padding: "8px 7px",
              gap: 5,
              borderRadius: 3,
            }}
          >
            <div style={{ width: "100%", height: 6, background: "#B4311C" }} />
            <div style={{ width: "100%", height: 3, background: "#F4F1E9" }} />
            <div style={{ width: "100%", height: 3, background: "#F4F1E9", opacity: 0.7 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "#191712", fontSize: 30, fontWeight: 600 }}>
              Resumify
            </span>
            <span
              style={{
                color: "#6B6455",
                fontSize: 15,
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              CV Studio · Indonesia
            </span>
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ width: 72, height: 4, background: "#B4311C" }} />
          <div
            style={{
              color: "#191712",
              fontSize: 62,
              fontWeight: 600,
              lineHeight: 1.12,
              marginTop: 28,
              maxWidth: 900,
            }}
          >
            CV rapi satu halaman, siap dikirim hari ini.
          </div>
          <div
            style={{
              color: "#575143",
              fontSize: 24,
              marginTop: 24,
              maxWidth: 820,
            }}
          >
            12 template ATS · pratinjau langsung · ekspor PDF di server · simpan
            cloud
          </div>
        </div>

        {/* footer rule */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid #DFD9CB",
            paddingTop: 20,
            color: "#6B6455",
            fontSize: 20,
          }}
        >
          <span>Gratis 1 CV · Pro Rp 49.000 / 30 hari</span>
          <span>Bayar lewat QRIS</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
