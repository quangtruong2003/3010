import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { anniversary } from "@/config/anniversary";
import "./globals.css";

const macintosh = localFont({
  src: "./fonts/MacintoshSkeletalFilled.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  preload: true,
  fallback: [],
  adjustFontFallback: false,
  variable: "--font-macintosh-loaded"
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: anniversary.title,
  description: anniversary.description,
  robots: { index: false, follow: false },
  openGraph: { title: anniversary.title, description: anniversary.description, type: "website" }
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#e8e2d6" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi" className={`${macintosh.className} ${macintosh.variable}`}><body>{children}</body></html>;
}
