import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Favicon PNG — matches LogoMark (R + sparkle) */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          background:
            "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#fff",
            fontSize: 18,
            fontWeight: 800,
            fontFamily: "system-ui, sans-serif",
            lineHeight: 1,
            marginTop: -1,
          }}
        >
          R
        </div>
        <div
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            width: 8,
            height: 8,
            borderRadius: 999,
            background: "#10B981",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
