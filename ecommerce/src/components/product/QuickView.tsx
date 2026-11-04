"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Alert, Price, Spinner, StockBadge } from "@/components/ui";
import { api, errorMessage } from "@/services/api";
import type { ProductDetail } from "@/types";
import { AddToCart } from "./AddToCart";
import { ProductImage } from "./ProductImage";

/** Modal product preview from listings. Esc / backdrop closes it; focus moves into the dialog. */
export function QuickView({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<ProductDetail>(`/products/${slug}`).then(setProduct).catch((reason) => setError(errorMessage(reason)));
  }, [slug]);

  useEffect(() => {
    dialog.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Quick view">
      <button className="absolute inset-0 bg-slate-900/60" onClick={onClose} aria-label="Close quick view" tabIndex={-1} />
      <div ref={dialog} tabIndex={-1} className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white p-5 outline-none sm:rounded-2xl sm:p-6">
        <button onClick={onClose} className="absolute right-3 top-3 z-10 rounded-full p-2 hover:bg-slate-100" aria-label="Close">
          <X className="size-5" />
        </button>
        {error ? (
          <Alert>{error}</Alert>
        ) : !product ? (
          <Spinner />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <ProductImage src={product.images[0]?.url ?? product.image} alt={product.name} sizes="(min-width: 640px) 360px, 90vw" className="aspect-square rounded-xl" />
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{product.brand?.name ?? product.category.name}</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{product.name}</h2>
                <p className="text-xs text-slate-500">SKU: {product.sku}</p>
              </div>
              <Price price={product.sellingPrice} mrp={product.mrp} size="lg" />
              <p className="text-xs text-slate-500">Inclusive of all taxes</p>
              <StockBadge status={product.stockStatus} />
              {product.shortDescription && <p className="text-sm text-slate-600">{product.shortDescription}</p>}
              <AddToCart product={product} compact />
              <Link href={`/products/${product.slug}`} className="inline-block text-sm font-semibold text-brand-700 hover:underline">
                View full details →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
