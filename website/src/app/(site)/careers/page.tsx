import type { Metadata } from "next";
import { careersPage } from "@/content/pages";
import { LegacyPage } from "@/components/legacy/ui";
import { ConnectBanner } from "@/components/layout/ConnectBanner";
import { CareersExplorer } from "@/components/connect/CareersExplorer";

export const metadata: Metadata = {
  title: "Careers",
  description: careersPage.lead,
  alternates: { canonical: "/careers" },
};

export default function CareersPage() {
  return (
    <LegacyPage>
      <ConnectBanner current="/careers" />
      <CareersExplorer />
    </LegacyPage>
  );
}
