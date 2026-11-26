/** Applications — from the Olitec HTML design (Olitec-Website/applications.html) & Item M11. */
import type { Metadata } from "next";
import Link from "next/link";
import { applicationsPage } from "@/content/pages";
import { CtaPanel, LegacyPage, Section, SectionHeading } from "@/components/legacy/ui";
import { SlimPageBanner } from "@/components/layout/SlimPageBanner";
import { InteractiveApplicationExplorer } from "@/components/applications/InteractiveApplicationExplorer";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Solar Inverter with Battery Backup Applications in India",
  description:
    "Explore Olitec hybrid inverter and LFP energy storage deployments for Indian homes, clinics, telecom and rural microgrids, farms, defence outposts, and commercial factories.",
  alternates: { canonical: "/applications" },
};

export default function ApplicationsPage() {
  const { cta, items } = applicationsPage;
  return (
    <LegacyPage>
      <BreadcrumbJsonLd items={[{ name: "Applications", path: "/applications" }]} />

      {/* 1. Slim Page Banner with burnt orange accent */}
      <SlimPageBanner
        title="Built for the places India needs power most"
        accentWords="needs power most"
        lead="Choose an application to see how solar, storage and backup work together."
      />

      {/* 2. Unified Master Details Panel with 6-pill selector & live animated power flow */}
      <Section innerClassName="pt-8 pb-10">
        <InteractiveApplicationExplorer />
      </Section>

      {/* 3. Static HTML System Reference Matrix & Power Modes (Full SSR text equivalent for crawlers & visitors) */}
      <Section muted innerClassName="py-12">
        <div className="max-w-3xl mb-8">
          <SectionHeading>All Six System Architectures &amp; Energy Routing Modes</SectionHeading>
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
            Every Olitec deployment pairs solar PV arrays, hybrid inverters (OLI-1H or OLI-3H), and LiFePO₄ battery packs (OLB-5.12) across four intelligent operating modes:
          </p>
        </div>

        {/* 4 Modes text summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {[
            {
              mode: "Daytime Solar Mode",
              desc: "Solar PV powers connected loads first while excess solar generation charges the LFP battery bank (+1.8 kW+) with optional grid feed-in.",
            },
            {
              mode: "Evening Peak Mode",
              desc: "Stored LFP battery energy discharges smoothly during high-tariff evening hours to eliminate peak demand surcharges.",
            },
            {
              mode: "Grid Outage (<10 ms UPS)",
              desc: "Transfers critical loads to solar + LFP battery in under 10 milliseconds with automatic anti-islanding protection.",
            },
            {
              mode: "Generator Integration Mode",
              desc: "Smart dry-contact control starts backup diesel generators only during prolonged low-SOC events and recharges storage safely.",
            },
          ].map((m) => (
            <div key={m.mode} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h3 className="text-sm font-bold text-[#161E2C]">{m.mode}</h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>

        {/* All 6 Application Configurations in clean semantic HTML */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div>
                <h3 className="text-lg font-bold text-[#161E2C]">{item.title}</h3>
                <p className="mt-1 text-xs font-semibold text-[#D45C0A]">{item.tagline}</p>
                <p className="mt-3 text-xs text-slate-600 leading-relaxed">{item.challenge}</p>
                <div className="mt-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Recommended Configuration</h4>
                  <ul className="mt-1.5 space-y-1 text-xs text-slate-700 list-disc pl-4">
                    {item.system.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Key Outcomes</h4>
                  <ul className="mt-1.5 space-y-1 text-xs text-slate-700 list-disc pl-4">
                    {item.outcome.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <Link
                  href={item.id === "ci" || item.id === "microgrid" ? "/products/oli-3h-series-15-30kw" : "/products/oli-1h-series-3-6kw"}
                  className="text-[#1F7A34] hover:underline"
                >
                  View Inverter &rarr;
                </Link>
                <Link href="/products/olb-512-lfp-battery-wall" className="text-[#D45C0A] hover:underline">
                  OLB-5.12 Storage &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* 4. Bottom CTA Section */}
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
