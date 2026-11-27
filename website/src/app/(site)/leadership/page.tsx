/** Leadership & Our Legacy — Modern executive editorial UI aligned with the Olitec design system. */
import type { Metadata } from "next";
import {
  Factory,
  Layers,
  MapPin,
} from "lucide-react";
import { leaders, leadershipIntro, legacyLead, values } from "@/content/legacy";
import { CtaPanel, LegacyPage } from "@/components/legacy/ui";
import { SlimPageBanner } from "@/components/layout/SlimPageBanner";
import { AnimatedIllustration } from "@/components/legacy/AnimatedIllustration";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/lib/site";
import { applicationsPage } from "@/content/pages";

export const metadata: Metadata = {
  title: "Our Legacy",
  description:
    "Meet Olitec's leadership team and manufacturing heritage in Vellore and Chennai — building hybrid inverters, LFP batteries, and solar power plants for India.",
  alternates: { canonical: "/leadership" },
};



export default function LeadershipPage() {
  return (
    <LegacyPage>
      <BreadcrumbJsonLd items={[{ name: "Our Legacy", path: "/leadership" }]} />

      {/* 1. Slim two-line banner (Item M16). No in-page links. Item 10: the repeated
          "Olitec is an Indian clean-energy company…" sentence is replaced on this page. */}
      <SlimPageBanner
        title="Our Legacy"
        accentWords="Legacy"
        lead={siteConfig.searchDescription}
      />

      {/* 2. Heritage & Manufacturing Lineage (Balanced 7/5 Grid) */}
      <section id="heritage" className="scroll-mt-24 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 xl:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
            {/* Left Editorial Narrative (7 cols) */}
            <div className="lg:col-span-7 space-y-5">

              <h2 className="text-3xl sm:text-[36px] font-extrabold tracking-tight text-[#161E2C] leading-[1.18]">
                Our story
              </h2>

              <div className="space-y-4 text-sm sm:text-base font-medium leading-[1.75] text-[#2A323F]">
                {legacyLead.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>

            {/* Right Structured Lineage & Footprint Card (5 cols) */}
            <aside className="lg:col-span-5 space-y-4">
              <div className="rounded-[28px] border border-[#e6e2d8] bg-gradient-to-b from-[#FFFDF9] to-[#FDFBF7] p-6 sm:p-7 shadow-[0_10px_34px_rgb(0_0_0/0.04)] space-y-5">
                <div className="flex items-center justify-between border-b border-[#e6e2d8]/80 pb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#D45C0A]">
                      Olitec Solar Private Limited
                    </span>
                    <h3 className="mt-0.5 text-lg font-extrabold text-[#161E2C]">
                      Where we work
                    </h3>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-[#FFF1DF] text-[#D45C0A]">
                    <Layers className="size-5" />
                  </div>
                </div>

                <ul className="space-y-4 text-xs sm:text-[13.5px]">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-xl bg-[#E7F1E5] text-[#1F7A34]">
                      <Factory className="size-4" />
                    </span>
                    <div>
                      <p className="font-bold text-[#161E2C]">Factory and R&amp;D Plant</p>
                      <p className="text-slate-600 leading-relaxed">{siteConfig.factoryAddress}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#161E2C]">
                      <MapPin className="size-4" />
                    </span>
                    <div>
                      <p className="font-bold text-[#161E2C]">Corporate Headquarters</p>
                      <p className="text-slate-600 leading-relaxed">
                        {siteConfig.legalName}
                        <br />
                        {siteConfig.corporateAddress}
                      </p>
                    </div>
                  </li>
                </ul>

              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* 3. Core Values Section (Visual Showcase + 3 Value Cards) */}
      <section
        id="values"
        className="scroll-mt-24 border-y border-[#e6e2d8]/80 bg-gradient-to-b from-[#FAF8F4] to-[#F4F1EA] py-14 sm:py-18"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 xl:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-14 items-center">
            {/* Left Framed Illustration (5 cols) */}
            <div className="lg:col-span-5">
              <div className="relative aspect-[5/4] w-full overflow-hidden rounded-[32px] border border-[#e6e2d8] bg-white shadow-[0_14px_40px_rgb(0_0_0/0.06)]">
                <AnimatedIllustration
                  src={values.image}
                  alt={values.imageAlt}
                  overlay="values"
                  sizes="(min-width: 1280px) 520px, 100vw"
                  className="size-full"
                />
              </div>
            </div>

            {/* Right Values Narrative + Pillars (7 cols) */}
            <div className="lg:col-span-7 space-y-5">

              <h2 className="text-2xl sm:text-[32px] font-extrabold tracking-tight text-[#161E2C] leading-[1.22]">
                {values.title}
              </h2>

              <div className="space-y-3.5 text-sm sm:text-[15.5px] font-medium leading-[1.7] text-[#2A323F]">
                {values.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 4. Executive Leadership Directory (Clean Editorial Rows) */}
      <section id="leadership" className="scroll-mt-24 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 xl:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 sm:mb-12">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-[38px] font-extrabold tracking-tight text-[#161E2C] leading-tight">
                Leadership
              </h2>
            </div>
            <p className="max-w-md text-sm sm:text-[15px] font-medium leading-relaxed text-slate-600">
              {leadershipIntro}
            </p>
          </div>

          <ul className="divide-y divide-[#e6e2d8] border-y border-[#e6e2d8]">
            {leaders.map((leader, index) => {
              const idxLabel = String(index + 1).padStart(2, "0");

              return (
                <li
                  key={leader.name}
                  className="group transition-colors duration-200 hover:bg-[#FAF8F4]/70"
                >
                  <article className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-10 py-8 sm:py-10 px-2 sm:px-4 items-start">
                    {/* Left Column: Index + Minimal Monogram + Name & Domain */}
                    <div className="lg:col-span-5 flex items-start gap-4 sm:gap-5">
                      <span className="font-mono text-xs font-bold text-slate-400 pt-3.5 shrink-0">
                        {idxLabel}
                      </span>
                      <div
                        aria-hidden
                        className="flex size-12 sm:size-13 shrink-0 items-center justify-center rounded-full border border-[#e6e2d8] bg-[#FDFBF7] text-sm font-extrabold tracking-tight text-[#161E2C] transition-colors duration-200 group-hover:border-[#D45C0A] group-hover:bg-[#FFF9F2] group-hover:text-[#D45C0A]"
                      >
                        {leader.initials}
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#161E2C] leading-snug">
                          {leader.name}
                        </h3>
                      </div>
                    </div>

                    {/* Right Column: Editorial Biography */}
                    <div className="lg:col-span-7 space-y-3 text-sm sm:text-[15px] font-normal leading-[1.75] text-slate-600 lg:pl-2">
                      {leader.paragraphs.map((p) => (
                        <p key={p}>{p}</p>
                      ))}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 5. Bottom Navy CtaPanel */}
      <CtaPanel
        title={applicationsPage.cta.title}
        body={applicationsPage.cta.body}
        primary={applicationsPage.cta.action}
        secondary={{ href: "/channel-partners", label: "Become a partner" }}
      />
    </LegacyPage>
  );
}
