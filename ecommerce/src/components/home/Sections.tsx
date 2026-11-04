import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, CreditCard, FileText, Quote, ShieldCheck, Sun, Truck } from "lucide-react";
import { ProductGrid } from "@/components/product/ProductCard";
import type { Category, ContentBlock, ProductSummary } from "@/types";

export function SectionHeading({ title, href, linkLabel = "View all" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
          {linkLabel} <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function ProductSection({ title, href, products }: { title: string; href?: string; products: ProductSummary[] }) {
  if (!products.length) return null;
  return (
    <section>
      <SectionHeading title={title} href={href} />
      <ProductGrid products={products.slice(0, 8)} />
    </section>
  );
}

export function CategoryCards({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;
  return (
    <section>
      <SectionHeading title="Shop by category" href="/categories" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((category) => (
          <Link key={category.id} href={`/categories/${category.slug}`} className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-center transition hover:border-brand-300 hover:shadow-md">
            <span className="relative flex size-20 items-center justify-center overflow-hidden rounded-full bg-brand-50">
              {category.imageUrl ? <Image src={category.imageUrl} alt="" fill sizes="80px" className="object-cover" /> : <Sun className="size-8 text-brand-500" aria-hidden />}
            </span>
            <span className="text-sm font-semibold text-slate-900 group-hover:text-brand-700">{category.name}</span>
            <span className="text-xs text-slate-500">{category.productCount} products</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function PromoTiles({ promos }: { promos: ContentBlock[] }) {
  if (!promos.length) return null;
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {promos.slice(0, 4).map((promo) => (
        <div key={promo.id} className="relative overflow-hidden rounded-2xl bg-brand-50 p-6 ring-1 ring-brand-100">
          {promo.imageUrl && <Image src={promo.imageUrl} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover opacity-25" />}
          <div className="relative space-y-2">
            <h3 className="text-xl font-bold text-slate-900">{promo.title}</h3>
            {promo.subtitle && <p className="text-sm text-slate-700">{promo.subtitle}</p>}
            {promo.linkUrl && (
              <Link href={promo.linkUrl} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                {promo.linkLabel || "Explore"} <ArrowRight className="size-4" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

/**
 * Trust strip. Badges managed in the CMS are shown when present; otherwise only statements that are true of the
 * platform itself (secure gateway, GST invoice, order tracking) — never delivery, warranty or refund promises.
 */
export function TrustStrip({ badges }: { badges: ContentBlock[] }) {
  const items = badges.length
    ? badges.map((badge) => ({ key: String(badge.id), icon: BadgeCheck, title: badge.title, text: badge.subtitle }))
    : [
        { key: "secure", icon: CreditCard, title: "Secure payments", text: "UPI, cards and net banking through a trusted gateway" },
        { key: "gst", icon: FileText, title: "GST invoice", text: "Download a tax invoice for every order" },
        { key: "track", icon: Truck, title: "Order tracking", text: "Follow your order from confirmation to delivery" },
        { key: "bulk", icon: ShieldCheck, title: "Bulk quotations", text: "Request pricing for project quantities" },
      ];
  return (
    <section aria-label="Why shop with us" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ key, icon: Icon, title, text }) => (
        <div key={key} className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <span className="rounded-xl bg-brand-50 p-2.5 text-brand-600">
            <Icon className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            {text && <p className="text-xs text-slate-600">{text}</p>}
          </div>
        </div>
      ))}
    </section>
  );
}

export function BulkCta() {
  return (
    <section className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-forest p-8 text-white md:flex-row md:items-center md:p-10">
      <div className="flex items-start gap-4">
        <span className="rounded-2xl bg-white/10 p-3">
          <Building2 className="size-7 text-brand-300" aria-hidden />
        </span>
        <div>
          <h2 className="text-2xl font-bold">Buying for a project or business?</h2>
          <p className="mt-1 max-w-xl text-slate-300">Tell us what you need and our team will send a quotation for bulk quantities, with GST invoicing.</p>
        </div>
      </div>
      <Link href="/bulk-purchase" className="inline-flex h-12 shrink-0 items-center rounded-lg bg-brand-500 px-6 font-semibold hover:bg-brand-600">
        Request a quote
      </Link>
    </section>
  );
}

export function Testimonials({ testimonials }: { testimonials: ContentBlock[] }) {
  if (!testimonials.length) return null;
  return (
    <section>
      <SectionHeading title="What customers say" />
      <div className="scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
        {testimonials.map((item) => (
          <figure key={item.id} className="w-80 shrink-0 snap-start rounded-2xl bg-white p-6 ring-1 ring-slate-200">
            <Quote className="mb-3 size-6 text-brand-400" aria-hidden />
            <blockquote className="text-sm text-slate-700">{item.body ?? item.title}</blockquote>
            <figcaption className="mt-4 text-sm font-semibold text-slate-900">
              {item.authorName ?? item.title}
              {item.subtitle && <span className="block text-xs font-normal text-slate-500">{item.subtitle}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function FaqList({ faqs, limit }: { faqs: ContentBlock[]; limit?: number }) {
  if (!faqs.length) return null;
  return (
    <div className="divide-y divide-slate-200 rounded-2xl bg-white ring-1 ring-slate-200">
      {faqs.slice(0, limit).map((faq) => (
        <details key={faq.id} className="group p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
            {faq.title}
            <span className="text-xl text-brand-600 transition group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{faq.body}</p>
        </details>
      ))}
    </div>
  );
}
