"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { TBody, THead, Table, Td, Th } from "@/components/ui/Table";
import { useEcom } from "@/components/ecommerce/EcomSession";
import { LoadState, Pager, RequirePermission, StatusPill, Thumb, inputClass, useApi, useUrlFilters } from "@/components/ecommerce/kit";
import { money, qs } from "@/services/ecommerce/api";

interface Row {
  id: number;
  slug: string;
  sku: string;
  name: string;
  image: string | null;
  mrp: number;
  sellingPrice: number;
  category: { name: string };
  status: string;
  stockQty: number;
  reservedQty: number;
  available: number;
  lowStockThreshold: number;
  flags: { featured: boolean; bestSeller: boolean; newArrival: boolean; onOffer: boolean };
}

function ProductsContent() {
  const { can } = useEcom();
  const { get, set } = useUrlFilters();
  const { data: categories } = useApi<{ id: number; name: string; parentId: number | null }[]>("/admin/categories");
  const { data, meta, error, loading } = useApi<Row[]>(
    `/admin/products${qs({ q: get("q"), status: get("status"), categoryId: get("categoryId"), stock: get("stock"), sort: get("sort") || "newest", page: get("page") || 1, pageSize: 20 })}`,
  );

  return (
    <>
      <PageHeader
        title="Products"
        description="Catalogue shown on the shop. Stock is changed from Inventory so every movement is recorded."
        actions={can("products.manage") && <ButtonLink href="/ecommerce/products/new"><Plus className="size-4" aria-hidden /> Add product</ButtonLink>}
      />
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row">
          <form
            className="relative flex-1"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              set({ q: new FormData(event.currentTarget).get("q") as string });
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input name="q" type="search" defaultValue={get("q")} placeholder="Search name or SKU" aria-label="Search products" className={`${inputClass} pl-9`} />
          </form>
          <select aria-label="Status" className={`${inputClass} lg:w-40`} value={get("status")} onChange={(event) => set({ status: event.target.value })}>
            <option value="">Status: all (not archived)</option>
            {["active", "draft", "inactive", "archived"].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select aria-label="Category" className={`${inputClass} lg:w-48`} value={get("categoryId")} onChange={(event) => set({ categoryId: event.target.value })}>
            <option value="">Category: all</option>
            {categories?.map((category) => <option key={category.id} value={category.id}>{category.parentId ? "— " : ""}{category.name}</option>)}
          </select>
          <select aria-label="Stock" className={`${inputClass} lg:w-36`} value={get("stock")} onChange={(event) => set({ stock: event.target.value })}>
            <option value="">Stock: all</option>
            <option value="in">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
          <select aria-label="Sort" className={`${inputClass} lg:w-40`} value={get("sort") || "newest"} onChange={(event) => set({ sort: event.target.value })}>
            <option value="newest">Newest</option>
            <option value="name">Name</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
            <option value="stock_asc">Stock ↑</option>
          </select>
        </div>
        <LoadState loading={loading} error={error} empty={!data}>
          {data && data.length === 0 ? (
            <EmptyState title="No products found" description="Change the filters or add a product." />
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Product</Th>
                  <Th>Category</Th>
                  <Th className="text-right">Price</Th>
                  <Th className="text-right">Available</Th>
                  <Th>Status</Th>
                  <Th>Flags</Th>
                </tr>
              </THead>
              <TBody>
                {data?.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <Td>
                      <Link href={`/ecommerce/products/${row.id}`} className="flex items-center gap-3">
                        <Thumb src={row.image} />
                        <span>
                          <span className="block font-medium text-slate-900 hover:text-brand-700">{row.name}</span>
                          <span className="text-xs text-slate-500">{row.sku}</span>
                        </span>
                      </Link>
                    </Td>
                    <Td>{row.category.name}</Td>
                    <Td className="text-right">
                      <span className="font-medium">{money(row.sellingPrice)}</span>
                      {row.mrp > row.sellingPrice && <span className="block text-xs text-slate-400 line-through">{money(row.mrp)}</span>}
                    </Td>
                    <Td className="text-right">
                      <span className={row.available <= 0 ? "font-semibold text-red-600" : row.available <= row.lowStockThreshold ? "font-semibold text-amber-600" : ""}>{row.available}</span>
                      {row.reservedQty > 0 && <span className="block text-xs text-slate-500">{row.reservedQty} reserved</span>}
                    </Td>
                    <Td><StatusPill status={row.status} /></Td>
                    <Td className="text-xs text-slate-500">
                      {[row.flags.featured && "Featured", row.flags.bestSeller && "Best seller", row.flags.newArrival && "New", row.flags.onOffer && "Offer"].filter(Boolean).join(" · ") || "—"}
                    </Td>
                  </tr>
                ))}
              </TBody>
            </Table>
          )}
          <Pager meta={meta} onPage={(page) => set({ page })} />
        </LoadState>
      </Card>
    </>
  );
}

export default function ProductsPage() {
  return (
    <RequirePermission permission="products.view">
      <Suspense>
        <ProductsContent />
      </Suspense>
    </RequirePermission>
  );
}
