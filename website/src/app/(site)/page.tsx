/**
 * Home page — Figma design layout (file 4RL0Ps4BaU4pg1YPjHxUFi, node 3470:2) with the content of the
 * Olitec HTML design ("Our Legacy", index.html). Figma sections without HTML content (stats, testimonials,
 * projects, partner logos, spotlight) are not shown. Text lives in src/content/legacy.ts and pages.ts.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { Faq } from "@/components/home/Faq";
import { ArrowPillLink, HomeContainer, SectionTitle } from "@/components/home/primitives";
import { AnimatedIllustration } from "@/components/legacy/AnimatedIllustration";
import { BusinessLines } from "@/components/legacy/BusinessLines";
import { CtaPanel, IconTile } from "@/components/legacy/ui";
import { legacyLead, synergy, values } from "@/content/legacy";
import { applicationsPage, productsPage } from "@/content/pages";
import { faqs } from "@/content/home";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `Our Legacy · ${siteConfig.name}` },
  description: legacyLead.statement,
  alternates: { canonical: "/" },
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.legalName,
    url: siteConfig.url,
    logo: `${siteConfig.url}/images/home/olitec-logo.png`,
    email: siteConfig.supportEmail,
    telephone: siteConfig.carePhones[0],
    address: { "@type": "PostalAddress", streetAddress: siteConfig.corporateAddress, addressCountry: "IN" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
  },
];

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />

      <Hero />

      {/* About — Figma two-column text section */}
      <section id="about" className="mt-16 scroll-mt-6 xl:mt-[86px]" aria-labelledby="about-title">
        <HomeContainer className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="lg:max-w-[478px]">
            <SectionTitle id="about-title">Our Legacy</SectionTitle>
            <p className="mt-6 text-[23px] font-semibold leading-[32px] text-black">{legacyLead.statement}</p>
          </div>
          <div className="max-w-[582px] space-y-6 text-lg font-medium leading-7 text-black lg:pt-[78px]">
            {legacyLead.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </HomeContainer>
      </section>

      <BusinessLines />

      {/* Synergy — Figma dark-green band */}
      <section className="bg-forest py-14 xl:py-[86px]" aria-label="How our businesses connect">
        <HomeContainer className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="max-w-[560px] text-[28px] font-semibold leading-[38px] text-white xl:text-[34px] xl:leading-[46px]">{synergy.statement}</h2>
          <AnimatedIllustration
            src={synergy.image}
            alt={synergy.imageAlt}
            overlay="synergy"
            sizes="(min-width: 1280px) 582px, 100vw"
            className="aspect-[582/360] w-full max-w-[582px] shrink-0 rounded-[40px] lg:w-[46%] xl:rounded-[53px]"
          />
        </HomeContainer>
      </section>

      {/* Products — Figma product cards */}
      <section id="products" className="mt-16 scroll-mt-6 xl:mt-[86px]" aria-labelledby="products-title">
        <HomeContainer>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <SectionTitle id="products-title">Our Products</SectionTitle>
              <p className="mt-3 max-w-[811px] text-base font-medium leading-6 text-black">{productsPage.lead}</p>
            </div>
            <Link
              href="/products"
              className="inline-flex h-[58px] w-[212px] shrink-0 items-center justify-center rounded-[29.5px] bg-black text-[14.195px] font-semibold leading-[16.56px] text-white transition hover:bg-neutral-800"
            >
              View All Products
            </Link>
          </div>

          <ul className="mt-10 grid justify-items-center gap-[34px] sm:grid-cols-2 lg:grid-cols-3">
            {productsPage.series.map((item) => (
              <li key={item.title} className="flex w-full max-w-[382px] flex-col overflow-hidden rounded-[25.528px] border-[0.912px] border-[#b7b7b7] bg-white p-[16.4px]">
                <div className={item.tone === "green" ? "rounded-[16.411px] bg-leaf/15 py-12" : "brand-gradient rounded-[16.411px] py-12"}>
                  <div className="flex justify-center">
                    <IconTile icon={item.icon} tone={item.tone === "green" ? "green" : "orange"} size={90} />
                  </div>
                  <p className="mt-4 text-center text-sm font-semibold uppercase tracking-[0.12em] text-black">{item.eyebrow}</p>
                </div>
                <h3 className="mt-6 text-center text-[26px] font-semibold leading-[1.3] text-black">{item.title}</h3>
                <p className="mx-auto mt-2 max-w-[280px] flex-1 text-center text-[14.587px] font-medium leading-[21.881px] text-black">{item.tagline}</p>
                <div className="mb-3 mt-6 flex justify-center">
                  <Link
                    href="/products"
                    className="brand-gradient inline-flex h-[52.88px] w-[166.84px] items-center justify-center gap-3 rounded-[26.895px] text-[12.941px] font-semibold text-black transition hover:brightness-105"
                    aria-label={`Know more about the ${item.title}`}
                  >
                    Know More
                    <svg aria-hidden width="22" height="16" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 9h19M14 2l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </HomeContainer>
      </section>

      {/* Values — Figma image + text section */}
      <section className="mt-16 xl:mt-[86px]" aria-labelledby="values-title">
        <HomeContainer className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <AnimatedIllustration
            src={values.image}
            alt={values.imageAlt}
            overlay="values"
            sizes="(min-width: 1280px) 460px, 100vw"
            className="aspect-[5/6] w-full max-w-[460px] shrink-0 rounded-[40px] lg:w-[40%] xl:rounded-[53px]"
          />
          <div className="max-w-[640px]">
            <SectionTitle id="values-title" className="xl:leading-[62px]">
              {values.title}
            </SectionTitle>
            <div className="mt-6 space-y-5 text-lg font-medium leading-7 text-black">
              {values.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <div className="mt-8">
              <ArrowPillLink href={values.link.href} label="Meet the leadership team" width={270} />
            </div>
          </div>
        </HomeContainer>
      </section>

      <Faq />

      <div className="mt-16 xl:mt-[86px]">
        <CtaPanel
          title={applicationsPage.cta.title}
          body={applicationsPage.cta.body}
          primary={applicationsPage.cta.action}
          secondary={{ href: "/channel-partners", label: "Become a partner" }}
        />
      </div>
    </>
  );
}
