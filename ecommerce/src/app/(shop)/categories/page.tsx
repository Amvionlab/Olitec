import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Sun } from "lucide-react";
import { Container, EmptyState } from "@/components/ui";
import { getCategories } from "@/services/catalog";

export const metadata: Metadata = { title: "All categories", alternates: { canonical: "/categories" } };

export default async function CategoriesPage() {
  const categories = await getCategories().catch(() => []);
  return (
    <Container className="space-y-6 py-8">
      <h1 className="text-3xl font-bold text-slate-900">All categories</h1>
      {categories.length === 0 ? (
        <EmptyState title="No categories yet">Categories will appear here once they are published.</EmptyState>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div key={category.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <Link href={`/categories/${category.slug}`} className="flex items-center gap-4 p-5 hover:bg-slate-50">
                <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50">
                  {category.imageUrl ? <Image src={category.imageUrl} alt="" fill sizes="64px" className="object-cover" /> : <Sun className="size-7 text-brand-500" aria-hidden />}
                </span>
                <span>
                  <span className="block text-lg font-semibold text-slate-900">{category.name}</span>
                  <span className="text-sm text-slate-500">{category.productCount} products</span>
                </span>
              </Link>
              {category.children.length > 0 && (
                <ul className="flex flex-wrap gap-2 border-t border-slate-100 p-4">
                  {category.children.map((child) => (
                    <li key={child.id}>
                      <Link href={`/categories/${child.slug}`} className="inline-block rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700">
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
