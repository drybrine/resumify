import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Favicon PNG — the printed-sheet mark: ink block, accent bar, paper rules. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 4,
          background: "#191712",
          padding: "6px 5px",
          gap: 3,
        }}
      >
        <div style={{ width: "100%", height: 4, background: "#B4311C" }} />
        <div style={{ width: "100%", height: 2, background: "#F4F1E9" }} />
        <div style={{ width: "100%", height: 2, background: "#F4F1E9", opacity: 0.7 }} />
        <div style={{ width: "60%", height: 2, background: "#F4F1E9", opacity: 0.7 }} />
      </div>
    ),
    { ...size }
  );
}
