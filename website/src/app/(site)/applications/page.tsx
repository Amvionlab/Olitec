/** Applications — from the Olitec HTML design (Olitec-Website/applications.html) & Item M11. */
import type { Metadata } from "next";
import { applicationsPage } from "@/content/pages";
import { CtaPanel, LegacyPage } from "@/components/legacy/ui";
import { SlimPageBanner } from "@/components/layout/SlimPageBanner";
import { ApplicationExplorer } from "@/components/applications/ApplicationExplorer";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Solar Inverter with Battery Backup Applications in India",
  description:
    "Explore Olitec hybrid inverter and LFP energy storage deployments for Indian homes, clinics, telecom and rural microgrids, farms, defence outposts, and commercial factories.",
  alternates: { canonical: "/applications" },
};

export default function ApplicationsPage() {
  const { cta } = applicationsPage;
  return (
    <LegacyPage>
      <BreadcrumbJsonLd items={[{ name: "Applications", path: "/applications" }]} />

      {/* 1. Slim Page Banner with burnt orange accent */}
      <SlimPageBanner
        title="Built for the places India needs power most"
        accentWords="needs power most"
        lead="Choose an application to see how solar, storage and backup work together."
      />

      {/* 2. Six pills and one details panel with the live diagram (Item M11) */}
      <section className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-6 sm:px-8 xl:px-12">
        <ApplicationExplorer />
      </section>

      {/* 4. Bottom CTA Section */}
      <CtaPanel
          title={cta.title}
          body={cta.body}
          primary={cta.action}
          secondary={{ href: "/channel-partners", label: "Become a partner" }}
        />
    </LegacyPage>
  );
}
