import { Alert, Container } from "@/components/ui";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { BulkCta, CategoryCards, FaqList, ProductSection, PromoTiles, SectionHeading, Testimonials, TrustStrip } from "@/components/home/Sections";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { getHome } from "@/services/catalog";
import { SITE_URL } from "@/utils/format";

export const revalidate = 60;

export default async function HomePage() {
  const home = await getHome().catch(() => null);
  if (!home) {
    return (
      <Container className="py-16">
        <Alert>The store is temporarily unavailable. Please try again in a few minutes.</Alert>
      </Container>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: home.settings.store.name,
    url: SITE_URL,
    potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/products?q={search_term_string}`, "query-input": "required name=search_term_string" },
  };

  return (
    <Container className="space-y-14 py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      {home.banners.length > 0 ? (
        <BannerCarousel banners={home.banners} />
      ) : (
        <section className="rounded-3xl bg-forest p-10 text-white">
          <h1 className="text-3xl font-bold sm:text-4xl">Solar products, delivered.</h1>
          <p className="mt-2 max-w-xl text-slate-300">Panels, inverters, batteries and accessories from OLITEC — with secure payments and GST invoices.</p>
        </section>
      )}
      {home.banners.length > 0 && <h1 className="sr-only">{home.settings.store.name}</h1>}
      <TrustStrip badges={home.trustBadges} />
      <CategoryCards categories={home.categories} />
      <ProductSection title="Featured products" href="/products?flag=featured" products={home.featured} />
      <PromoTiles promos={home.promos} />
      <ProductSection title="Best sellers" href="/products?flag=best_seller&sort=popularity" products={home.bestSellers} />
      <ProductSection title="Special offers" href="/products?flag=on_offer" products={home.offers} />
      <ProductSection title="New arrivals" href="/products?flag=new_arrival&sort=newest" products={home.newArrivals} />
      <RecentlyViewed title="Recommended for you" />
      <BulkCta />
      <Testimonials testimonials={home.testimonials} />
      {home.faqs.length > 0 && (
        <section>
          <SectionHeading title="Frequently asked questions" href="/faqs" />
          <FaqList faqs={home.faqs} limit={6} />
        </section>
      )}
    </Container>
  );
}
