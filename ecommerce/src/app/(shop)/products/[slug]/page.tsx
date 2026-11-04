import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, ShieldCheck, Truck } from "lucide-react";
import { Container, Price, Stars, StockBadge } from "@/components/ui";
import { AddToCart } from "@/components/product/AddToCart";
import { DeliveryCheck } from "@/components/product/DeliveryCheck";
import { Gallery } from "@/components/product/Gallery";
import { ProductGrid } from "@/components/product/ProductCard";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { Reviews } from "@/components/product/Reviews";
import { getProduct } from "@/services/catalog";
import { cn, paragraphs, SITE_URL } from "@/utils/format";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.seo.title,
    description: product.seo.description || `${product.name} — buy online at OLITEC Shop.`,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.seo.title, description: product.seo.description, images: product.images.slice(0, 1).map((image) => ({ url: image.url })) },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();

  // Structured data only states facts we hold: name, SKU, price, availability and (approved) ratings.
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.seo.description || product.shortDescription || undefined,
    image: product.images.map((image) => image.url),
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: "INR",
      price: product.sellingPrice.toFixed(2),
      availability: product.stockStatus === "out_of_stock" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
    aggregateRating: product.rating.count > 0 ? { "@type": "AggregateRating", ratingValue: product.rating.average.toFixed(1), reviewCount: product.rating.count } : undefined,
  };

  return (
    <Container className="space-y-14 py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <div>
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-brand-700">Home</Link> /
            </li>
            {product.breadcrumbs.map((crumb) => (
              <li key={crumb.slug}>
                <Link href={`/categories/${crumb.slug}`} className="hover:text-brand-700">{crumb.name}</Link> /
              </li>
            ))}
            <li aria-current="page" className="line-clamp-1 text-slate-900">{product.name}</li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <Gallery images={product.images} name={product.name} />
          <div className="space-y-5">
            <div>
              {product.brand && <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">{product.brand.name}</p>}
              <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{product.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>SKU: {product.sku}</span>
                {product.rating.count > 0 && (
                  <a href="#reviews" className="hover:text-brand-700">
                    <Stars value={product.rating.average} count={product.rating.count} />
                  </a>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Price price={product.sellingPrice} mrp={product.mrp} size="lg" />
              <p className="text-xs text-slate-500">Inclusive of GST ({product.taxRate}%)</p>
            </div>

            <StockBadge status={product.stockStatus} />

            {product.variants.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">Options</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <Link
                      key={variant.slug}
                      href={`/products/${variant.slug}`}
                      aria-current={variant.current ? "page" : undefined}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm",
                        variant.current ? "border-brand-500 bg-brand-50 font-semibold text-brand-800" : "border-slate-300 bg-white hover:border-slate-400",
                        variant.stockStatus === "out_of_stock" && "text-slate-400 line-through",
                      )}
                    >
                      {Object.values(variant.attributes).join(" · ") || variant.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {product.shortDescription && <p className="text-slate-700">{product.shortDescription}</p>}

            <AddToCart product={product} />

            <div className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <DeliveryCheck />
              {product.deliveryInfo && (
                <p className="flex gap-2 text-sm text-slate-700">
                  <Truck className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden /> {product.deliveryInfo}
                </p>
              )}
              {product.warrantyInfo && (
                <p className="flex gap-2 text-sm text-slate-700">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden /> {product.warrantyInfo}
                </p>
              )}
              <p className="flex gap-2 text-sm text-slate-700">
                <FileText className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden /> GST invoice available for every order
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <h2 className="text-2xl font-bold text-slate-900">Description</h2>
          {product.description ? paragraphs(product.description).map((text, index) => <p key={index} className="whitespace-pre-line text-slate-700">{text}</p>) : <p className="text-slate-500">No description yet.</p>}
          {product.features.length > 0 && (
            <>
              <h3 className="pt-2 text-lg font-semibold text-slate-900">Key features</h3>
              <ul className="list-disc space-y-1 pl-5 text-slate-700">
                {product.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </>
          )}
        </section>
        {product.specifications.length > 0 && (
          <section>
            <h2 className="mb-4 text-2xl font-bold text-slate-900">Specifications</h2>
            <dl className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
              {product.specifications.map((spec) => (
                <div key={`${spec.label}-${spec.value}`} className="grid grid-cols-2 gap-4 px-4 py-3 text-sm">
                  <dt className="font-medium text-slate-500">{spec.label}</dt>
                  <dd className="text-slate-900">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>

      <div id="reviews">
        <Reviews slug={product.slug} average={product.rating.average} count={product.rating.count} />
      </div>

      {product.related.length > 0 && (
        <section>
          <h2 className="mb-5 text-2xl font-bold text-slate-900">Related products</h2>
          <ProductGrid products={product.related.slice(0, 4)} />
        </section>
      )}
      <RecentlyViewed excludeId={product.id} recordId={product.id} />
    </Container>
  );
}
