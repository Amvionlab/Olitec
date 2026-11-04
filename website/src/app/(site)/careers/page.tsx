/** Careers — from the Olitec HTML design (Olitec-Website/careers.html). */
import type { Metadata } from "next";
import { careersPage, connectNav } from "@/content/pages";
import { EnquiryForm } from "@/components/legacy/EnquiryForm";
import { BulletList, FeatureCard, LegacyPage, PageHero, Section, SectionHeading } from "@/components/legacy/ui";

export const metadata: Metadata = {
  title: "Careers",
  description: careersPage.lead,
  alternates: { canonical: "/careers" },
};

export default function CareersPage() {
  return (
    <LegacyPage>
      <PageHero art="groundMount" eyebrow={careersPage.eyebrow} title={careersPage.title} lead={careersPage.lead} subnav={connectNav} current="/careers" />

      <Section>
        <SectionHeading>{careersPage.areasTitle}</SectionHeading>
        <p className="mb-9 max-w-[720px] text-[19px]">{careersPage.areasLead}</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {careersPage.areas.map((item) => (
            <FeatureCard key={item.title} {...item} />
          ))}
        </div>
      </Section>

      <Section muted>
        <div className="flex flex-wrap items-start gap-12">
          <div className="min-w-0 flex-[1_1_300px]">
            <SectionHeading>Why join Olitec</SectionHeading>
            <BulletList items={careersPage.why} />
            <p className="mt-6 text-base">{careersPage.openings}</p>
          </div>
          <div className="min-w-0 flex-[1.6_1_520px]">
            <EnquiryForm kind="career" />
          </div>
        </div>
      </Section>
    </LegacyPage>
  );
}
