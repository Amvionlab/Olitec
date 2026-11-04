/** Products — from the Olitec HTML design (Olitec-Website/products.html). */
import type { Metadata } from "next";
import Link from "next/link";
import { productsPage } from "@/content/pages";
import {
  BulletList,
  DefinitionRows,
  FeatureCard,
  IconTile,
  LegacyCard,
  LegacyPage,
  PageHero,
  Section,
  SectionHeading,
  headingFont,
  legacyButton,
  legacyButtonSecondary,
  legacyContainer,
} from "@/components/legacy/ui";
import { cn } from "@/lib/cn";

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
          {series.map((item, index) => (
            <article
              key={item.title}
              className={cn("flex flex-wrap gap-12 border-t border-[#e6e6e6] py-14", index === series.length - 1 && "border-b")}
            >
              <div className="min-w-0 flex-[1.1_1_440px]">
                <div className="mb-[18px] flex items-center gap-4">
                  <IconTile icon={item.icon} tone={item.tone} />
                  <p className={cn("text-sm font-semibold uppercase tracking-[0.14em]", item.tone === "green" ? "text-leaf" : "text-brand-600")}>
                    {item.eyebrow}
                  </p>
                </div>
                <h2 className={cn(headingFont, "mb-2 text-[36px] font-semibold leading-[1.12]")}>{item.title}</h2>
                <p className="mb-4 text-[20px] font-semibold text-ink">{item.tagline}</p>
                <p className="mb-[18px]">{item.body}</p>
                <BulletList items={item.bullets} />
                <ul className="mb-[26px] mt-[22px] flex flex-wrap gap-2" aria-label="Models">
                  {item.models.map((model) => (
                    <li key={model} className="rounded-full border border-[#b7b7b7] px-3 py-[5px] text-sm font-semibold text-black">
                      {model}
                    </li>
                  ))}
                </ul>
                <a className={legacyButton} href={item.datasheet} target="_blank" rel="noopener noreferrer">
                  Download datasheet
                </a>
              </div>
              <div className="min-w-0 flex-[1_1_340px]">
                <LegacyCard className="bg-white">
                  <h3 className={cn(headingFont, "mb-2 text-[18px] font-semibold")}>Key figures</h3>
                  <DefinitionRows rows={item.figures} />
                </LegacyCard>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Section muted>
        <SectionHeading>{platform.title}</SectionHeading>
        <p className="mb-9 max-w-[720px] text-[19px]">{platform.lead}</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {platform.steps.map((step) => (
            <FeatureCard key={step.title} {...step} />
          ))}
        </div>
      </Section>
    </LegacyPage>
  );
}
