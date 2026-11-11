import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { ProductMediaViewer } from "@/components/products/ProductMediaViewer";
import { getProductBySlug, getProducts } from "@/services/products";
import { formatInr, formatWarrantyPeriod } from "@/lib/format";
import { siteConfig } from "@/lib/site";

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

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    model: product.model,
    sku: product.model,
    category: product.category,
    description: product.description,
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: { "@type": "Offer", priceCurrency: "INR", price: product.priceInr, url: `${siteConfig.url}/products/${product.slug}` },
  };

  return (
    <Container className="space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      
      <div className="reveal-on-scroll">
        <PageHeader
          title={product.name}
          description={`Model ${product.model} · ${product.category}`}
          back={{ href: "/products", label: "All products" }}
        />
      </div>

      {/* Main Product Hero Grid */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left: Product Media with Attached 3D View */}
        <div className="reveal-on-scroll lg:col-span-6 xl:col-span-5">
          <ProductMediaViewer
            category={product.category}
            name={product.name}
            model={product.model}
          />
        </div>

        {/* Right: Pricing, Warranty, Specs & Actions */}
        <div className="reveal-on-scroll reveal-delay-1 space-y-6 lg:col-span-6 xl:col-span-7">
          <Card className="p-6 sm:p-7 shadow-[0_8px_30px_rgb(0_0_0/0.03)]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-3xl font-bold tracking-tight text-slate-900">{formatInr(product.priceInr)}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">MRP inclusive of all taxes · Commercial & Residential</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                <Sparkles className="size-3.5" />
                <span>Certified Engineering</span>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">{product.description}</p>

            <div className="mt-6 flex items-start gap-3.5 rounded-2xl bg-gradient-to-r from-brand-50/70 to-brand-50/30 p-4 border border-brand-200/50">
              <ShieldCheck className="size-6 shrink-0 text-brand-600 mt-0.5" aria-hidden />
              <div className="text-sm">
                <p className="font-semibold text-brand-950">{formatWarrantyPeriod(product.warrantyMonths)} manufacturer warranty</p>
                <p className="text-brand-900/80 text-xs sm:text-sm mt-0.5">
                  Full warranty protection with prompt on-site replacement and direct factory customer support.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={`/warranties/register?product=${product.id}`} size="lg">
                Register this product
              </ButtonLink>
              <ButtonLink href="/support" variant="secondary" size="lg">
                Request Quote / Enquire
              </ButtonLink>
            </div>
          </Card>

          {/* Key Features */}
          <Card className="shadow-[0_8px_30px_rgb(0_0_0/0.03)]">
            <CardHeader title="Key engineering features" description="Designed & tested for continuous performance" />
            <ul className="grid gap-3.5 p-6 sm:grid-cols-2">
              {product.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm font-medium text-slate-700">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
          </Card>

          {/* Technical Specifications */}
          <Card className="shadow-[0_8px_30px_rgb(0_0_0/0.03)]">
            <CardHeader title="Technical specifications" description="Engineering datasheet benchmarks" />
            <dl className="divide-y divide-slate-100">
              {[{ label: "Model number", value: product.model }, ...product.specs].map((spec) => (
                <div key={spec.label} className="grid grid-cols-2 gap-4 px-6 py-3.5 text-sm">
                  <dt className="text-slate-500 font-medium">{spec.label}</dt>
                  <dd className="font-semibold text-slate-900">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </Container>
  );
}
