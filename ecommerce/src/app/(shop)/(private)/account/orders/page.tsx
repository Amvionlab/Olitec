"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { Alert, Button, ButtonLink, EmptyState, Spinner, StatusPill, orderTone } from "@/components/ui";
import { ProductImage } from "@/components/product/ProductImage";
import { api, errorMessage } from "@/services/api";
import type { OrderListItem, PageMeta } from "@/types";
import { formatDate, formatPrice, PAYMENT_STATUS_LABELS } from "@/utils/format";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [meta, setMeta] = useState<PageMeta>({});
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .page<OrderListItem[]>(`/orders?page=${page}&pageSize=10`)
      .then(({ data, meta: nextMeta }) => {
        setOrders((current) => (page === 1 ? data : [...(current ?? []), ...data]));
        setMeta(nextMeta);
      })
      .catch((reason) => setError(errorMessage(reason)));
  }, [page]);

  if (error) return <Alert>{error}</Alert>;
  if (!orders) return <Spinner label="Loading orders" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">My orders</h1>
      {orders.length === 0 ? (
        <EmptyState icon={<Package className="size-10" />} title="No orders yet" action={<ButtonLink href="/products">Start shopping</ButtonLink>}>
          Orders you place while signed in appear here.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.orderNumber}>
              <Link href={`/account/orders/${order.orderNumber}`} className="flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 hover:ring-brand-300">
                <ProductImage src={order.image} alt="" sizes="64px" className="size-16 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                  <p className="text-sm text-slate-500">
                    {formatDate(order.placedAt)} · {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <StatusPill label={order.statusLabel} tone={orderTone(order.status)} />
                    <span className="text-xs text-slate-500">{PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}</span>
                  </div>
                </div>
                <p className="font-bold text-slate-900">{formatPrice(order.total)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {(meta.page ?? 1) < (meta.pageCount ?? 1) && (
        <div className="text-center">
          <Button variant="secondary" onClick={() => setPage((value) => value + 1)}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
