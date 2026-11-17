import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import localFont from "next/font/local";
import { anniversary } from "@/config/anniversary";
import "./globals.css";

const macintosh = localFont({
  src: "./fonts/MacintoshSkeletalFilled.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  preload: true,
  fallback: ["Georgia", "serif"],
  adjustFontFallback: false,
  variable: "--font-macintosh-loaded",
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  preload: true,
  variable: "--font-sans-loaded",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: anniversary.title,
  description: anniversary.description,
  robots: { index: false, follow: false },
  openGraph: {
    title: anniversary.title,
    description: anniversary.description,
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4ece0" },
    { media: "(prefers-color-scheme: dark)", color: "#f4ece0" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${macintosh.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
