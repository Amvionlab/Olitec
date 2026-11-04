"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Grid2x2, List, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui";
import type { Facets } from "@/types";
import { cn, formatPrice } from "@/utils/format";

function useUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const update = (changes: Record<string, string | string[] | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      next.delete(key);
      if (Array.isArray(value)) value.forEach((item) => next.append(key, item));
      else if (value) next.set(key, value);
    }
    if (!("page" in changes)) next.delete("page");
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };
  return { params, update };
}

/** Sidebar filters: brand, price, availability and specification facets from the API. */
export function Filters({ facets }: { facets: Facets }) {
  const { params, update } = useUrlState();
  const [open, setOpen] = useState(false);
  const brands = (params.get("brand") ?? "").split(",").filter(Boolean);
  const specs = params.getAll("spec");
  const [minPrice, setMinPrice] = useState(params.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") ?? "");
  const active = brands.length + specs.length + (params.get("minPrice") ? 1 : 0) + (params.get("maxPrice") ? 1 : 0) + (params.get("inStock") ? 1 : 0);

  const toggleBrand = (slug: string) => {
    const next = brands.includes(slug) ? brands.filter((brand) => brand !== slug) : [...brands, slug];
    update({ brand: next.join(",") || null });
  };
  const toggleSpec = (value: string) => update({ spec: specs.includes(value) ? specs.filter((spec) => spec !== value) : [...specs, value] });

  const panel = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Filters</h2>
        {active > 0 && (
          <button className="text-sm font-medium text-brand-700 hover:underline" onClick={() => update({ brand: null, spec: null, minPrice: null, maxPrice: null, inStock: null })}>
            Clear all
          </button>
        )}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-slate-900">Availability</legend>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="size-4 accent-brand-500" checked={params.get("inStock") === "true"} onChange={(event) => update({ inStock: event.target.checked ? "true" : null })} />
          In stock only
        </label>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-slate-900">Price</legend>
        {facets.price.max > 0 && (
          <p className="mb-2 text-xs text-slate-500">
            {formatPrice(facets.price.min)} – {formatPrice(facets.price.max)}
          </p>
        )}
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            update({ minPrice: minPrice || null, maxPrice: maxPrice || null });
          }}
        >
          <input type="number" min={0} value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Min" aria-label="Minimum price" className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
          <span className="text-slate-400">–</span>
          <input type="number" min={0} value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Max" aria-label="Maximum price" className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
          <Button type="submit" size="sm" variant="secondary">
            Go
          </Button>
        </form>
      </fieldset>

      {facets.brands.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-900">Brand</legend>
          <div className="space-y-1.5">
            {facets.brands.map((brand) => (
              <label key={brand.slug} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="size-4 accent-brand-500" checked={brands.includes(brand.slug)} onChange={() => toggleBrand(brand.slug)} />
                <span className="flex-1">{brand.name}</span>
                <span className="text-xs text-slate-400">{brand.count}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {facets.specifications.map((spec) => (
        <fieldset key={spec.label}>
          <legend className="mb-2 text-sm font-semibold text-slate-900">{spec.label}</legend>
          <div className="space-y-1.5">
            {spec.values.map(({ value, count }) => {
              const key = `${spec.label}:${value}`;
              return (
                <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="size-4 accent-brand-500" checked={specs.includes(key)} onChange={() => toggleSpec(key)} />
                  <span className="flex-1">{value}</span>
                  <span className="text-xs text-slate-400">{count}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );

  return (
    <>
      <Button variant="secondary" className="lg:hidden" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="size-4" aria-hidden /> Filters{active > 0 && ` (${active})`}
      </Button>
      <aside className="hidden w-64 shrink-0 lg:block">{panel}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} aria-label="Close filters" tabIndex={-1} />
          <div className="absolute inset-y-0 right-0 w-80 max-w-[90%] overflow-y-auto bg-white p-5">
            <button className="absolute right-3 top-3 rounded-lg p-2 hover:bg-slate-100" onClick={() => setOpen(false)} aria-label="Close filters">
              <X className="size-5" />
            </button>
            {panel}
            <Button className="mt-6 w-full" onClick={() => setOpen(false)}>
              Show results
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

const SORTS = [
  ["relevance", "Relevance"],
  ["popularity", "Popularity"],
  ["newest", "Newest"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
  ["rating", "Customer rating"],
] as const;

export function SortAndView() {
  const { params, update } = useUrlState();
  const view = params.get("view") === "list" ? "list" : "grid";
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="sr-only">
        Sort by
      </label>
      <select id="sort" value={params.get("sort") ?? "relevance"} onChange={(event) => update({ sort: event.target.value === "relevance" ? null : event.target.value })} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm">
        {SORTS.map(([value, label]) => (
          <option key={value} value={value}>
            Sort: {label}
          </option>
        ))}
      </select>
      <div className="hidden overflow-hidden rounded-lg border border-slate-300 sm:flex" role="group" aria-label="Layout">
        {(["grid", "list"] as const).map((mode) => {
          const Icon = mode === "grid" ? Grid2x2 : List;
          return (
            <button key={mode} onClick={() => update({ view: mode === "grid" ? null : "list", page: params.get("page") })} aria-pressed={view === mode} aria-label={`${mode} view`} className={cn("p-2.5", view === mode ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50")}>
              <Icon className="size-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
