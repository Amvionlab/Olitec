import type { Metadata } from "next";
import { careersPage } from "@/content/pages";
import { LegacyPage } from "@/components/legacy/ui";
import { ConnectBanner } from "@/components/layout/ConnectBanner";
import { ConnectPage } from "@/components/connect/ConnectPage";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Careers in Clean Energy & Power Electronics",
  description:
    "Join Olitec in power electronics R&D, manufacturing in Vellore, project engineering, sales, and field service across India.",
  alternates: { canonical: "/careers" },
};

export default function CareersPage() {
  return (
    <LegacyPage>
      <BreadcrumbJsonLd items={[{ name: "Careers", path: "/careers" }]} />
      <ConnectBanner current="/careers" />
      <ConnectPage variant="career" />
    </LegacyPage>
  );
}
