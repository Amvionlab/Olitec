/** Applications — from the Olitec HTML design (Olitec-Website/applications.html). */
import type { Metadata } from "next";
import { applicationsPage } from "@/content/pages";
import { CtaPanel, IconTile, LegacyPage, PageHero, Section } from "@/components/legacy/ui";
import { ApplicationScrollRow } from "@/components/applications/ApplicationScrollRow";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Applications",
  description: applicationsPage.lead,
  alternates: { canonical: "/applications" },
};

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

      {/* Sequential scroll-pinned applications (one by one box arrival, row completes, moves to next) */}
      <div className="relative">
        {items.map((item, index) => (
          <ApplicationScrollRow key={item.id} item={item} index={index} />
        ))}
      </div>

      <div className="reveal-on-scroll">
        <CtaPanel title={cta.title} body={cta.body} primary={cta.action} secondary={{ href: "/channel-partners", label: "Become a partner" }} />
      </div>
    </LegacyPage>
  );
}
