import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

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
            "linear-gradient(135deg, #6366F1 0%, #7C3AED 55%, #A855F7 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 90,
            height: 112,
            background: "rgba(255,255,255,0.96)",
            borderRadius: 12,
            padding: "18px 14px",
          }}
        >
          <div
            style={{
              width: 44,
              height: 10,
              background: "#4F46E5",
              borderRadius: 5,
              marginBottom: 14,
            }}
          />
          <div
            style={{
              width: 56,
              height: 6,
              background: "#A5B4FC",
              borderRadius: 3,
              marginBottom: 8,
            }}
          />
          <div
            style={{
              width: 50,
              height: 6,
              background: "#C7D2FE",
              borderRadius: 3,
              marginBottom: 8,
            }}
          />
          <div
            style={{
              width: 40,
              height: 6,
              background: "#C7D2FE",
              borderRadius: 3,
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            right: 36,
            bottom: 36,
            width: 44,
            height: 44,
            borderRadius: 999,
            background: "#10B981",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
