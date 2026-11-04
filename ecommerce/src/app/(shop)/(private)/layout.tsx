import type { Metadata } from "next";

// Cart, checkout, account and sign-in pages are personal: never indexed (also sent as X-Robots-Tag in next.config.ts).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
