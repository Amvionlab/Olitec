"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Tag, Trash2 } from "lucide-react";
import { Alert, Button, ButtonLink, Container, EmptyState, Spinner } from "@/components/ui";
import { CartSummary } from "@/components/cart/CartSummary";
import { ProductImage } from "@/components/product/ProductImage";
import { api, errorMessage } from "@/services/api";
import { useStore } from "@/store/StoreProvider";
import type { Cart } from "@/types";
import { formatPrice } from "@/utils/format";

export default function CartPage() {
  const { cart, setCart, notify } = useStore();
  const [busyItem, setBusyItem] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);

  if (!cart) return <Spinner label="Loading your cart" />;

  const update = async (itemId: number, action: () => Promise<Cart>) => {
    setBusyItem(itemId);
    try {
      setCart(await action());
    } catch (error) {
      notify(errorMessage(error), "error");
    } finally {
      setBusyItem(null);
    }
  };

  const applyCoupon = async (value: string) => {
    setCouponBusy(true);
    setCouponError(null);
    try {
      setCart(await api.post<Cart>("/cart/coupon", { code: value.trim() }));
      setCode("");
      notify("Coupon applied");
    } catch (error) {
      setCouponError(errorMessage(error));
    } finally {
      setCouponBusy(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <Container className="py-12">
        <EmptyState icon={<ShoppingCart className="size-10" />} title="Your cart is empty" action={<ButtonLink href="/products">Browse products</ButtonLink>}>
          Add products to your cart to see them here.
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <h1 className="mb-6 text-3xl font-bold text-slate-900">Shopping cart</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {!cart.canCheckout && <Alert>Some items need attention before you can check out. Update or remove them below.</Alert>}
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
            {cart.items.map((item) => (
              <li key={item.id} className="flex gap-4 p-4" aria-busy={busyItem === item.id}>
                <Link href={`/products/${item.slug}`} className="shrink-0">
                  <ProductImage src={item.image} alt={item.name} sizes="96px" className="size-24 rounded-xl" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Link href={`/products/${item.slug}`} className="font-semibold text-slate-900 hover:text-brand-700">
                      {item.name}
                    </Link>
                    <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatPrice(item.unitPrice)} each
                      {item.mrp > item.unitPrice && <span className="ml-2 text-xs text-slate-400 line-through">{formatPrice(item.mrp)}</span>}
                    </p>
                    {item.issueMessage && <p className="mt-1 text-sm font-medium text-red-600">{item.issueMessage}</p>}
                  </div>
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                    <div className="flex items-center rounded-lg border border-slate-300" role="group" aria-label={`Quantity for ${item.name}`}>
                      <button
                        className="p-2 hover:bg-slate-50 disabled:opacity-40"
                        disabled={busyItem !== null || item.quantity <= 1}
                        onClick={() => update(item.id, () => api.patch<Cart>(`/cart/items/${item.id}`, { quantity: item.quantity - 1 }))}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        className="p-2 hover:bg-slate-50 disabled:opacity-40"
                        disabled={busyItem !== null || item.quantity >= item.maxPurchasable}
                        onClick={() => update(item.id, () => api.patch<Cart>(`/cart/items/${item.id}`, { quantity: item.quantity + 1 }))}
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                    {item.issue === "insufficient_stock" && item.maxPurchasable > 0 && (
                      <button className="text-xs font-semibold text-brand-700 hover:underline" onClick={() => update(item.id, () => api.patch<Cart>(`/cart/items/${item.id}`, { quantity: item.maxPurchasable }))}>
                        Set to {item.maxPurchasable}
                      </button>
                    )}
                    <p className="font-bold text-slate-900">{formatPrice(item.lineTotal)}</p>
                    <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-600" disabled={busyItem !== null} onClick={() => update(item.id, () => api.delete<Cart>(`/cart/items/${item.id}`))}>
                      <Trash2 className="size-4" aria-hidden /> Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <Tag className="size-4" aria-hidden /> Coupon
            </h2>
            {cart.couponCode ? (
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm">
                <span>
                  <span className="font-bold text-emerald-800">{cart.couponCode}</span>
                  {cart.totals.couponError ? <span className="block text-red-600">{cart.totals.couponError}</span> : <span className="block text-emerald-700">Saving {formatPrice(cart.totals.discount)}</span>}
                </span>
                <button className="font-semibold text-slate-600 hover:text-red-600" onClick={() => update(-1, () => api.delete<Cart>("/cart/coupon"))}>
                  Remove
                </button>
              </div>
            ) : (
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (code.trim()) void applyCoupon(code);
                }}
              >
                <label htmlFor="coupon" className="sr-only">
                  Coupon code
                </label>
                <input id="coupon" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Enter code" maxLength={40} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase" aria-invalid={couponError ? true : undefined} aria-describedby={couponError ? "coupon-error" : undefined} />
                <Button type="submit" variant="secondary" size="sm" className="h-10" loading={couponBusy}>
                  Apply
                </Button>
              </form>
            )}
            {couponError && (
              <p id="coupon-error" className="text-sm text-red-600">
                {couponError}
              </p>
            )}
            {!cart.couponCode && cart.availableCoupons.length > 0 && (
              <ul className="space-y-1.5">
                {cart.availableCoupons.map((coupon) => (
                  <li key={coupon.code} className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-brand-300 px-3 py-2 text-xs">
                    <span>
                      <span className="font-bold text-brand-800">{coupon.code}</span> <span className="text-slate-600">{coupon.description}</span>
                    </span>
                    <button className="font-semibold text-brand-700 hover:underline" onClick={() => void applyCoupon(coupon.code)}>
                      Apply
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <CartSummary totals={cart.totals}>
            {cart.canCheckout ? (
              <ButtonLink href="/checkout" size="lg" className="w-full">
                Proceed to checkout
              </ButtonLink>
            ) : (
              <Button size="lg" className="w-full" disabled>
                Proceed to checkout
              </Button>
            )}
            <Link href="/products" className="block text-center text-sm font-medium text-brand-700 hover:underline">
              Continue shopping
            </Link>
          </CartSummary>
        </div>
      </div>
    </Container>
  );
}
