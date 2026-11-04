import { Suspense } from "react";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { EmptyState, ButtonLink } from "@/components/ui";
import { ProductGrid } from "@/components/product/ProductCard";
import { getFacets, listProducts, type ListingParams } from "@/services/catalog";
import { Filters, SortAndView } from "./Filters";

export type SearchParams = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const num = (value: string | string[] | undefined) => {
  const parsed = Number(one(value));
  return Number.isFinite(parsed) && parsed >= 0 && one(value) !== undefined && one(value) !== "" ? parsed : undefined;
};

export function parseListing(search: SearchParams, category?: string): ListingParams & { view: "grid" | "list" } {
  const spec = search.spec;
  return {
    q: one(search.q)?.slice(0, 100),
    category: category ?? one(search.category),
    brand: one(search.brand),
    minPrice: num(search.minPrice),
    maxPrice: num(search.maxPrice),
    inStock: one(search.inStock) === "true" || undefined,
    flag: ["featured", "best_seller", "new_arrival", "on_offer"].includes(one(search.flag) ?? "") ? one(search.flag) : undefined,
    spec: (Array.isArray(spec) ? spec : spec ? [spec] : []).slice(0, 10),
    sort: ["relevance", "price_asc", "price_desc", "newest", "popularity", "rating"].includes(one(search.sort) ?? "") ? one(search.sort) : undefined,
    page: Math.max(1, Math.floor(num(search.page) ?? 1)),
    view: one(search.view) === "list" ? "list" : "grid",
  };
}

function pageHref(basePath: string, search: SearchParams, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (key === "page" || value === undefined) continue;
    (Array.isArray(value) ? value : [value]).forEach((item) => params.append(key, item));
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** Product listing used by /products and /categories/[slug]. Results, filters and paging all come from the API. */
export async function Listing({ title, description, basePath, search, category }: { title: string; description?: string | null; basePath: string; search: SearchParams; category?: string }) {
  const params = parseListing(search, category);
  const { view, ...query } = params;
  const [{ items, meta }, facets] = await Promise.all([listProducts(query), getFacets({ q: query.q, category: query.category })]);
  const page = meta.page ?? 1;
  const pageCount = meta.pageCount ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-slate-600">{description}</p>}
      </div>
      <div className="flex gap-8">
        <Suspense>
          <div className="contents">
            <Filters facets={facets} />
          </div>
        </Suspense>
        <div className="min-w-0 flex-1 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600" aria-live="polite">
              {meta.total ?? 0} product{meta.total === 1 ? "" : "s"}
              {query.q && (
                <>
                  {" "}
                  for “<span className="font-semibold text-slate-900">{query.q}</span>”
                </>
              )}
            </p>
            <Suspense>
              <SortAndView />
            </Suspense>
          </div>
          {items.length === 0 ? (
            <EmptyState icon={<PackageSearch className="size-10" />} title="No products found" action={<ButtonLink href={basePath} variant="secondary">Clear filters</ButtonLink>}>
              Try a different search term or remove some filters.
            </EmptyState>
          ) : (
            <ProductGrid products={items} layout={view} priorityCount={4} />
          )}
          {pageCount > 1 && (
            <nav className="flex items-center justify-center gap-1 pt-4" aria-label="Pagination">
              {page > 1 && (
                <Link href={pageHref(basePath, search, page - 1)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50" rel="prev">
                  Previous
                </Link>
              )}
              {Array.from({ length: pageCount }, (_, index) => index + 1)
                .filter((number) => number === 1 || number === pageCount || Math.abs(number - page) <= 2)
                .map((number, index, list) => (
                  <span key={number} className="flex items-center gap-1">
                    {index > 0 && number - list[index - 1] > 1 && <span className="px-1 text-slate-400">…</span>}
                    <Link
                      href={pageHref(basePath, search, number)}
                      aria-current={number === page ? "page" : undefined}
                      className={number === page ? "rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white" : "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"}
                    >
                      {number}
                    </Link>
                  </span>
                ))}
              {page < pageCount && (
                <Link href={pageHref(basePath, search, page + 1)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50" rel="next">
                  Next
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
