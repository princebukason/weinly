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
          borderRadius: 7,
          background: "#24483f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        {/* W mark — two strokes meeting at a terracotta dot */}
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <polyline
            points="2,4 6,17 11,8 16,17 20,4"
            stroke="white"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="11" cy="8" r="2" fill="#c9935b" />
        </svg>
      </div>
    ),
    { ...size }
  );
}