"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Download, Search } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { TBody, THead, Table, Td, Th } from "@/components/ui/Table";
import { LoadState, Pager, RequirePermission, StatCard, StatusPill, inputClass, useApi, useUrlFilters } from "@/components/ecommerce/kit";
import { formatDateTime } from "@/lib/format";
import { ECOM_API_BASE, label, money, qs } from "@/services/ecommerce/api";

interface Payment {
  id: number;
  orderId: number;
  orderNumber: string;
  customerName: string;
  provider: string;
  providerOrderId: string;
  providerPaymentId: string | null;
  amount: number;
  status: string;
  method: string | null;
  errorDescription: string | null;
  createdAt: string;
}

interface Refund {
  id: number;
  refundNumber: string;
  orderId: number;
  orderNumber: string;
  customerName: string;
  amount: number;
  reason: string;
  status: string;
  providerRefundId: string | null;
  failureReason: string | null;
  requestedBy: string;
  approvedBy: string | null;
  createdAt: string;
}

function Transactions() {
  const { get, set } = useUrlFilters();
  const query = { status: get("status"), q: get("q"), from: get("from"), to: get("to") };
  const { data, meta, error, loading } = useApi<{ items: Payment[]; summary: { captured: number; capturedAmount: number; failed: number; awaiting: number } }>(`/admin/payments${qs({ ...query, page: get("page") || 1, pageSize: 25 })}`);
  return (
    <>
      {data && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Captured" value={money(data.summary.capturedAmount)} hint={`${data.summary.captured} payments`} />
          <StatCard label="Failed attempts" value={data.summary.failed} tone={data.summary.failed ? "warn" : undefined} />
          <StatCard label="Awaiting customer" value={data.summary.awaiting} />
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-300 p-4">
            <a className={buttonClasses("secondary", "sm")} href={`${ECOM_API_BASE}/admin/payments${qs({ ...query, format: "csv" })}`}><Download className="size-4" aria-hidden /> Download CSV</a>
          </div>
        </div>
      )}
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row">
          <form className="relative flex-1" onSubmit={(event) => { event.preventDefault(); set({ q: new FormData(event.currentTarget).get("q") as string }); }}>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input name="q" type="search" defaultValue={get("q")} placeholder="Order no., gateway id or email" aria-label="Search payments" className={`${inputClass} pl-9`} />
          </form>
          <select aria-label="Status" className={`${inputClass} lg:w-40`} value={get("status")} onChange={(event) => set({ status: event.target.value })}>
            <option value="">All statuses</option>
            <option value="captured">Captured</option>
            <option value="failed">Failed</option>
            <option value="created">Awaiting</option>
          </select>
          <input type="date" aria-label="From" className={`${inputClass} lg:w-44`} value={get("from")} onChange={(event) => set({ from: event.target.value })} />
          <input type="date" aria-label="To" className={`${inputClass} lg:w-44`} value={get("to")} onChange={(event) => set({ to: event.target.value })} />
        </div>
        <LoadState loading={loading} error={error} empty={!data}>
          {data?.items.length === 0 ? <EmptyState title="No transactions" /> : (
            <Table>
              <THead><tr><Th>Date</Th><Th>Order</Th><Th>Gateway references</Th><Th>Method</Th><Th className="text-right">Amount</Th><Th>Status</Th></tr></THead>
              <TBody>
                {data?.items.map((payment) => (
                  <tr key={payment.id}>
                    <Td className="whitespace-nowrap text-xs">{formatDateTime(payment.createdAt)}</Td>
                    <Td><Link href={`/ecommerce/orders/${payment.orderId}`} className="font-medium text-brand-700 hover:underline">{payment.orderNumber}</Link><span className="block text-xs text-slate-500">{payment.customerName}</span></Td>
                    <Td className="text-xs">{payment.provider} · order {payment.providerOrderId}{payment.providerPaymentId && <span className="block">payment {payment.providerPaymentId}</span>}{payment.errorDescription && <span className="block text-red-600">{payment.errorDescription}</span>}</Td>
                    <Td>{payment.method ?? "—"}</Td>
                    <Td className="text-right font-medium">{money(payment.amount)}</Td>
                    <Td><StatusPill status={payment.status} /></Td>
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

function Refunds() {
  const { get, set } = useUrlFilters();
  const { data, meta, error, loading } = useApi<Refund[]>(`/admin/refunds${qs({ status: get("refundStatus"), page: get("page") || 1, pageSize: 25 })}`);
  return (
    <Card>
      <div className="flex gap-3 border-b border-slate-100 p-4">
        <select aria-label="Refund status" className={`${inputClass} sm:w-48`} value={get("refundStatus")} onChange={(event) => set({ refundStatus: event.target.value })}>
          <option value="">All refunds</option>
          {["pending", "processing", "processed", "failed", "rejected"].map((status) => <option key={status} value={status}>{label(status)}</option>)}
        </select>
        <p className="self-center text-sm text-slate-500">Open a refund on its order page to process it.</p>
      </div>
      <LoadState loading={loading} error={error} empty={!data}>
        {data?.length === 0 ? <EmptyState title="No refunds" /> : (
          <Table>
            <THead><tr><Th>Refund</Th><Th>Order</Th><Th className="text-right">Amount</Th><Th>Reason</Th><Th>Requested by</Th><Th>Status</Th></tr></THead>
            <TBody>
              {data?.map((refund) => (
                <tr key={refund.id}>
                  <Td><span className="font-medium">{refund.refundNumber}</span><span className="block text-xs text-slate-500">{formatDateTime(refund.createdAt)}</span></Td>
                  <Td><Link href={`/ecommerce/orders/${refund.orderId}`} className="text-brand-700 hover:underline">{refund.orderNumber}</Link><span className="block text-xs text-slate-500">{refund.customerName}</span></Td>
                  <Td className="text-right font-medium">{money(refund.amount)}</Td>
                  <Td className="max-w-xs text-xs">{refund.reason}{refund.failureReason && <span className="block text-red-600">{refund.failureReason}</span>}</Td>
                  <Td className="text-xs">{label(refund.requestedBy)}{refund.approvedBy && <span className="block text-slate-500">Approved by {refund.approvedBy}</span>}</Td>
                  <Td><StatusPill status={refund.status} />{refund.providerRefundId && <span className="block text-xs text-slate-500">{refund.providerRefundId}</span>}</Td>
                </tr>
              ))}
            </TBody>
          </Table>
        )}
        <Pager meta={meta} onPage={(page) => set({ page })} />
      </LoadState>
    </Card>
  );
}

function PaymentsContent() {
  const { get, set } = useUrlFilters();
  const tab = get("tab") || "transactions";
  return (
    <>
      <PageHeader title="Payments & refunds" description="Gateway transactions mapped to orders. Refunds go through the gateway's verified refund API." />
      <div className="mb-4 flex gap-1 border-b border-slate-200" role="tablist">
        {[["transactions", "Transactions"], ["refunds", "Refunds"]].map(([key, title]) => (
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => set({ tab: key === "transactions" ? null : key, status: null, refundStatus: null })} className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === key ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{title}</button>
        ))}
        <Link href="/ecommerce/reports?report=reconciliation" className="ml-auto self-center text-sm text-brand-700 hover:underline">Reconciliation report →</Link>
      </div>
      {tab === "transactions" ? <Transactions /> : <Refunds />}
    </>
  );
}

export default function PaymentsPage() {
  return (
    <RequirePermission permission="payments.view">
      <Suspense>
        <PaymentsContent />
      </Suspense>
    </RequirePermission>
  );
}
