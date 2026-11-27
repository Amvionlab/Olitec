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
import { synergy } from "@/content/legacy";
import { SynergyBand } from "@/components/home/SynergyBand";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { applicationsPage, productsPage } from "@/content/pages";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} | Hybrid inverters and energy storage` },
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
        href="/images/legacy/hero-banner-1600.webp"
        imageSrcSet="/images/legacy/hero-banner-1600.webp 1600w, /images/legacy/hero-banner-2576.webp 2576w"
        imageSizes="(min-width: 1640px) 1640px, 100vw"
        media="(min-width: 768px)"
        fetchPriority="high"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />

      {/* 1. Hero with warm apricot radial glow and deep green action */}
      <Hero />

      {/* 2. Three Connected Lines of Business */}
      <BusinessLines />

      {/* 3. "Each line of business strengthens the others" band (Item M4) */}
      <SynergyBand statement={synergy.statement} accent="more reliable." />

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
