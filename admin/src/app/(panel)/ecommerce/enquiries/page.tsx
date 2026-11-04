"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { TBody, THead, Table, Td, Th } from "@/components/ui/Table";
import { LoadState, Pager, RequirePermission, StatusPill, inputClass, useApi, useUrlFilters } from "@/components/ecommerce/kit";
import { formatDateTime } from "@/lib/format";
import { label, qs } from "@/services/ecommerce/api";

const STATUSES = ["new", "contacted", "quotation_sent", "negotiation", "converted", "closed"];

interface Row {
  id: number;
  enquiryNumber: string;
  contactName: string;
  companyName: string | null;
  email: string;
  phone: string;
  products: { name: string; quantity: number }[];
  deliveryLocation: string;
  status: string;
  assignedTo: string | null;
  createdAt: string;
}

function EnquiriesContent() {
  const { get, set } = useUrlFilters();
  const { data, meta, error, loading } = useApi<{ items: Row[]; counts: Record<string, number> }>(
    `/admin/bulk-enquiries${qs({ status: get("status"), q: get("q"), assignedToMe: get("mine") === "1" || undefined, page: get("page") || 1, pageSize: 20 })}`,
  );
  return (
    <>
      <PageHeader title="Bulk enquiries" description="Quote requests from the shop's bulk purchase form." />
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => set({ status: null })} className={`rounded-full px-3 py-1 text-sm ${!get("status") ? "bg-slate-900 text-white" : "bg-white ring-1 ring-slate-200"}`}>All</button>
        {STATUSES.map((status) => (
          <button key={status} onClick={() => set({ status })} className={`rounded-full px-3 py-1 text-sm ${get("status") === status ? "bg-slate-900 text-white" : "bg-white ring-1 ring-slate-200"}`}>
            {label(status)} {data && <span className="opacity-60">{data.counts[status] ?? 0}</span>}
          </button>
        ))}
      </div>
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <input type="search" placeholder="Enquiry no., name, company, email, phone" aria-label="Search enquiries" className={inputClass} defaultValue={get("q")} onKeyDown={(event) => event.key === "Enter" && set({ q: (event.target as HTMLInputElement).value })} />
          <label className="flex shrink-0 items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={get("mine") === "1"} onChange={(event) => set({ mine: event.target.checked ? "1" : null })} /> Assigned to me</label>
        </div>
        <LoadState loading={loading} error={error} empty={!data}>
          {data?.items.length === 0 ? <EmptyState title="No enquiries" /> : (
            <Table>
              <THead><tr><Th>Enquiry</Th><Th>Contact</Th><Th>Requirement</Th><Th>Location</Th><Th>Assigned</Th><Th>Status</Th></tr></THead>
              <TBody>
                {data?.items.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <Td><Link href={`/ecommerce/enquiries/${row.id}`} className="font-medium text-brand-700 hover:underline">{row.enquiryNumber}</Link><span className="block text-xs text-slate-500">{formatDateTime(row.createdAt)}</span></Td>
                    <Td>{row.companyName ?? row.contactName}<span className="block text-xs text-slate-500">{row.contactName} · {row.phone}</span></Td>
                    <Td className="max-w-xs text-xs">{row.products.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</Td>
                    <Td className="text-xs">{row.deliveryLocation}</Td>
                    <Td className="text-xs">{row.assignedTo ?? "—"}</Td>
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

export default function EnquiriesPage() {
  return (
    <RequirePermission permission="enquiries.manage">
      <Suspense>
        <EnquiriesContent />
      </Suspense>
    </RequirePermission>
  );
}
