import type { Metadata } from "next";
import { warrantyRegistrationHero } from "@/content/pages";
import { LegacyPage } from "@/components/legacy/ui";
import { CustomerCareBanner } from "@/components/layout/CustomerCareBanner";
import { WarrantyRegisterExplorer } from "@/components/customer-care/WarrantyRegisterExplorer";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Register Product Warranty | Olitec Hybrid Inverters & Batteries",
  description:
    "Activate official Olitec manufacturer warranty for your OLI-1H, OLI-3H hybrid inverter or OLB-5.12 LFP battery and download your digital certificate.",
  alternates: { canonical: "/warranties/register" },
};

export default function RegisterWarrantyPage() {
  return (
    <LegacyPage>
      <BreadcrumbJsonLd
        items={[
          { name: "Customer Care", path: "/warranties/register" },
          { name: "Register Warranty", path: "/warranties/register" },
        ]}
      />
      <CustomerCareBanner current="/warranties/register" />
      <WarrantyRegisterExplorer />
    </LegacyPage>
  );
}
