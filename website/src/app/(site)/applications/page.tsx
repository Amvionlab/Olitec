/** Applications — from the Olitec HTML design (Olitec-Website/applications.html). */
import type { Metadata } from "next";
import { applicationsPage } from "@/content/pages";
import { BulletList, CtaPanel, IconTile, LegacyCard, LegacyPage, PageHero, Section, headingFont } from "@/components/legacy/ui";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Applications",
  description: applicationsPage.lead,
  alternates: { canonical: "/applications" },
};

const cardTitle = cn(headingFont, "mb-2.5 text-[18px] font-semibold");

export default function ApplicationsPage() {
  const { items, cta } = applicationsPage;
  return (
    <LegacyPage>
      <PageHero art="groundMount" eyebrow={applicationsPage.eyebrow} title={applicationsPage.title} lead={applicationsPage.lead} />

      <Section innerClassName="pb-6 pt-12">
        <nav aria-label="Applications" className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, idx) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={cn(
                "reveal-on-scroll flex items-start gap-4 rounded-[25.528px] border border-[#e6e6e6] bg-white p-[22px] transition-colors hover:border-brand-500",
                `reveal-delay-${(idx % 3) + 1}`,
              )}
            >
              <IconTile icon={item.icon} size={52} />
              <span className="min-w-0">
                <span className="mb-1 block text-[19px] font-semibold text-black">{item.title}</span>
                <span className="block text-[15px] text-muted">{item.tagline}</span>
              </span>
            </a>
          ))}
        </nav>
      </Section>

      {items.map((item, index) => (
        <Section key={item.id} id={item.id} muted={index % 2 === 1} innerClassName="py-16">
          <div className="reveal-on-scroll">
            <div className="mb-3.5 flex items-center gap-4">
              <IconTile icon={item.icon} />
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-600">Application</p>
            </div>
            <h2 className={cn(headingFont, "mb-1.5 text-[34px] font-semibold leading-[1.15]")}>{item.title}</h2>
            <p className="mb-8 text-[20px] font-semibold text-ink">{item.tagline}</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="reveal-on-scroll reveal-delay-1">
              <LegacyCard>
                <h3 className={cardTitle}>The challenge</h3>
                <p className="text-base">{item.challenge}</p>
              </LegacyCard>
            </div>
            <div className="reveal-on-scroll reveal-delay-2">
              <LegacyCard className="border-brand-300 bg-brand-50">
                <h3 className={cardTitle}>The Olitec system</h3>
                <BulletList items={item.system} className="text-base" />
              </LegacyCard>
            </div>
            <div className="reveal-on-scroll reveal-delay-3">
              <LegacyCard className="border-leaf/40 bg-leaf/5">
                <h3 className={cardTitle}>The outcome</h3>
                <BulletList items={item.outcome} className="text-base" />
              </LegacyCard>
            </div>
          </div>
        </Section>
      ))}

      <div className="reveal-on-scroll">
        <CtaPanel title={cta.title} body={cta.body} primary={cta.action} secondary={{ href: "/channel-partners", label: "Become a partner" }} />
      </div>
    </LegacyPage>
  );
}
