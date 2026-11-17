import { ImageResponse } from "next/og";
import { anniversary } from "@/config/anniversary";

export const alt = `${anniversary.title}. ${anniversary.description}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "72px 84px",
        background: "#f4ece0",
        color: "#2c231d",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ width: 560, display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "#892220",
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path
              d="M14 23 4.5 13.7C-1.2 6.4 8.4 1 14 8c5.6-7 15.2-1.6 9.5 5.7L14 23Z"
              fill="#a82d2b"
            />
          </svg>
          Gửi em yêu · Kỷ niệm 4 năm
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.2,
            color: "#892220",
          }}
        >
          <span>{anniversary.title}</span>
        </div>
        <div
          style={{
            display: "flex",
            maxWidth: 490,
            color: "#58473c",
            fontSize: 24,
            lineHeight: 1.5,
          }}
        >
          {anniversary.description}
        </div>
      </div>
      <svg width="380" height="380" viewBox="0 0 390 390" fill="none" aria-hidden="true">
        <path
          d="M42 150 195 268l153-118v180H42V150Z"
          fill="#fbf5ea"
          stroke="#892220"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        <path
          d="m195 66 153 84H42l153-84Z"
          fill="#a82d2b"
          stroke="#892220"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <circle cx="195" cy="185" r="40" fill="#a82d2b" stroke="#fbf5ea" strokeWidth="6" />
        <path
          d="M195 204l-14-13c-8-9 5-17 14-7 9-10 22-2 14 7l-14 13Z"
          fill="#fbf5ea"
        />
      </svg>
    </div>,
    { ...size }
  );
}
