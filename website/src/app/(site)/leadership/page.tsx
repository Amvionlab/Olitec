/** Leadership & Our Legacy — combined as requested in Review Item 10. */
import type { Metadata } from "next";
import { leaders, leadershipIntro, legacyLead, values } from "@/content/legacy";
import { LegacyPage, PageHero, Section, SectionHeading } from "@/components/legacy/ui";
import { SlimPageBanner } from "@/components/layout/SlimPageBanner";
import { AnimatedIllustration } from "@/components/legacy/AnimatedIllustration";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Our Legacy & Leadership",
  description: legacyLead.statement,
  alternates: { canonical: "/leadership" },
};

const badgeTones = {
  orange: "brand-gradient text-black",
  green: "bg-leaf text-white",
  neutral: "bg-forest text-white",
} as const;

export default function LeadershipPage() {
  return (
    <LegacyPage>
      <SlimPageBanner
        title="Building a dependable clean-energy model for India"
        accentWords="for India"
        lead={legacyLead.statement}
      />

      {/* Our Legacy & Heritage Story */}
      <Section innerClassName="pt-10 pb-6">
        <div className="reveal-on-scroll max-w-[840px]">
          <SectionHeading className="mb-4">Our Heritage</SectionHeading>
          <div className="space-y-4 text-base sm:text-lg font-medium leading-relaxed text-[#2A323F]">
            {legacyLead.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </Section>

      {/* Values Section */}
      <Section muted innerClassName="py-12">
        <div className="reveal-on-scroll">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12 xl:gap-16">
            <div className="relative aspect-[5/4] w-full max-w-[460px] shrink-0 overflow-hidden rounded-[32px] sm:rounded-[40px] shadow-sm">
              <AnimatedIllustration
                src={values.image}
                alt={values.imageAlt}
                overlay="values"
                sizes="(min-width: 1280px) 460px, 100vw"
                className="size-full"
              />
            </div>
            <div className="max-w-[640px] lg:w-[54%]">
              <SectionHeading className="mb-5">{values.title}</SectionHeading>
              <div className="space-y-4 text-base sm:text-lg font-medium leading-relaxed text-[#2A323F]">
                {values.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Leadership Team */}
      <Section innerClassName="py-16">
        <div className="reveal-on-scroll mb-10 max-w-[760px]">
          <SectionHeading className="mb-3">Leadership</SectionHeading>
          <p className="text-base sm:text-lg font-medium text-slate-600">{leadershipIntro}</p>
        </div>

        <ul className="grid gap-[30px] lg:grid-cols-2">
          {leaders.map((leader, index) => (
            <li
              key={leader.name}
              className={cn(
                "reveal-on-scroll rounded-[25.528px] border-[2px] border-[#e6e2d8] bg-white p-7 sm:p-10 shadow-xs",
                `reveal-delay-${(index % 2) + 1}`,
                index === leaders.length - 1 && leaders.length % 2 === 1 && "lg:col-span-2",
              )}
            >
              <article className="flex flex-wrap items-start gap-6">
                <div
                  aria-hidden
                  className={cn(
                    "flex size-[80px] sm:size-[90px] flex-none items-center justify-center rounded-full text-[28px] sm:text-[32px] font-bold shadow-xs",
                    badgeTones[leader.tone],
                  )}
                >
                  {leader.initials}
                </div>
                <div className="min-w-0 flex-[1_1_280px]">
                  <h2 className="text-[24px] sm:text-[26px] font-bold leading-[1.3] text-[#161E2C]">{leader.name}</h2>
                  <div className="mt-3 space-y-3 text-sm sm:text-base font-normal leading-relaxed text-slate-600">
                    {leader.paragraphs.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </Section>
    </LegacyPage>
  );
}
