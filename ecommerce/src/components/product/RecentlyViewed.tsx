"use client";

import { useEffect, useState } from "react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { api, toQuery } from "@/services/api";
import type { ProductSummary } from "@/types";
import { ProductGrid } from "./ProductCard";

/** "Recently viewed" / "Recommended for you" row, from products this browser viewed. Renders nothing when empty. */
export function RecentlyViewed({ title = "Recently viewed", excludeId, recordId }: { title?: string; excludeId?: number; recordId?: number }) {
  const { ids, record } = useRecentlyViewed();
  const [products, setProducts] = useState<ProductSummary[]>([]);

  useEffect(() => {
    if (recordId) record(recordId);
  }, [recordId, record]);

  const wanted = ids.filter((id) => id !== excludeId).slice(0, 8);
  const key = wanted.join(",");
  useEffect(() => {
    if (!key) return setProducts([]);
    api
      .get<ProductSummary[]>(`/products${toQuery({ ids: key, pageSize: 8 })}`)
      .then((items) => setProducts(key.split(",").map(Number).map((id) => items.find((item) => item.id === id)).filter((item): item is ProductSummary => Boolean(item))))
      .catch(() => setProducts([]));
  }, [key]);

  if (!products.length) return null;
  return (
    <section>
      <h2 className="mb-5 text-2xl font-bold text-slate-900">{title}</h2>
      <ProductGrid products={products} />
    </section>
  );
}
