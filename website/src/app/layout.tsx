import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { siteConfig } from "@/lib/site";
import "./globals.css";

// Figtree stands in for the licensed Faktum typeface used in the Figma design.
const figtree = Figtree({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-figtree", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} — Clean energy for India`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.searchDescription,
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    siteName: siteConfig.name,
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/images/og-preview.jpg",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — Hybrid inverters and energy storage systems for India`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og-preview.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#f99f1e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // data-scroll-behavior: keeps smooth scrolling for in-page links (#about, #faq) but not during page changes.
  return (
    <html lang="en" className={figtree.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
