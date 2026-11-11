import type { Metadata, Viewport } from "next";
import { Figtree, Manrope } from "next/font/google";
import { siteConfig } from "@/lib/site";
import "./globals.css";

// Figtree stands in for the licensed Faktum typeface used in the Figma design.
const figtree = Figtree({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-figtree", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} — Clean energy for India`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  openGraph: { siteName: siteConfig.name, type: "website", locale: "en_IN" },
};

export const viewport: Viewport = {
  themeColor: "#f99f1e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // data-scroll-behavior: keeps smooth scrolling for in-page links (#about, #faq) but not during page changes.
  return (
    <html lang="en" className={`${figtree.variable} ${manrope.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
