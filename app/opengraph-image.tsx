import { ImageResponse } from "next/og";

export const alt = "Gửi Bo — 4 năm bên nhau";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#09090b", color: "#f4f0f6", position: "relative", fontFamily: "serif" }}>
      <div style={{ position: "absolute", inset: 28, border: "1px solid rgba(244,182,200,.28)", display: "flex" }} />
      <div style={{ display: "flex", color: "#ec8fab", fontSize: 24, letterSpacing: 10, textTransform: "uppercase" }}>Một hành trình · Một người thương</div>
      <div style={{ display: "flex", fontSize: 160, lineHeight: 1, marginTop: 22, background: "linear-gradient(120deg,#f9dbe5,#ec8fab,#c0587c)", backgroundClip: "text", color: "transparent" }}>4</div>
      <div style={{ display: "flex", fontSize: 56, fontStyle: "italic", marginTop: 8 }}>năm bên nhau</div>
      <div style={{ display: "flex", fontSize: 46, color: "#f4b6c8", marginTop: 18 }}>Trường <span style={{ margin: "0 18px", color: "#8d8896" }}>×</span> Bo</div>
      <div style={{ display: "flex", fontSize: 20, letterSpacing: 8, color: "#bdb8c4", marginTop: 24 }}>30 · 10 · 2022 — 30 · 10 · 2026</div>
    </div>,
    { ...size }
  );
}