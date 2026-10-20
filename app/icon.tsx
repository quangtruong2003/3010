import { ImageResponse } from "next/og";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export default function Icon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "#09090b", border: "2px solid #ec8fab", color: "#f4b6c8", fontFamily: "serif", fontSize: 42 }}>B</div>,
    { ...size }
  );
}