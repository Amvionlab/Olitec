/**
 * Home page — Matching all items from Olitec Review (Item 10, M1, M3, M4, M5, M6, M7, M15, 19).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { HomeContainer, SectionTitle } from "@/components/home/primitives";
import { BusinessLines } from "@/components/legacy/BusinessLines";
import { CtaPanel, IconTile } from "@/components/legacy/ui";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { legacyLead } from "@/content/legacy";
import { applicationsPage, productsPage } from "@/content/pages";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} · Clean Energy Solutions` },
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.legalName,
  url: siteConfig.url,
  logo: `${siteConfig.url}/images/home/olitec-logo.png`,
  email: siteConfig.supportEmail,
  telephone: siteConfig.carePhones[0],
  address: { "@type": "PostalAddress", streetAddress: siteConfig.corporateAddress, addressCountry: "IN" },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />

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
                className="inline-flex h-[52px] items-center gap-3 rounded-full bg-gradient-to-r from-[#E8962C] to-[#F3BE48] px-7 text-xs font-bold text-[#161E2C] shadow-md transition hover:brightness-105 active:scale-95"
              >
                <span>View All Products</span>
                <span className="flex size-7 items-center justify-center rounded-full bg-[#161E2C]/10">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </div>
          </ScrollReveal>

          <ul className="mt-12 grid justify-items-center gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {productsPage.series.map((item, index) => (
              <li key={item.title} className="w-full max-w-[382px]">
                <ScrollReveal delay={index * 140}>
                  <div className="group flex w-full flex-col overflow-hidden rounded-[26px] border border-[#e6e2d8] bg-white p-5 shadow-xs transition-all duration-300 ease-out hover:-translate-y-2 hover:border-[#E8962C] hover:shadow-xl hover:shadow-[#E8962C]/10">
                    {/* Eyebrow Heading above product box */}
                    <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.12em] text-[#C46E0E]">
                      {item.eyebrow}
                    </p>

                    <div
                      className={
                        item.tone === "green"
                          ? "rounded-[20px] bg-emerald-50 py-10 transition-colors duration-300 group-hover:bg-emerald-100/60"
                          : "rounded-[20px] bg-gradient-to-b from-[#FFF7EA] to-[#FFDDAA]/40 py-10 transition-all duration-300 group-hover:from-[#FFE4BC] group-hover:to-[#FFD69C]/50"
                      }
                    >
                      <div className="flex justify-center">
                        <IconTile icon={item.icon} tone={item.tone === "green" ? "green" : "orange"} size={90} />
                      </div>
                    </div>

                    <h3 className="mt-5 text-center text-[22px] font-bold leading-[1.3] text-[#161E2C] transition-colors duration-300 group-hover:text-[#D45C0A]">
                      {item.title}
                    </h3>
                    <p className="mx-auto mt-2 max-w-[280px] flex-1 text-center text-[14px] font-medium leading-[22px] text-slate-600">
                      {item.tagline}
                    </p>

                    <div className="mb-2 mt-6 flex justify-center">
                      <Link
                        href="/products"
                        className="inline-flex h-[46px] items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#E8962C] to-[#F3BE48] px-6 text-xs font-bold text-[#161E2C] shadow-sm transition hover:brightness-105 active:scale-95"
                        aria-label={`Know more about the ${item.title}`}
                      >
                        <span>Know More</span>
                        <span className="flex size-6 items-center justify-center rounded-full bg-[#161E2C]/10">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </span>
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
              </li>
            ))}
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
