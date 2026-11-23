import type { Metadata } from "next";
import { channelPartnersPage } from "@/content/pages";
import { LegacyPage } from "@/components/legacy/ui";
import { ConnectBanner } from "@/components/layout/ConnectBanner";
import { ChannelPartnersExplorer } from "@/components/connect/ChannelPartnersExplorer";

export const metadata: Metadata = {
  title: "Channel partners",
  description: channelPartnersPage.lead,
  alternates: { canonical: "/channel-partners" },
};

export default function ChannelPartnersPage() {
  return (
    <LegacyPage>
      <ConnectBanner current="/channel-partners" />
      <ChannelPartnersExplorer />
    </LegacyPage>
  );
}
