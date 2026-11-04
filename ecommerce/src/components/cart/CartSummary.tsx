import type { ReactNode } from "react";
import type { Totals } from "@/types";
import { formatPrice } from "@/utils/format";

/** Order totals exactly as computed by the backend. */
export function CartSummary({ totals, children }: { totals: Totals; children?: ReactNode }) {
  const remaining = totals.freeShippingThreshold > 0 ? totals.freeShippingThreshold - (totals.subtotal - totals.discount) : 0;
  return (
    <div className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-600">Subtotal</dt>
          <dd className="font-medium">{formatPrice(totals.subtotal)}</dd>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-leaf">
            <dt>Discount{totals.coupon && ` (${totals.coupon.code})`}</dt>
            <dd className="font-medium">−{formatPrice(totals.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-slate-600">Shipping</dt>
          <dd className="font-medium">{totals.shipping > 0 ? formatPrice(totals.shipping) : "Free"}</dd>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
          <dt className="font-semibold text-slate-900">Total</dt>
          <dd className="font-bold text-slate-900">{formatPrice(totals.total)}</dd>
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <dt>Includes GST</dt>
          <dd>{formatPrice(totals.tax)}</dd>
        </div>
      </dl>
      {remaining > 0 && totals.shipping > 0 && <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">Add {formatPrice(remaining)} more for free shipping.</p>}
      {children}
    </div>
  );
}
