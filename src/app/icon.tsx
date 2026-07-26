import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

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
            "linear-gradient(135deg, #6366F1 0%, #7C3AED 55%, #A855F7 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 16,
            height: 20,
            background: "#fff",
            borderRadius: 2,
            padding: "3px 2px",
          }}
        >
          <div
            style={{
              width: 8,
              height: 2,
              background: "#4F46E5",
              borderRadius: 1,
              marginBottom: 2,
            }}
          />
          <div
            style={{
              width: 10,
              height: 1.5,
              background: "#A5B4FC",
              borderRadius: 1,
              marginBottom: 1.5,
            }}
          />
          <div
            style={{
              width: 9,
              height: 1.5,
              background: "#C7D2FE",
              borderRadius: 1,
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            right: 2,
            bottom: 2,
            width: 11,
            height: 11,
            borderRadius: 999,
            background: "#10B981",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
