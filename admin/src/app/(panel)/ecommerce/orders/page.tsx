"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Download, Search } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { TBody, THead, Table, Td, Th } from "@/components/ui/Table";
import { LoadState, Pager, Pill, RequirePermission, StatusPill, inputClass, useApi, useUrlFilters } from "@/components/ecommerce/kit";
import { formatDateTime } from "@/lib/format";
import { ECOM_API_BASE, label, money, qs } from "@/services/ecommerce/api";

interface OrderRow {
  id: number;
  orderNumber: string;
  placedAt: string;
  customerName: string;
  customerEmail: string;
  isGuest: boolean;
  itemCount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  shippingCity: string | null;
  trackingNumber: string | null;
  assignedTo: string | null;
  openRequests: number;
}

const STATUSES = ["pending_payment", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "return_requested", "returned", "refunded"];
const PAYMENT = ["pending", "paid", "failed", "cod_pending", "refund_pending", "partially_refunded", "refunded"];

function OrdersContent() {
  const { get, set } = useUrlFilters();
  const filters = { q: get("q"), status: get("status"), paymentStatus: get("paymentStatus"), from: get("from"), to: get("to"), assignedToMe: get("mine") === "1" || undefined, hasOpenRequest: get("requests") === "1" || undefined };
  const { data, meta, error, loading } = useApi<OrderRow[]>(`/admin/orders${qs({ ...filters, page: get("page") || 1, pageSize: 20 })}`);

  return (
    <>
      <PageHeader
        title="Orders"
        description="Orders are created only after checkout validation; status changes follow the fulfilment rules and are logged."
        actions={
          <a className={buttonClasses("secondary", "md")} href={`${ECOM_API_BASE}/admin/reports/orders${qs({ format: "csv", from: get("from"), to: get("to") })}`}>
            <Download className="size-4" aria-hidden /> Export CSV
          </a>
        }
      />
      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-2 xl:grid-cols-6">
          <form className="relative xl:col-span-2" onSubmit={(event) => { event.preventDefault(); set({ q: new FormData(event.currentTarget).get("q") as string }); }}>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input name="q" type="search" defaultValue={get("q")} placeholder="Order no., name, email, phone, tracking" aria-label="Search orders" className={`${inputClass} pl-9`} />
          </form>
          <select aria-label="Status" className={inputClass} value={get("status")} onChange={(event) => set({ status: event.target.value })}>
            <option value="">All statuses</option>
            {STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}
          </select>
          <select aria-label="Payment" className={inputClass} value={get("paymentStatus")} onChange={(event) => set({ paymentStatus: event.target.value })}>
            <option value="">All payments</option>
            {PAYMENT.map((status) => <option key={status} value={status}>{label(status)}</option>)}
          </select>
          <input type="date" aria-label="From date" className={inputClass} value={get("from")} onChange={(event) => set({ from: event.target.value })} />
          <input type="date" aria-label="To date" className={inputClass} value={get("to")} onChange={(event) => set({ to: event.target.value })} />
          <div className="flex flex-wrap gap-4 text-sm xl:col-span-6">
            <label className="flex items-center gap-2"><input type="checkbox" className="accent-brand-600" checked={get("mine") === "1"} onChange={(event) => set({ mine: event.target.checked ? "1" : null })} /> Assigned to me</label>
            <label className="flex items-center gap-2"><input type="checkbox" className="accent-brand-600" checked={get("requests") === "1"} onChange={(event) => set({ requests: event.target.checked ? "1" : null })} /> Has open cancellation/return request</label>
          </div>
        </div>
        <LoadState loading={loading} error={error} empty={!data}>
          {data?.length === 0 ? (
            <EmptyState title="No orders found" />
          ) : (
            <Table>
              <THead>
                <tr><Th>Order</Th><Th>Date</Th><Th>Customer</Th><Th className="text-right">Items</Th><Th className="text-right">Total</Th><Th>Payment</Th><Th>Fulfilment</Th><Th>Shipping</Th><Th>Assigned</Th></tr>
              </THead>
              <TBody>
                {data?.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <Td>
                      <Link href={`/ecommerce/orders/${order.id}`} className="font-medium text-brand-700 hover:underline">{order.orderNumber}</Link>
                      {order.openRequests > 0 && <span className="ml-2"><Pill tone="amber">Request</Pill></span>}
                    </Td>
                    <Td className="whitespace-nowrap text-xs">{formatDateTime(order.placedAt)}</Td>
                    <Td>{order.customerName}<span className="block text-xs text-slate-500">{order.isGuest ? "Guest · " : ""}{order.customerEmail}</span></Td>
                    <Td className="text-right">{order.itemCount}</Td>
                    <Td className="text-right font-medium">{money(order.total)}</Td>
                    <Td><StatusPill status={order.paymentStatus} /><span className="block text-xs text-slate-500">{order.paymentMethod === "cod" ? "COD" : "Online"}</span></Td>
                    <Td><StatusPill status={order.status} /></Td>
                    <Td className="text-xs">{order.shippingCity ?? "—"}{order.trackingNumber && <span className="block text-slate-500">{order.trackingNumber}</span>}</Td>
                    <Td className="text-xs">{order.assignedTo ?? "—"}</Td>
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

export default function OrdersPage() {
  return (
    <RequirePermission permission="orders.view">
      <Suspense>
        <OrdersContent />
      </Suspense>
    </RequirePermission>
  );
}
