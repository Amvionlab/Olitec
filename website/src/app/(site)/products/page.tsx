/** Products — Olitec engineering lineup. */
import type { Metadata } from "next";
import Link from "next/link";
import { productsPage } from "@/content/pages";
import {
  FeatureCard,
  LegacyPage,
  PageHero,
  Section,
  SectionHeading,
  legacyButton,
  legacyButtonSecondary,
  legacyContainer,
} from "@/components/legacy/ui";
import { cn } from "@/lib/cn";
import { ProductSeriesList } from "@/components/products/ProductSeriesList";

export const metadata: Metadata = {
  title: "Products",
  description: productsPage.lead,
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  const { series, platform } = productsPage;
  return (
    <LegacyPage>
      <PageHero art="inverters" eyebrow={productsPage.eyebrow} title={productsPage.title} lead={productsPage.lead}>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link className={legacyButton} href="/downloads">
            All downloads
          </Link>
          <Link className={legacyButtonSecondary} href="/applications">
            See applications
          </Link>
        </div>
      </PageHero>

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
