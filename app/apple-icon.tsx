import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 36, background: "#09090b", border: "3px solid #ec8fab", color: "#f4b6c8", fontFamily: "serif", fontSize: 100 }}>B</div>,
    { ...size }
  );
}