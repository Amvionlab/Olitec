/** Downloads — datasheets and brochures. */
import type { Metadata } from "next";
import { downloadsPage } from "@/content/pages";
import { LegacyPage, PageHero, Section } from "@/components/legacy/ui";
import { DownloadsHub } from "@/components/downloads/DownloadsHub";

export const metadata: Metadata = {
  title: "Downloads & Technical Documentation · Olitec",
  description: downloadsPage.lead,
  alternates: { canonical: "/downloads" },
};

export default function DownloadsPage() {
  return (
    <LegacyPage>
      <PageHero
        art="synergy"
        eyebrow={downloadsPage.eyebrow}
        title={downloadsPage.title}
        lead={downloadsPage.lead}
      />

      <Section className="py-12 sm:py-16">
        <DownloadsHub />
      </Section>
    </LegacyPage>
  );
}
