import type { Metadata } from "next";
import { warrantyRegistrationHero } from "@/content/pages";
import { LegacyPage } from "@/components/legacy/ui";
import { CustomerCareBanner } from "@/components/layout/CustomerCareBanner";
import { WarrantyRegisterExplorer } from "@/components/customer-care/WarrantyRegisterExplorer";

export const metadata: Metadata = {
  title: "Register your warranty",
  description: warrantyRegistrationHero.lead,
  alternates: { canonical: "/warranties/register" },
};

export default function RegisterWarrantyPage() {
  return (
    <LegacyPage>
      <CustomerCareBanner current="/warranties/register" />
      <WarrantyRegisterExplorer />
    </LegacyPage>
  );
}
