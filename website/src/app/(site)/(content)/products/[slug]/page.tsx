import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { ProductImage } from "@/components/products/ProductImage";
import { getProductBySlug, getProducts } from "@/services/products";
import { formatInr, formatWarrantyPeriod } from "@/lib/format";
import { siteConfig } from "@/lib/site";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// Only slugs returned below exist; anything else is a real HTTP 404. Revisit when products come from the API.
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
    <Container>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <PageHeader title={product.name} description={`Model ${product.model} · ${product.category}`} back={{ href: "/products", label: "All products" }} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card className="p-4">
            <ProductImage category={product.category} name={product.name} size="lg" />
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-3">
          <Card className="p-6">
            <p className="text-2xl font-semibold text-slate-900">{formatInr(product.priceInr)}</p>
            <p className="mt-1 text-xs text-slate-500">MRP inclusive of all taxes</p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{product.description}</p>
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-brand-50 p-4">
              <ShieldCheck className="size-6 shrink-0 text-brand-600" aria-hidden />
              <div className="text-sm">
                <p className="font-medium text-brand-900">{formatWarrantyPeriod(product.warrantyMonths)} manufacturer warranty</p>
                <p className="text-brand-800/80">Starts from your purchase date once the registration is approved.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <ButtonLink href={`/warranties/register?product=${product.id}`}>Register this product</ButtonLink>
              <ButtonLink href="/support" variant="secondary">
                Ask a question
              </ButtonLink>
            </div>
          </Card>

          <Card>
            <CardHeader title="Key features" />
            <ul className="grid gap-3 p-5 sm:grid-cols-2">
              {product.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Specifications" />
            <dl className="divide-y divide-slate-100">
              {[{ label: "Model number", value: product.model }, ...product.specs].map((spec) => (
                <div key={spec.label} className="grid grid-cols-2 gap-4 px-5 py-3 text-sm">
                  <dt className="text-slate-500">{spec.label}</dt>
                  <dd className="font-medium text-slate-900">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </Container>
  );
}
