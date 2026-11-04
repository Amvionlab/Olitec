"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { BarList, ColumnChart, LoadState, RequirePermission, StatCard, inputClass, useApi, useUrlFilters } from "@/components/ecommerce/kit";
import { label, money, qs } from "@/services/ecommerce/api";

interface Dashboard {
  range: { from: string; to: string; granularity: string };
  metrics: Record<
    | "totalRevenue" | "refundedAmount" | "totalOrders" | "pendingOrders" | "completedOrders" | "totalCustomers" | "newCustomers" | "totalProducts"
    | "lowStockProducts" | "outOfStockProducts" | "pendingPayments" | "pendingPaymentsAmount" | "openReturnAndCancellationRequests" | "pendingRefunds",
    number
  >;
  salesSeries: { bucket: string; revenue: number; orders: number }[];
  ordersByStatus: { status: string; count: number }[];
  topProducts: { productId: number | null; name: string; sku: string; units: number; revenue: number }[];
  salesByCategory: { name: string; revenue: number; units: number }[];
  customersMix: { newBuyers: number; returningBuyers: number };
}

function DashboardContent() {
  const { get, set } = useUrlFilters();
  const { data, error, loading } = useApi<Dashboard>(`/admin/dashboard${qs({ from: get("from"), to: get("to"), granularity: get("granularity") || "day" })}`);
  const m = data?.metrics;

  return (
    <>
      <PageHeader
        title="Shop dashboard"
        description="Live figures from orders, payments and inventory."
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs text-slate-500">
              From
              <input type="date" className={inputClass} value={get("from") || data?.range.from || ""} onChange={(event) => set({ from: event.target.value })} />
            </label>
            <label className="text-xs text-slate-500">
              To
              <input type="date" className={inputClass} value={get("to") || data?.range.to || ""} onChange={(event) => set({ to: event.target.value })} />
            </label>
            <label className="text-xs text-slate-500">
              Group by
              <select className={inputClass} value={get("granularity") || "day"} onChange={(event) => set({ granularity: event.target.value })}>
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </label>
          </div>
        }
      />
      <LoadState loading={loading} error={error} empty={!data}>
        {data && m && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
              <StatCard label="Revenue" value={money(m.totalRevenue)} hint={m.refundedAmount ? `${money(m.refundedAmount)} refunded` : "In selected period"} />
              <StatCard label="Orders" value={m.totalOrders} hint="In selected period" />
              <StatCard label="Pending fulfilment" value={m.pendingOrders} tone={m.pendingOrders ? "warn" : undefined} />
              <StatCard label="Delivered" value={m.completedOrders} />
              <StatCard label="Customers" value={m.totalCustomers} hint={`${m.newCustomers} new in period`} />
              <StatCard label="Active products" value={m.totalProducts} />
              <StatCard label="Low stock" value={<Link href="/ecommerce/inventory?stock=low" className="hover:underline">{m.lowStockProducts}</Link>} tone={m.lowStockProducts ? "warn" : undefined} />
              <StatCard label="Out of stock" value={<Link href="/ecommerce/inventory?stock=out" className="hover:underline">{m.outOfStockProducts}</Link>} tone={m.outOfStockProducts ? "bad" : undefined} />
              <StatCard label="Pending payments" value={m.pendingPayments} hint={money(m.pendingPaymentsAmount)} />
              <StatCard label="Returns & refunds" value={m.openReturnAndCancellationRequests + m.pendingRefunds} hint={`${m.openReturnAndCancellationRequests} requests · ${m.pendingRefunds} refunds`} tone={m.openReturnAndCancellationRequests + m.pendingRefunds ? "warn" : undefined} />
            </div>

            <Card>
              <CardHeader title="Revenue trend" description={`${data.range.from} to ${data.range.to}, by ${data.range.granularity}`} />
              <div className="p-5">
                <ColumnChart rows={data.salesSeries.map((row) => ({ label: row.bucket, value: row.revenue }))} format={money} />
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader title="Top-selling products" />
                <div className="p-5">
                  <BarList rows={data.topProducts.map((row) => ({ label: `${row.name} (${row.sku})`, value: row.units }))} format={(value) => `${value} units`} />
                </div>
              </Card>
              <Card>
                <CardHeader title="Sales by category" />
                <div className="p-5">
                  <BarList rows={data.salesByCategory.map((row) => ({ label: row.name, value: row.revenue }))} format={money} />
                </div>
              </Card>
              <Card>
                <CardHeader title="Orders by status" />
                <div className="p-5">
                  <BarList rows={data.ordersByStatus.map((row) => ({ label: label(row.status), value: row.count }))} />
                </div>
              </Card>
              <Card>
                <CardHeader title="New vs returning buyers" description="Buyers with a paid order in the period" />
                <div className="p-5">
                  <BarList rows={[{ label: "New buyers", value: data.customersMix.newBuyers }, { label: "Returning buyers", value: data.customersMix.returningBuyers }]} />
                </div>
              </Card>
            </div>
          </div>
        )}
      </LoadState>
    </>
  );
}

export default function EcommerceDashboardPage() {
  return (
    <RequirePermission permission="dashboard.view">
      <Suspense>
        <DashboardContent />
      </Suspense>
    </RequirePermission>
  );
}
