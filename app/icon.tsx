import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          background: "linear-gradient(135deg, #6366f1, #4338ca)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 900,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        W
      </div>
    ),
    { ...size }
  );
}