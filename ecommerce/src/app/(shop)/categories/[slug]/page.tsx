import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui";
import { Listing, type SearchParams } from "@/components/listing/Listing";
import { getCategory } from "@/services/catalog";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  if (!category) return { title: "Category not found" };
  return {
    title: category.seoTitle ?? category.name,
    description: category.seoDescription ?? category.description ?? `Shop ${category.name} online at OLITEC Shop.`,
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const category = await getCategory(slug);
  if (!category) notFound();

  return (
    <Container className="space-y-6 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-brand-700">Home</Link> /
          </li>
          {(category.breadcrumbs ?? []).map((crumb, index, list) => (
            <li key={crumb.slug}>
              {index === list.length - 1 ? (
                <span aria-current="page" className="text-slate-900">{crumb.name}</span>
              ) : (
                <>
                  <Link href={`/categories/${crumb.slug}`} className="hover:text-brand-700">{crumb.name}</Link> /
                </>
              )}
            </li>
          ))}
        </ol>
      </nav>
      {category.children.length > 0 && (
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
          {category.children.map((child) => (
            <Link key={child.id} href={`/categories/${child.slug}`} className="shrink-0 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:border-brand-400 hover:text-brand-700">
              {child.name} <span className="text-slate-400">({child.productCount})</span>
            </Link>
          ))}
        </div>
      )}
      <Listing title={category.name} description={category.description} basePath={`/categories/${category.slug}`} search={search} category={category.slug} />
    </Container>
  );
}
