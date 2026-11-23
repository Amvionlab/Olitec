import type { Metadata } from "next";
import { homesPage } from "@/content/pages";
import { LegacyPage } from "@/components/legacy/ui";
import { ConnectBanner } from "@/components/layout/ConnectBanner";
import { HomesBusinessesExplorer } from "@/components/connect/HomesBusinessesExplorer";

export const metadata: Metadata = {
  title: "For homes and businesses",
  description: homesPage.lead,
  alternates: { canonical: "/homes-and-businesses" },
};

export default function HomesAndBusinessesPage() {
  return (
    <LegacyPage>
      <ConnectBanner current="/homes-and-businesses" />
      <HomesBusinessesExplorer />
    </LegacyPage>
  );
}
