import type { Metadata } from "next";
import { channelPartnersPage } from "@/content/pages";
import { LegacyPage } from "@/components/legacy/ui";
import { ConnectBanner } from "@/components/layout/ConnectBanner";
import { ChannelPartnersExplorer } from "@/components/connect/ChannelPartnersExplorer";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Solar Inverter & Battery Channel Partners in India",
  description:
    "Become an authorized Olitec distributor, dealer, or EPC integrator for hybrid inverters and LFP battery storage across India.",
  alternates: { canonical: "/channel-partners" },
};

export default function ChannelPartnersPage() {
  return (
    <LegacyPage>
      <BreadcrumbJsonLd items={[{ name: "Channel Partners", path: "/channel-partners" }]} />
      <ConnectBanner current="/channel-partners" />
      <ChannelPartnersExplorer />
    </LegacyPage>
  );
}
