import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SuckIt — Descarga Videos de YouTube, TikTok, Instagram y más",
  description:
    "Descarga videos de YouTube, TikTok, Instagram, X y muchas más plataformas de forma rápida y sencilla. Sin registro, gratis.",
  keywords: [
    "descargar videos",
    "youtube downloader",
    "tiktok downloader",
    "instagram downloader",
    "descargar video online",
  ],
  openGraph: {
    title: "SuckIt — Descargador de Videos Multi-Plataforma",
    description:
      "Descarga videos de YouTube, TikTok, Instagram, X y más. Rápido, gratis, sin registro.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
