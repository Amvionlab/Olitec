"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Field, LoadState, Modal, Pager, RequirePermission, StatusPill, inputClass, useAction, useApi, useUrlFilters } from "@/components/ecommerce/kit";
import { formatDateTime } from "@/lib/format";
import { ecomApi, label, qs } from "@/services/ecommerce/api";

interface Ticket {
  id: number;
  ticketNumber: string;
  customerId: number | null;
  orderId: number | null;
  orderNumber: string | null;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  response: string | null;
  assignedTo: string | null;
  createdAt: string;
}

function SupportContent() {
  const { get, set } = useUrlFilters();
  const { data, meta, error, loading, reload } = useApi<Ticket[]>(`/admin/support${qs({ status: get("status"), q: get("q"), page: get("page") || 1, pageSize: 20 })}`);
  const { run, busy } = useAction();
  const [open, setOpen] = useState<(Ticket & { draftStatus: string; draftResponse: string }) | null>(null);

  return (
    <>
      <PageHeader title="Support tickets" description="Messages from the shop contact form and customer accounts. Replies appear in the customer's account." />
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <input type="search" placeholder="Ticket no., email or subject" aria-label="Search tickets" className={inputClass} defaultValue={get("q")} onKeyDown={(event) => event.key === "Enter" && set({ q: (event.target as HTMLInputElement).value })} />
          <select aria-label="Status" className={`${inputClass} sm:w-44`} value={get("status")} onChange={(event) => set({ status: event.target.value })}>
            <option value="">All statuses</option>
            {["open", "in_progress", "resolved", "closed"].map((status) => <option key={status} value={status}>{label(status)}</option>)}
          </select>
        </div>
        <LoadState loading={loading} error={error} empty={!data}>
          {data?.length === 0 ? <EmptyState title="No tickets" /> : (
            <ul className="divide-y divide-slate-100">
              {data?.map((ticket) => (
                <li key={ticket.id}>
                  <button className="flex w-full flex-col gap-1 px-5 py-4 text-left hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between" onClick={() => setOpen({ ...ticket, draftStatus: ticket.status, draftResponse: ticket.response ?? "" })}>
                    <span>
                      <span className="font-medium text-slate-900">{ticket.subject}</span>
                      <span className="block text-xs text-slate-500">{ticket.ticketNumber} · {ticket.name} ({ticket.email}) · {formatDateTime(ticket.createdAt)}{ticket.orderNumber && ` · ${ticket.orderNumber}`}</span>
                    </span>
                    <span className="flex items-center gap-2 text-xs text-slate-500">{ticket.assignedTo}<StatusPill status={ticket.status} /></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Pager meta={meta} onPage={(page) => set({ page })} />
        </LoadState>
      </Card>

      <Modal open={open !== null} title={open ? `${open.ticketNumber} · ${open.subject}` : ""} onClose={() => setOpen(null)} wide>
        {open && (
          <form className="space-y-4" onSubmit={async (event) => {
            event.preventDefault();
            const ok = await run(() => ecomApi.patch(`/admin/support/${open.id}`, { status: open.draftStatus, ...(open.draftResponse.trim().length >= 2 ? { response: open.draftResponse.trim() } : {}), assignToMe: true }), "Ticket updated");
            if (ok) { setOpen(null); reload(); }
          }}>
            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <p className="text-xs text-slate-500">{open.name} · {open.email}{open.phone && ` · ${open.phone}`}</p>
              <p className="mt-2 whitespace-pre-line text-slate-800">{open.message}</p>
              {open.orderId && <Link href={`/ecommerce/orders/${open.orderId}`} className="mt-2 inline-block text-brand-700 hover:underline">Open order {open.orderNumber}</Link>}
            </div>
            <Field label="Reply to customer" hint="Shown in the customer's account under Support. Email delivery is not configured yet."><textarea className={`${inputClass} min-h-28`} maxLength={4000} value={open.draftResponse} onChange={(event) => setOpen({ ...open, draftResponse: event.target.value })} /></Field>
            <Field label="Status">
              <select className={inputClass} value={open.draftStatus} onChange={(event) => setOpen({ ...open, draftStatus: event.target.value })}>
                {["open", "in_progress", "resolved", "closed"].map((status) => <option key={status} value={status}>{label(status)}</option>)}
              </select>
            </Field>
            <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setOpen(null)}>Cancel</Button><Button type="submit" loading={busy}>Save</Button></div>
          </form>
        )}
      </Modal>
    </>
  );
}

export default function SupportPage() {
  return (
    <RequirePermission permission="support.manage">
      <Suspense>
        <SupportContent />
      </Suspense>
    </RequirePermission>
  );
}
