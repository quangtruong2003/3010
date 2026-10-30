import { ImageResponse } from "next/og";
import { anniversary } from "@/config/anniversary";

export const alt = `${anniversary.title}. ${anniversary.description}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "72px 84px", background: "#e8e2d6", color: "#342c26", fontFamily: "sans-serif" }}>
      <div style={{ width: 540, display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#873628", fontSize: 22, fontWeight: 600 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M14 23 4.5 13.7C-1.2 6.4 8.4 1 14 8c5.6-7 15.2-1.6 9.5 5.7L14 23Z" fill="#be4a35" /></svg>
          Gửi em yêu
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 54, fontWeight: 700, lineHeight: 1.22 }}>
          <span>{anniversary.title}</span>
        </div>
        <div style={{ display: "flex", maxWidth: 480, color: "#625349", fontSize: 23, lineHeight: 1.5 }}>
          {anniversary.description}
        </div>
      </div>
      <svg width="390" height="390" viewBox="0 0 390 390" fill="none" aria-hidden="true">
        <path d="M42 150 195 268l153-118v180H42V150Z" fill="#f5efe4" stroke="#40586c" strokeWidth="8" strokeLinejoin="round" />
        <path d="M42 150 195 268l153-118" stroke="#be4a35" strokeWidth="13" strokeLinejoin="round" />
        <path d="m195 66 118 80H77l118-80Z" fill="#be4a35" />
        <path d="M177 137c-1.5-19-31-20-31 2 0 19 49 47 49 47s49-28 49-47c0-22-29.5-21-31-2-6-13-30-13-36 0Z" fill="#c1934b" />
        <circle cx="195" cy="143" r="48" stroke="#f5efe4" strokeWidth="6" />
        <path d="M42 150 195 268l153-118" stroke="#40586c" strokeWidth="8" strokeLinejoin="round" />
      </svg>
    </div>,
    { ...size }
  );
}
