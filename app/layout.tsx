import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Be_Vietnam_Pro, Great_Vibes } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const display = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin", "vietnamese"], style: ["normal", "italic"], weight: ["300", "400", "500", "600", "700"], display: "swap" });
const body = Be_Vietnam_Pro({ variable: "--font-be-vietnam", subsets: ["latin", "vietnamese"], weight: ["300", "400", "500", "600"], display: "swap" });
const script = Great_Vibes({ variable: "--font-great-vibes", subsets: ["latin", "vietnamese"], weight: "400", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Gửi Bo — 4 năm bên nhau",
  description: "Một bức thư tình viết trong cung điện đêm. 30.10.2022 — 30.10.2026.",
  robots: { index: false, follow: false },
  openGraph: { title: "Gửi Bo — 4 năm bên nhau", description: "4 năm — và anh vẫn chọn em, mỗi ngày.", type: "website" }
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#09090b" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi" className={`${display.variable} ${body.variable} ${script.variable}`}><body>{children}<Toaster position="top-center" theme="dark" richColors /></body></html>;
}