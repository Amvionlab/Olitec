import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { StoreProvider } from "@/store/StoreProvider";
import { SITE_URL } from "@/utils/format";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-figtree", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "OLITEC Shop — Solar panels, inverters and batteries", template: "%s | OLITEC Shop" },
  description: "Buy solar panels, inverters, batteries and accessories online from OLITEC.",
  openGraph: { siteName: "OLITEC Shop", type: "website", locale: "en_IN" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#f99f1e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={figtree.variable} suppressHydrationWarning>
      <body className="min-h-screen font-sans" suppressHydrationWarning>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
