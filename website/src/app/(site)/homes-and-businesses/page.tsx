/** Homes and businesses — from the Olitec HTML design (Olitec-Website/homes-and-businesses.html). */
import type { Metadata } from "next";
import { companyContact, connectNav, homesPage } from "@/content/pages";
import { EnquiryForm } from "@/components/legacy/EnquiryForm";
import { FeatureCard, LegacyCard, LegacyPage, PageHero, Section, SectionHeading, headingFont } from "@/components/legacy/ui";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "For homes and businesses",
  description: homesPage.lead,
  alternates: { canonical: "/homes-and-businesses" },
};

export default function HomesAndBusinessesPage() {
  return (
    <LegacyPage>
      <PageHero art="hero"
        eyebrow={homesPage.eyebrow}
        title={homesPage.title}
        lead={homesPage.lead}
        subnav={connectNav}
        current="/homes-and-businesses"
      />

      <Section>
        <div className="reveal-on-scroll">
          <SectionHeading className="mb-9">How it works</SectionHeading>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {homesPage.steps.map((item, index) => (
            <div key={item.title} className={cn("reveal-on-scroll", `reveal-delay-${(index % 4) + 1}`)}>
              <FeatureCard step={`Step ${index + 1}`} {...item} />
            </div>
          ))}
        </div>
      </Section>

      <Section muted>
        <div className="reveal-on-scroll flex flex-wrap items-start gap-12">
          <div className="min-w-0 flex-[1.6_1_520px]">
            <SectionHeading className="mb-6">Request a consultation</SectionHeading>
            <EnquiryForm kind="consultation" />
          </div>
          <aside className="min-w-0 flex-[1_1_280px]">
            <LegacyCard className="bg-[rgb(230_230_230/0.4)]">
              <h3 className={cn(headingFont, "mb-2.5 text-[20px] font-semibold")}>Talk to us directly</h3>
              {companyContact.phones.map((phone, i) => (
                <p key={phone} className={cn("font-semibold text-black", i === 0 ? "mb-1.5" : "mb-4")}>
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-brand-600">
                    {phone}
                  </a>
                </p>
              ))}
              <p className="text-base">{companyContact.addressLines.join(" ")}</p>
            </LegacyCard>
          </aside>
        </div>
      </Section>
    </LegacyPage>
  );
}
