/** Applications — from the Olitec HTML design (Olitec-Website/applications.html) & Item M11. */
import type { Metadata } from "next";
import { applicationsPage } from "@/content/pages";
import { CtaPanel, LegacyPage, Section } from "@/components/legacy/ui";
import { SlimPageBanner } from "@/components/layout/SlimPageBanner";
import { InteractiveApplicationExplorer } from "@/components/applications/InteractiveApplicationExplorer";

export const metadata: Metadata = {
  title: "Applications",
  description: applicationsPage.lead,
  alternates: { canonical: "/applications" },
};

export default function ApplicationsPage() {
  const { cta } = applicationsPage;
  return (
    <LegacyPage>
      {/* 1. Slim Page Banner with burnt orange accent */}
      <SlimPageBanner
        title="Built for the places India needs power most"
        accentWords="needs power most"
        lead="Choose an application to see how solar, storage and backup work together."
      />

      {/* 2. Unified Master Details Panel with 6-pill selector & live animated power flow */}
      <Section innerClassName="pt-8 pb-16">
        <InteractiveApplicationExplorer />
      </Section>

      {/* 3. Bottom CTA Section */}
      <div className="reveal-on-scroll">
        <CtaPanel
          title={cta.title}
          body={cta.body}
          primary={cta.action}
          secondary={{ href: "/channel-partners", label: "Become a partner" }}
        />
      </div>
    </LegacyPage>
  );
}
