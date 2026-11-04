"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { TBody, THead, Table, Td, Th } from "@/components/ui/Table";
import { LoadState, Pager, RequirePermission, StatusPill, inputClass, useApi, useUrlFilters } from "@/components/ecommerce/kit";
import { formatDate, formatMobile } from "@/lib/format";
import { money, qs } from "@/services/ecommerce/api";

interface Row {
  id: number;
  name: string;
  email: string;
  mobile: string;
  status: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

function CustomersContent() {
  const { get, set } = useUrlFilters();
  const { data, meta, error, loading } = useApi<Row[]>(`/admin/customers${qs({ q: get("q"), status: get("status"), page: get("page") || 1, pageSize: 20 })}`);
  return (
    <>
      <PageHeader title="Shop customers" description="Registered customer accounts (shared with warranty registration). Guest buyers appear on their orders." />
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <form className="relative flex-1" onSubmit={(event) => { event.preventDefault(); set({ q: new FormData(event.currentTarget).get("q") as string }); }}>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input name="q" type="search" defaultValue={get("q")} placeholder="Name, email, mobile or customer ID" aria-label="Search customers" className={`${inputClass} pl-9`} />
          </form>
          <select aria-label="Status" className={`${inputClass} sm:w-40`} value={get("status")} onChange={(event) => set({ status: event.target.value })}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Suspended</option>
          </select>
        </div>
        <LoadState loading={loading} error={error} empty={!data}>
          {data?.length === 0 ? <EmptyState title="No customers found" /> : (
            <Table>
              <THead><tr><Th>Customer</Th><Th>Mobile</Th><Th>Registered</Th><Th className="text-right">Orders</Th><Th className="text-right">Spent</Th><Th>Last order</Th><Th>Status</Th></tr></THead>
              <TBody>
                {data?.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <Td><Link href={`/ecommerce/customers/${row.id}`} className="font-medium text-slate-900 hover:text-brand-700">{row.name}</Link><span className="block text-xs text-slate-500">#{row.id} · {row.email}</span></Td>
                    <Td>{formatMobile(row.mobile)}</Td>
                    <Td>{formatDate(row.createdAt)}</Td>
                    <Td className="text-right">{row.orderCount}</Td>
                    <Td className="text-right">{money(row.totalSpent)}</Td>
                    <Td>{formatDate(row.lastOrderAt)}</Td>
                    <Td><StatusPill status={row.status} /></Td>
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

export default function CustomersPage() {
  return (
    <RequirePermission permission="customers.view">
      <Suspense>
        <CustomersContent />
      </Suspense>
    </RequirePermission>
  );
}
