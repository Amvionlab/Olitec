"use client";

import { Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { TBody, THead, Table, Td, Th } from "@/components/ui/Table";
import { LoadState, Pager, RequirePermission, inputClass, useApi, useUrlFilters } from "@/components/ecommerce/kit";
import { formatDateTime } from "@/lib/format";
import { qs } from "@/services/ecommerce/api";

interface Entry {
  id: number;
  adminName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

const ENTITY_TYPES = ["product", "category", "brand", "order", "refund", "coupon", "customer", "inventory", "content_block", "page", "settings", "admin", "enquiry", "quotation", "media", "report", "review", "ticket"];

function AuditContent() {
  const { get, set } = useUrlFilters();
  const { data, meta, error, loading } = useApi<Entry[]>(`/admin/audit-logs${qs({ action: get("action"), entityType: get("entityType"), from: get("from"), to: get("to"), page: get("page") || 1, pageSize: 50 })}`);
  return (
    <>
      <PageHeader title="Audit log" description="Administrative and financial actions in the shop, newest first. Entries cannot be edited." />
      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-4">
          <input placeholder="Action starts with… (e.g. refund)" aria-label="Action" className={inputClass} defaultValue={get("action")} onKeyDown={(event) => event.key === "Enter" && set({ action: (event.target as HTMLInputElement).value })} />
          <select aria-label="Record type" className={inputClass} value={get("entityType")} onChange={(event) => set({ entityType: event.target.value })}>
            <option value="">All record types</option>
            {ENTITY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <input type="date" aria-label="From" className={inputClass} value={get("from")} onChange={(event) => set({ from: event.target.value })} />
          <input type="date" aria-label="To" className={inputClass} value={get("to")} onChange={(event) => set({ to: event.target.value })} />
        </div>
        <LoadState loading={loading} error={error} empty={!data}>
          {data?.length === 0 ? <EmptyState title="No entries" /> : (
            <Table>
              <THead><tr><Th>When</Th><Th>Who</Th><Th>Action</Th><Th>Record</Th><Th>Details</Th></tr></THead>
              <TBody>
                {data?.map((entry) => (
                  <tr key={entry.id}>
                    <Td className="whitespace-nowrap text-xs">{formatDateTime(entry.createdAt)}</Td>
                    <Td className="text-xs">{entry.adminName ?? "—"}<span className="block text-slate-400">{entry.ipAddress}</span></Td>
                    <Td className="font-mono text-xs">{entry.action}</Td>
                    <Td className="text-xs">{entry.entityType}{entry.entityId && ` · ${entry.entityId}`}</Td>
                    <Td className="max-w-md break-words font-mono text-[11px] text-slate-600">{entry.details ? JSON.stringify(entry.details) : ""}</Td>
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

export default function AuditLogsPage() {
  return (
    <RequirePermission permission="audit.view">
      <Suspense>
        <AuditContent />
      </Suspense>
    </RequirePermission>
  );
}
