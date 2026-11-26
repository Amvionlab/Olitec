import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  Download,
  Phone,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { ProductMediaViewer } from "@/components/products/ProductMediaViewer";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { SlimPageBanner } from "@/components/layout/SlimPageBanner";
import { CtaPanel, LegacyPage } from "@/components/legacy/ui";
import { getProductBySlug, getProducts } from "@/services/products";
import { productsPage } from "@/content/pages";
import { formatInr, formatWarrantyPeriod } from "@/lib/format";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/cn";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} (${product.model})`,
    description: product.shortDescription,
    alternates: { canonical: `/products/${product.slug}` },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();

  const isBattery =
    product.category.toLowerCase().includes("battery") ||
    product.category.toLowerCase().includes("storage") ||
    product.slug.includes("olb");

  // Match curated series metadata (datasheet link, models array, eyebrow) when viewing a core Olitec series
  const matchedSeries = productsPage.series.find((s) => s.href === `/products/${product.slug}`);
  const modelList = matchedSeries
    ? [...matchedSeries.models]
    : product.model
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);

  const canonicalUrl = `${siteConfig.url.replace(/\/$/, "")}/products/${product.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    model: product.model,
    sku: product.model,
    category: product.category,
    description: product.description || product.shortDescription,
    brand: { "@type": "Brand", name: siteConfig.name },
    manufacturer: { "@type": "Organization", name: siteConfig.legalName },
    ...(product.specs && product.specs.length > 0
      ? {
          additionalProperty: product.specs.map((spec) => ({
            "@type": "PropertyValue",
            name: spec.label,
            value: spec.value,
          })),
        }
      : {}),
    ...(product.priceInr > 0
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "INR",
            price: product.priceInr,
            availability: "https://schema.org/InStock",
            url: canonicalUrl,
          },
        }
      : {
          offers: {
            "@type": "Offer",
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
            url: canonicalUrl,
          },
        }),
  };

  const navSeries = [
    { href: "/products", label: "All Products" },
    { href: "/products/oli-1h-series-3-6kw", label: "OLI-1H (3–6 kW)" },
    { href: "/products/oli-3h-series-15-30kw", label: "OLI-3H (15–30 kW)" },
    { href: "/products/olb-512-lfp-battery-wall", label: "OLB-5.12 (5.12 kWh)" },
  ];

  // Highlight rating keywords inside the banner title cleanly
  const accentWords = product.name.includes("3 to 6 kW")
    ? "3 to 6 kW"
    : product.name.includes("15 to 30 kW")
      ? "15 to 30 kW"
      : product.name.includes("5.12 kWh")
        ? "5.12 kWh"
        : undefined;

  return (
    <LegacyPage>
      <div className="-mt-6 xl:-mt-10 -mb-20 bg-white">
        <BreadcrumbJsonLd
          items={[
            { name: "Products", path: "/products" },
            { name: product.name, path: `/products/${product.slug}` },
          ]}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />

        {/* 1. Slim Signature Banner matching Home, Products, Applications, Connect & Customer Care */}
        <SlimPageBanner
          title={product.name}
          accentWords={accentWords}
          lead={product.shortDescription || `${product.category} engineered by Olitec Solar`}
        >
          <nav
            aria-label="Product series navigation"
            className="inline-flex flex-wrap items-center gap-1 rounded-full bg-white/75 p-1 border border-black/10 shadow-xs backdrop-blur-md"
          >
            {navSeries.map((tab) => {
              const isActive = tab.href === `/products/${product.slug}`;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-bold transition-all sm:px-4 whitespace-nowrap",
                    isActive
                      ? "bg-[#161E2C] text-white shadow-xs"
                      : "text-[#161E2C] hover:bg-black/5 hover:text-[#D45C0A]",
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </SlimPageBanner>

        {/* 2. Main 50/50 Split Content: Fixed Sticky Left Visuals + Scrollable Right Engineering Specs */}
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 xl:px-12 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
            {/* LEFT HALF (Fixed/Sticky in viewport while right half scrolls) */}
            <aside className="lg:col-span-6 lg:sticky lg:top-[96px] lg:self-start space-y-4">
              <div className="rounded-[28px] border border-[#e6e2d8] bg-white p-4 sm:p-5 shadow-[0_12px_40px_rgb(0_0_0/0.04)]">
                {/* Eyebrow Header */}
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
                      isBattery ? "bg-emerald-500/10 text-[#1F7A34]" : "bg-amber-500/10 text-[#D45C0A]",
                    )}
                  >
                    <Zap className="size-3.5" />
                    <span>{matchedSeries?.eyebrow || product.category}</span>
                  </span>
                </div>

                {/* CAD Image Preview / Interactive 3D Viewer */}
                <ProductMediaViewer
                  category={product.category}
                  name={product.name}
                  model={product.model}
                  viewerHeight={265}
                  className="border-slate-100 shadow-none p-2 sm:p-3"
                />

                {/* Available Models Strip inside Sticky Showcase */}
                {modelList.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Available Model Variants
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {modelList.map((m) => (
                        <span
                          key={m}
                          className="rounded-full border border-slate-200 bg-[#FDFBF7] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#161E2C] whitespace-nowrap"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Primary Actions inside Sticky Panel so CTAs always stay accessible */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href="/homes-and-businesses"
                    className="group inline-flex flex-1 min-w-[180px] h-11 items-center justify-center gap-2 rounded-full bg-[#1F7A34] px-5 text-xs sm:text-[13.5px] font-bold text-white shadow-[0_8px_20px_rgb(31_122_52/0.22)] transition hover:bg-[#186429] active:scale-95"
                  >
                    <span>Plan System / Enquire</span>
                    <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>

                  {matchedSeries?.datasheet && (
                    <a
                      href={matchedSeries.datasheet}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="brand-gradient inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-5 text-xs sm:text-[13.5px] font-bold text-[#161E2C] shadow-xs transition hover:brightness-105 active:scale-95"
                    >
                      <Download className="size-3.5" />
                      <span>Datasheet PDF</span>
                    </a>
                  )}

                  <Link
                    href={`/warranties/register?product=${product.id}`}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-xs font-bold text-[#161E2C] transition hover:border-[#D45C0A] hover:text-[#D45C0A]"
                  >
                    Register Warranty
                  </Link>
                </div>
              </div>
            </aside>

            {/* RIGHT HALF (Scrolls naturally through full engineering details) */}
            <div className="lg:col-span-6 space-y-6">
              {/* Card 1: Product Overview, Pricing / Partner Supply & Warranty */}
              <section className="rounded-[28px] border border-[#e6e2d8] bg-white p-6 sm:p-8 shadow-2xs">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#D45C0A]">
                      Engineering Overview
                    </span>
                    <h2 className="mt-1 text-2xl sm:text-[26px] font-extrabold text-[#161E2C] tracking-tight">
                      {product.priceInr > 0 ? formatInr(product.priceInr) : "Authorized Partner Supply"}
                    </h2>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">
                      {product.priceInr > 0
                        ? "MRP inclusive of all taxes · Commercial & Residential"
                        : "Configured, supplied & commissioned through Olitec partners across India"}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-[#1F7A34] border border-emerald-200/70">
                    <ShieldCheck className="size-4" />
                    <span>{formatWarrantyPeriod(product.warrantyMonths)} Warranty</span>
                  </div>
                </div>

                <p className="mt-5 text-sm sm:text-[15.5px] leading-relaxed text-[#2A323F] font-medium">
                  {product.description}
                </p>

                <div className="mt-6 flex items-start gap-3.5 rounded-2xl border border-amber-200/70 bg-[#FFF9F2] p-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-[#D45C0A]">
                    <ShieldCheck className="size-5" aria-hidden />
                  </div>
                  <div className="text-xs sm:text-sm">
                    <p className="font-bold text-[#161E2C]">
                      Factory-Backed {formatWarrantyPeriod(product.warrantyMonths)} Protection
                    </p>
                    <p className="mt-0.5 text-slate-600 leading-relaxed">
                      Covered with direct factory service support from our Katpadi, Vellore manufacturing desk and nationwide partner network.
                    </p>
                  </div>
                </div>
              </section>

              {/* Card 2: Key Engineering Features */}
              <section className="rounded-[28px] border border-[#e6e2d8] bg-white p-6 sm:p-8 shadow-2xs">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#E7F1E5] text-[#1F7A34]">
                    <Zap className="size-4.5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#161E2C]">
                      Key Engineering Features
                    </h2>
                    <p className="text-xs text-slate-500">Designed &amp; validated for Indian grid conditions</p>
                  </div>
                </div>

                <ul className="grid gap-3 sm:grid-cols-2">
                  {(product.features ?? []).map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 rounded-2xl border border-slate-100 bg-[#FDFBF7] p-3.5 text-xs sm:text-[13.5px] font-medium text-[#161E2C]"
                    >
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#1F7A34]" aria-hidden />
                      <span className="leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Card 3: Technical Specifications Table */}
              <section className="rounded-[28px] border border-[#e6e2d8] bg-white p-6 sm:p-8 shadow-2xs">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-[#D45C0A]">
                    <Cpu className="size-4.5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#161E2C]">
                      Technical Specifications
                    </h2>
                    <p className="text-xs text-slate-500">Official datasheet benchmarks</p>
                  </div>
                </div>

                <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
                  {[{ label: "Model series", value: modelList.join(" · ") || product.model }, ...(product.specs ?? [])].map(
                    (spec, i) => (
                      <div
                        key={spec.label}
                        className={cn(
                          "grid grid-cols-1 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-1 sm:gap-4 px-5 py-3.5 text-xs sm:text-sm items-baseline",
                          i % 2 === 0 ? "bg-[#FDFBF7]/70" : "bg-white",
                        )}
                      >
                        <dt className="font-medium text-slate-500">{spec.label}</dt>
                        <dd className="font-bold text-[#161E2C] sm:text-right break-words">{spec.value}</dd>
                      </div>
                    ),
                  )}
                </dl>
              </section>

              {/* Card 4: One Unified System & Compatibility */}
              <section className="rounded-[28px] border border-[#e6e2d8] bg-gradient-to-br from-[#FFF9F2] via-white to-[#F2F8F3] p-6 sm:p-8 shadow-2xs">
                <h2 className="text-lg font-bold text-[#161E2C]">
                  Built to Work as One System
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {isBattery
                    ? "The OLB-5.12 LiFePO₄ battery communicates directly over CAN/RS485 with Olitec OLI-1H single-phase and OLI-3H three-phase hybrid inverters for seamless BMS charge control."
                    : "Pair this Olitec hybrid inverter with OLB-5.12 (5.12 kWh) LFP storage packs and Tier-1 solar PV arrays for under-10 ms UPS switch-over and automated peak shaving."}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    href="/applications"
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-[#161E2C] shadow-2xs hover:border-[#D45C0A] hover:text-[#D45C0A] transition"
                  >
                    <span>See Live Applications</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                  <Link
                    href={isBattery ? "/products/oli-1h-series-3-6kw" : "/products/olb-512-lfp-battery-wall"}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-[#1F7A34] shadow-2xs hover:border-[#1F7A34] transition"
                  >
                    <span>{isBattery ? "View Compatible Hybrid Inverters" : "Pair with OLB-5.12 LFP Battery"}</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600 font-medium">Need sizing assistance from an engineer?</span>
                  <a
                    href={`tel:${siteConfig.supportPhone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-1.5 font-extrabold text-[#161E2C] hover:text-[#D45C0A]"
                  >
                    <Phone className="size-3.5 text-[#D45C0A]" />
                    <span>{siteConfig.supportPhone}</span>
                  </a>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* 3. Matching Dark Navy CtaPanel at Bottom */}
        <CtaPanel
          title="Need help sizing a system for your site?"
          body="Share your connected load and backup goals — our engineers will match the right inverter, battery capacity, and solar array."
          primary={{ href: "/homes-and-businesses", label: "Talk to our engineers" }}
          secondary={{ href: "/channel-partners", label: "Become a partner" }}
        />
      </div>
    </LegacyPage>
  );
}
