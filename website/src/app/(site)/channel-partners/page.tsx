/** Channel partners — from the Olitec HTML design (Olitec-Website/channel-partners.html). */
import type { Metadata } from "next";
import { channelPartnersPage, connectNav } from "@/content/pages";
import { EnquiryForm } from "@/components/legacy/EnquiryForm";
import { BulletList, FeatureCard, IconTile, LegacyPage, PageHero, Section, SectionHeading, headingFont } from "@/components/legacy/ui";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Channel partners",
  description: channelPartnersPage.lead,
  alternates: { canonical: "/channel-partners" },
};

export default function ChannelPartnersPage() {
  const { partnerTypes, benefits, steps } = channelPartnersPage;
  return (
    <LegacyPage>
      <PageHero art="values"
        eyebrow={channelPartnersPage.eyebrow}
        title={channelPartnersPage.title}
        lead={channelPartnersPage.lead}
        subnav={connectNav}
        current="/channel-partners"
      />

      <Section>
        <div className="reveal-on-scroll">
          <SectionHeading className="mb-9">Who we partner with</SectionHeading>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {partnerTypes.map((item, idx) => (
            <div key={item.title} className={cn("reveal-on-scroll", `reveal-delay-${(idx % 4) + 1}`)}>
              <FeatureCard {...item} />
            </div>
          ))}
        </div>
      </Section>

      <Section muted>
        <div className="reveal-on-scroll">
          <SectionHeading className="mb-9">Why partner with Olitec</SectionHeading>
        </div>
        <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          {benefits.map((item, idx) => (
            <div key={item.title} className={cn("reveal-on-scroll flex gap-4", `reveal-delay-${(idx % 2) + 1}`)}>
              <IconTile icon="check" tone="green" size={44} />
              <div>
                <h3 className={cn(headingFont, "mb-1 text-[20px] font-semibold")}>{item.title}</h3>
                <p className="text-base">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="become-a-partner">
        <div className="reveal-on-scroll flex flex-wrap items-start gap-12">
          <div className="min-w-0 flex-[1_1_300px]">
            <SectionHeading>Become a partner</SectionHeading>
            <BulletList items={steps} ordered />
          </div>
          <div className="min-w-0 flex-[1.6_1_520px]">
            <EnquiryForm kind="partner" />
          </div>
        </div>
      </Section>
    </LegacyPage>
  );
}
