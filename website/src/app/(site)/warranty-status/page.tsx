import type { Metadata } from "next";
import { warrantyStatusPage } from "@/content/pages";
import { LegacyPage } from "@/components/legacy/ui";
import { CustomerCareBanner } from "@/components/layout/CustomerCareBanner";
import { WarrantyStatusExplorer } from "@/components/customer-care/WarrantyStatusExplorer";

export const metadata: Metadata = {
  title: "Check warranty status",
  description: warrantyStatusPage.lead,
  alternates: { canonical: "/warranty-status" },
};

export default function WarrantyStatusPage() {
  return (
    <LegacyPage>
      <CustomerCareBanner current="/warranty-status" />
      <WarrantyStatusExplorer />
    </LegacyPage>
  );
}
