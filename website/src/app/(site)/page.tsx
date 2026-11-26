/**
 * Home page — Matching all items from Olitec Review (Item 10, M1, M3, M4, M5, M6, M7, M15, 19).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { HomeProductCard } from "@/components/home/HomeProductCard";
import { HomeContainer, SectionTitle } from "@/components/home/primitives";
import { BusinessLines } from "@/components/legacy/BusinessLines";
import { CtaPanel } from "@/components/legacy/ui";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { legacyLead } from "@/content/legacy";
import { faqs } from "@/content/home";
import { applicationsPage, productsPage } from "@/content/pages";
import { FaqJsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} · Hybrid Inverters & LFP Energy Storage India` },
  description: siteConfig.searchDescription,
  alternates: { canonical: "/" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.legalName,
  alternateName: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url.replace(/\/$/, "")}/images/home/olitec-logo.png`,
  email: siteConfig.supportEmail,
  telephone: siteConfig.carePhones[0],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: siteConfig.carePhones[0],
    email: siteConfig.supportEmail,
    contactType: "customer service",
    areaServed: "IN",
    availableLanguage: ["English", "Hindi", "Tamil"],
  },
  address: { "@type": "PostalAddress", streetAddress: siteConfig.corporateAddress, addressCountry: "IN" },
  location: [
    { "@type": "Place", name: "Corporate Office", address: siteConfig.corporateAddress },
    { "@type": "Place", name: "Manufacturing Facility", address: siteConfig.factoryAddress },
  ],
};

export default function HomePage() {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/images/legacy/hero-banner-mobile.webp"
        media="(max-width: 767px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href="/images/legacy/hero-banner.webp"
        media="(min-width: 768px)"
        fetchPriority="high"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <FaqJsonLd items={faqs} />

      {/* 1. Hero with warm apricot radial glow and deep green action */}
      <Hero />

      {/* 2. Three Connected Lines of Business */}
      <BusinessLines />

      {/* 3. Synergy — Sun-like gradient band with 3 interconnected circles (Item M4) */}
      <section
        className="py-16 xl:py-20 border-y border-[#FFDDAA]/50"
        style={{
          background: "linear-gradient(135deg, #FFDBA6 0%, #FFE4BC 35%, #FFEED4 70%, #FFF6E8 100%)",
        }}
        aria-label="How our businesses connect"
      >
        <ScrollReveal>
          <HomeContainer className="max-w-[1200px] xl:max-w-[1260px] 2xl:max-w-[1260px]">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-10 xl:gap-14">
              <h2 className="max-w-[580px] text-[26px] font-bold leading-[38px] text-[#161E2C] sm:text-[30px] xl:text-[34px] xl:leading-[46px]">
                Each line of business strengthens the others: what we learn operating plants shapes the products we build, and the products we build make the solutions we deliver{" "}
                <span className="text-[#1F7A34]">more reliable.</span>
              </h2>

              {/* 3 Interconnected Circles in a Triangle */}
              <div className="relative flex h-[320px] w-full max-w-[440px] items-center justify-center">
                <svg className="absolute inset-0 size-full" viewBox="0 0 400 300" fill="none">
                  <line x1="200" y1="60" x2="90" y2="230" stroke="#E8962C" strokeWidth="2.5" strokeDasharray="4 4" />
                  <line x1="200" y1="60" x2="310" y2="230" stroke="#1F7A34" strokeWidth="2.5" strokeDasharray="4 4" />
                  <line x1="90" y1="230" x2="310" y2="230" stroke="#D45C0A" strokeWidth="2.5" strokeDasharray="4 4" />
                </svg>

                {/* Node 1: Top (Solar plants) */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="flex size-20 items-center justify-center rounded-full bg-white shadow-md border-2 border-[#E8962C]">
                    <span className="text-2xl">☀️</span>
                  </div>
                  <span className="mt-2 text-xs font-bold text-[#161E2C] bg-white/90 px-3 py-1 rounded-full shadow-2xs">
                    Solar plants
                  </span>
                </div>

                {/* Node 2: Bottom-Left (Inverters and storage) */}
                <div className="absolute bottom-2 left-4 flex flex-col items-center">
                  <div className="flex size-20 items-center justify-center rounded-full bg-white shadow-md border-2 border-[#1F7A34]">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <span className="mt-2 text-xs font-bold text-[#161E2C] bg-white/90 px-3 py-1 rounded-full shadow-2xs text-center max-w-[130px]">
                    Inverters & storage
                  </span>
                </div>

                {/* Node 3: Bottom-Right (Turnkey solutions) */}
                <div className="absolute bottom-2 right-4 flex flex-col items-center">
                  <div className="flex size-20 items-center justify-center rounded-full bg-white shadow-md border-2 border-[#D45C0A]">
                    <span className="text-2xl">🔄</span>
                  </div>
                  <span className="mt-2 text-xs font-bold text-[#161E2C] bg-white/90 px-3 py-1 rounded-full shadow-2xs text-center max-w-[130px]">
                    Turnkey solutions
                  </span>
                </div>
              </div>
            </div>
          </HomeContainer>
        </ScrollReveal>
      </section>

      {/* 4. Products Section (Items M5 & 19) */}
      <section id="products" className="py-16 scroll-mt-6 xl:py-20" aria-labelledby="products-title">
        <HomeContainer>
          <ScrollReveal>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <SectionTitle id="products-title">Our Products</SectionTitle>
                <p className="mt-3 max-w-[811px] text-base font-medium leading-6 text-slate-700">{productsPage.lead}</p>
              </div>
              <Link
                href="/products"
                className="inline-flex h-[52px] items-center gap-3.5 rounded-full bg-gradient-to-r from-[#E8962C] to-[#F3BE48] px-7 text-sm sm:text-[15px] font-extrabold text-[#161E2C] shadow-[0_8px_20px_rgb(232_150_44/0.28)] transition hover:brightness-105 active:scale-95"
              >
                <span>View All Products</span>
                <span className="flex size-7 items-center justify-center rounded-full bg-white text-[#161E2C] shadow-xs">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </div>
          </ScrollReveal>

          <ul className="mt-12 grid justify-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {productsPage.series.map((item, index) => (
<HomeProductCard
  key={item.title}
  item={item}
  index={index}
/>            ))}
          </ul>
        </HomeContainer>
      </section>

      {/* 5. CTA Section (Item M7) */}
      <CtaPanel
        title={applicationsPage.cta.title}
        body={applicationsPage.cta.body}
        primary={applicationsPage.cta.action}
        secondary={{ href: "/channel-partners", label: "Become a partner" }}
      />
    </>
  );
}
