import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — same mark, full bleed (iOS applies its own mask). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#191712",
          padding: "34px 30px",
          gap: 14,
        }}
      >
        <div style={{ width: "100%", height: 14, background: "#B4311C" }} />
        <div style={{ width: "100%", height: 8, background: "#F4F1E9" }} />
        <div style={{ width: "100%", height: 8, background: "#F4F1E9", opacity: 0.7 }} />
        <div style={{ width: "62%", height: 8, background: "#F4F1E9", opacity: 0.7 }} />
        <div style={{ width: "100%", height: 8, background: "#F4F1E9", opacity: 0.45 }} />
      </div>
    ),
    { ...size }
  );
}
