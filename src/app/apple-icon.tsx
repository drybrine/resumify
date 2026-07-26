import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — matches LogoMark */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
          background:
            "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#fff",
            fontSize: 100,
            fontWeight: 800,
            fontFamily: "system-ui, sans-serif",
            lineHeight: 1,
          }}
        >
          R
        </div>
        <div
          style={{
            position: "absolute",
            top: 28,
            right: 28,
            width: 36,
            height: 36,
            borderRadius: 999,
            background: "#10B981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          ✦
        </div>
      </div>
    ),
    { ...size }
  );
}
