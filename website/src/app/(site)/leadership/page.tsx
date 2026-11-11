/** Leadership — content from the Olitec HTML design (leadership.html), Figma styling. Linked from the home page. */
import type { Metadata } from "next";
import Link from "next/link";
import { leaders, leadershipIntro } from "@/content/legacy";
import { LegacyPage, PageHero, Section } from "@/components/legacy/ui";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Leadership",
  description: leadershipIntro,
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
      <PageHero art="values" eyebrow="Our Legacy" title="Leadership" lead={leadershipIntro}>
        <Link href="/" className="glass-chip mt-8 inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold text-white hover:bg-white/15">
          ← Our Legacy
        </Link>
      </PageHero>

      <Section>
        <ul className="grid gap-[30px] lg:grid-cols-2">
          {leaders.map((leader, index) => (
            <li
              key={leader.name}
              className={cn(
                "reveal-on-scroll rounded-[25.528px] border-[3px] border-[#d9d9d9] bg-white p-7 sm:p-10",
                `reveal-delay-${(index % 2) + 1}`,
                index === leaders.length - 1 && leaders.length % 2 === 1 && "lg:col-span-2",
              )}
            >
              <article className="flex flex-wrap items-start gap-6">
                <div
                  aria-hidden
                  className={cn("flex size-[90px] flex-none items-center justify-center rounded-full text-[30px] font-semibold", badgeTones[leader.tone])}
                >
                  {leader.initials}
                </div>
                <div className="min-w-0 flex-[1_1_280px]">
                  <h2 className="text-[26px] font-semibold leading-[1.3] text-black">{leader.name}</h2>
                  <div className="mt-3 space-y-3 text-base font-medium leading-[25px]">
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
