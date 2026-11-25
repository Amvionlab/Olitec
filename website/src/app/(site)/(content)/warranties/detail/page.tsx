import type { Metadata } from "next";
import WarrantyDetailClient from "@/components/warranties/WarrantyDetailClient";
export const metadata: Metadata = {
  title: "Warranty details",
  robots: {
    index: false,
  },
};

export default function WarrantyDetailPage() {
  return <WarrantyDetailClient />;
}