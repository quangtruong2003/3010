import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#e8e2d6" }}>
      <svg width="48" height="48" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path d="M8 20 32 39 56 20v28H8V20Z" fill="#f5efe4" stroke="#40586c" strokeWidth="3" strokeLinejoin="round" />
        <path d="m8 20 24 19 24-19" stroke="#be4a35" strokeWidth="4" strokeLinejoin="round" />
        <path d="M32 15c-2.1-4.8-10-4.2-10 2 0 5 10 11 10 11s10-6 10-11c0-6.2-7.9-6.8-10-2Z" fill="#be4a35" />
      </svg>
    </div>,
    { ...size }
  );
}
