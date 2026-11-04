"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { Button } from "@/components/ui";
import { useStore } from "@/store/StoreProvider";
import type { ProductSummary } from "@/types";
import { cn } from "@/utils/format";

/** Quantity selector + Add to Cart / Buy Now / Wishlist. The backend re-validates stock and limits on every call. */
export function AddToCart({ product, compact }: { product: ProductSummary; compact?: boolean }) {
  const router = useRouter();
  const { addToCart, toggleWishlist, wishlistIds } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState<"cart" | "buy" | null>(null);
  const max = product.maxPurchasable;
  const soldOut = max <= 0;
  const saved = wishlistIds.has(product.id);

  const run = async (mode: "cart" | "buy") => {
    setBusy(mode);
    const ok = await addToCart(product.id, quantity, { silent: mode === "buy" });
    setBusy(null);
    if (ok && mode === "buy") router.push("/checkout");
  };

  if (soldOut) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-600">This product is currently out of stock.</p>
        <Button variant="secondary" onClick={() => void toggleWishlist(product.id)}>
          <Heart className={cn("size-4", saved && "fill-red-500 text-red-500")} aria-hidden /> {saved ? "Saved to wishlist" : "Save for later"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700" id={`qty-${product.id}`}>
          Quantity
        </span>
        <div className="flex items-center rounded-lg border border-slate-300" role="group" aria-labelledby={`qty-${product.id}`}>
          <button className="p-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1} aria-label="Decrease quantity">
            <Minus className="size-4" />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={max}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Math.min(max, Number.parseInt(event.target.value, 10) || 1)))}
            className="w-14 border-x border-slate-300 py-2 text-center text-sm font-semibold [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Quantity"
          />
          <button className="p-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40" onClick={() => setQuantity((value) => Math.min(max, value + 1))} disabled={quantity >= max} aria-label="Increase quantity">
            <Plus className="size-4" />
          </button>
        </div>
        {max < 10 && <span className="text-xs text-amber-700">Max {max}</span>}
      </div>
      <div className={cn("flex gap-3", compact ? "flex-col sm:flex-row" : "flex-col sm:flex-row")}>
        <Button size="lg" className="flex-1" onClick={() => void run("cart")} loading={busy === "cart"} disabled={busy !== null}>
          <ShoppingCart className="size-5" aria-hidden /> Add to cart
        </Button>
        <Button size="lg" variant="dark" className="flex-1" onClick={() => void run("buy")} loading={busy === "buy"} disabled={busy !== null}>
          <Zap className="size-5" aria-hidden /> Buy now
        </Button>
        {!compact && (
          <Button size="lg" variant="secondary" onClick={() => void toggleWishlist(product.id)} aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}>
            <Heart className={cn("size-5", saved && "fill-red-500 text-red-500")} />
          </Button>
        )}
      </div>
    </div>
  );
}
