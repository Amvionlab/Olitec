import type { Metadata } from "next";
import { warrantyStatusPage } from "@/content/pages";
import { LegacyPage } from "@/components/legacy/ui";
import { CustomerCareBanner } from "@/components/layout/CustomerCareBanner";
import { WarrantyStatusExplorer } from "@/components/customer-care/WarrantyStatusExplorer";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Check Warranty Status by Serial Number",
  description:
    "Verify warranty coverage dates for your Olitec hybrid inverter or LFP battery by serial number and download your digital warranty certificate.",
  alternates: { canonical: "/warranty-status" },
};

export default function WarrantyStatusPage() {
  return (
    <LegacyPage>
      <BreadcrumbJsonLd
        items={[
          { name: "Customer Care", path: "/warranties/register" },
          { name: "Warranty Status", path: "/warranty-status" },
        ]}
      />
      <CustomerCareBanner current="/warranty-status" />
      <WarrantyStatusExplorer />
    </LegacyPage>
  );
}
