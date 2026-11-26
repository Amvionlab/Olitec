/** Products — Olitec engineering lineup. */
import type { Metadata } from "next";
import Link from "next/link";
import { productsPage } from "@/content/pages";
import {
  FeatureCard,
  LegacyPage,
  Section,
  SectionHeading,
  legacyButton,
  legacyButtonSecondary,
  legacyContainer,
} from "@/components/legacy/ui";
import { SlimPageBanner } from "@/components/layout/SlimPageBanner";
import { cn } from "@/lib/cn";
import { ProductSeriesList } from "@/components/products/ProductSeriesList";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Hybrid Inverters & LFP Battery Storage (5.12 kWh)",
  description:
    "Explore Olitec OLI-1H single-phase (3–6 kW) & OLI-3H three-phase (15–30 kW) hybrid solar inverters and OLB-5.12 LFP battery 5.12 kWh packs designed as one system in India.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  const { series, platform } = productsPage;
  return (
    <LegacyPage>
      <BreadcrumbJsonLd items={[{ name: "Products", path: "/products" }]} />
      <SlimPageBanner
        title="Inverters and energy storage, engineered to work together"
        accentWords="engineered to work together"
        lead="Hybrid inverters and LFP batteries designed as one system."
      >
        <Link className={legacyButton} href="/downloads">
          All downloads
        </Link>
        <Link className={legacyButtonSecondary} href="/applications">
          See applications
        </Link>
      </SlimPageBanner>

      <section className="bg-white">
        <div className={cn(legacyContainer, "pb-[72px] pt-6")}>
          <ProductSeriesList series={series} />
        </div>
      </section>

      <Section muted>
        <div className="reveal-on-scroll">
          <SectionHeading>{platform.title}</SectionHeading>
          <p className="mb-9 max-w-[720px] text-[19px]">{platform.lead}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {platform.steps.map((step, idx) => (
            <div key={step.title} className={cn("reveal-on-scroll", `reveal-delay-${(idx % 4) + 1}`)}>
              <FeatureCard {...step} />
            </div>
          ))}
        </div>
      </Section>
    </LegacyPage>
  );
}
