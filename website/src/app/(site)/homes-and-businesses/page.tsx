import type { Metadata } from "next";
import { homesPage } from "@/content/pages";
import { LegacyPage } from "@/components/legacy/ui";
import { ConnectBanner } from "@/components/layout/ConnectBanner";
import { ConnectPage } from "@/components/connect/ConnectPage";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Solar Hybrid Inverter & Battery Backup for Homes & Businesses",
  description:
    "Plan a solar inverter and 5.12 kWh LFP battery backup system for your home, clinic, shop, or factory with authorized Olitec engineers.",
  alternates: { canonical: "/homes-and-businesses" },
};

export default function HomesAndBusinessesPage() {
  return (
    <LegacyPage>
      <BreadcrumbJsonLd items={[{ name: "Homes & Businesses", path: "/homes-and-businesses" }]} />
      <ConnectBanner current="/homes-and-businesses" />
      <ConnectPage variant="consultation" />
    </LegacyPage>
  );
}
