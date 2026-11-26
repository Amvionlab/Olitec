import type { Metadata } from "next";
import { downloadsPage } from "@/content/pages";
import { LegacyPage } from "@/components/legacy/ui";
import { DownloadsHub } from "@/components/downloads/DownloadsHub";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Hybrid Inverter & LFP Battery Datasheets",
  description:
    "Download PDF datasheets and technical brochures for Olitec OLI-1H, OLI-3H hybrid solar inverters and OLB-5.12 LiFePO4 battery storage packs.",
  alternates: { canonical: "/downloads" },
};

export default function DownloadsPage() {
  return (
    <LegacyPage>
      <BreadcrumbJsonLd items={[{ name: "Downloads", path: "/downloads" }]} />
      <DownloadsHub />
    </LegacyPage>
  );
}
