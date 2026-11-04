"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Heart, ShoppingCart } from "lucide-react";
import { Button, Price, Stars, StockBadge } from "@/components/ui";
import { useStore } from "@/store/StoreProvider";
import type { ProductSummary } from "@/types";
import { cn } from "@/utils/format";
import { ProductImage } from "./ProductImage";
import { QuickView } from "./QuickView";

export function ProductCard({ product, layout = "grid", priority }: { product: ProductSummary; layout?: "grid" | "list"; priority?: boolean }) {
  const { addToCart, toggleWishlist, wishlistIds } = useStore();
  const [adding, setAdding] = useState(false);
  const [quickView, setQuickView] = useState(false);
  const saved = wishlistIds.has(product.id);
  const soldOut = product.stockStatus === "out_of_stock";

  const add = async () => {
    setAdding(true);
    await addToCart(product.id, 1);
    setAdding(false);
  };

  return (
    <article className={cn("group relative flex overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-lg", layout === "grid" ? "flex-col" : "flex-col sm:flex-row")}>
      <div className={cn("relative", layout === "list" && "sm:w-56 sm:shrink-0")}>
        <Link href={`/products/${product.slug}`} tabIndex={-1} aria-hidden>
          <ProductImage src={product.image} alt={product.name} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" priority={priority} className="aspect-square" />
        </Link>
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.discountPercent > 0 && <span className="rounded-md bg-leaf px-2 py-0.5 text-xs font-bold text-white">{product.discountPercent}% OFF</span>}
          {product.flags.newArrival && <span className="rounded-md bg-forest px-2 py-0.5 text-xs font-bold text-white">NEW</span>}
          {product.flags.bestSeller && <span className="rounded-md bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">BESTSELLER</span>}
        </div>
        <div className="absolute right-2 top-2 flex flex-col gap-1.5">
          <button
            onClick={() => void toggleWishlist(product.id)}
            className="rounded-full bg-white/90 p-2 shadow-sm ring-1 ring-slate-200 hover:bg-white"
            aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
            aria-pressed={saved}
          >
            <Heart className={cn("size-4", saved ? "fill-red-500 text-red-500" : "text-slate-600")} />
          </button>
          <button
            onClick={() => setQuickView(true)}
            className="rounded-full bg-white/90 p-2 shadow-sm ring-1 ring-slate-200 hover:bg-white sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
            aria-label={`Quick view ${product.name}`}
          >
            <Eye className="size-4 text-slate-600" />
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{product.brand?.name ?? product.category.name}</p>
        <h3 className="line-clamp-2 font-semibold leading-snug text-slate-900">
          <Link href={`/products/${product.slug}`} className="hover:text-brand-700">
            {product.name}
          </Link>
        </h3>
        <p className="text-xs text-slate-500">SKU: {product.sku}</p>
        {product.rating.count > 0 && <Stars value={product.rating.average} count={product.rating.count} />}
        {layout === "list" && product.shortDescription && <p className="line-clamp-2 text-sm text-slate-600">{product.shortDescription}</p>}
        <div className="mt-auto space-y-3 pt-2">
          <Price price={product.sellingPrice} mrp={product.mrp} />
          <div className="flex items-center justify-between gap-2">
            <StockBadge status={product.stockStatus} />
            <Button size="sm" onClick={add} loading={adding} disabled={soldOut} aria-label={`Add ${product.name} to cart`}>
              <ShoppingCart className="size-4" aria-hidden />
              {soldOut ? "Sold out" : "Add"}
            </Button>
          </div>
        </div>
      </div>
      {quickView && <QuickView slug={product.slug} onClose={() => setQuickView(false)} />}
    </article>
  );
}

export function ProductGrid({ products, layout = "grid", priorityCount = 0 }: { products: ProductSummary[]; layout?: "grid" | "list"; priorityCount?: number }) {
  return (
    <div className={layout === "grid" ? "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4" : "space-y-4"}>
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} layout={layout} priority={index < priorityCount} />
      ))}
    </div>
  );
}
