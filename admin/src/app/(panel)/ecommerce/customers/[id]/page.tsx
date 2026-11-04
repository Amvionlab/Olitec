"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { TBody, THead, Table, Td, Th } from "@/components/ui/Table";
import { useEcom } from "@/components/ecommerce/EcomSession";
import { Field, LoadState, Modal, RequirePermission, StatCard, StatusPill, inputClass, useAction, useApi } from "@/components/ecommerce/kit";
import { formatDate, formatDateTime, formatMobile } from "@/lib/format";
import { ecomApi, money } from "@/services/ecommerce/api";

interface CustomerDetail {
  id: number;
  name: string;
  email: string;
  mobile: string;
  status: "active" | "inactive";
  createdAt: string;
  lastLoginAt: string | null;
  addresses: { id: number; label: string | null; fullName: string; phone: string; line1: string; line2: string | null; city: string; state: string; pincode: string }[];
  shippingHistory: { city: string; pincode: string }[];
  orders: { id: number; orderNumber: string; placedAt: string; status: string; paymentStatus: string; total: number }[];
  summary: { orderCount: number; totalSpent: number; averageOrderValue: number; firstOrderAt: string | null; lastOrderAt: string | null };
  tickets: { id: number; ticketNumber: string; subject: string; status: string; createdAt: string }[];
}

function Detail({ id }: { id: string }) {
  const { can } = useEcom();
  const { data, error, loading, setData } = useApi<CustomerDetail>(`/admin/customers/${encodeURIComponent(id)}`);
  const { run, busy } = useAction();
  const [reason, setReason] = useState<string | null>(null);

  if (!data) return <LoadState loading={loading} error={error}>{null}</LoadState>;
  const suspend = data.status === "active";

  return (
    <>
      <PageHeader
        title={data.name}
        description={`Customer #${data.id} · joined ${formatDate(data.createdAt)} · last sign-in ${data.lastLoginAt ? formatDateTime(data.lastLoginAt) : "never"}`}
        back={{ href: "/ecommerce/customers", label: "Shop customers" }}
        actions={<><StatusPill status={data.status} />{can("customers.manage") && <Button variant={suspend ? "danger" : "primary"} size="sm" onClick={() => setReason("")}>{suspend ? "Suspend account" : "Reactivate account"}</Button>}</>}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Orders" value={data.summary.orderCount} />
        <StatCard label="Total spent" value={money(data.summary.totalSpent)} />
        <StatCard label="Average order" value={money(data.summary.averageOrderValue)} />
        <StatCard label="Last order" value={formatDate(data.summary.lastOrderAt)} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Order history" />
            {data.orders.length === 0 ? <p className="p-5 text-sm text-slate-500">No orders yet.</p> : (
              <Table>
                <THead><tr><Th>Order</Th><Th>Date</Th><Th>Status</Th><Th>Payment</Th><Th className="text-right">Total</Th></tr></THead>
                <TBody>
                  {data.orders.map((order) => (
                    <tr key={order.id}>
                      <Td><Link href={`/ecommerce/orders/${order.id}`} className="font-medium text-brand-700 hover:underline">{order.orderNumber}</Link></Td>
                      <Td>{formatDate(order.placedAt)}</Td>
                      <Td><StatusPill status={order.status} /></Td>
                      <Td><StatusPill status={order.paymentStatus} /></Td>
                      <Td className="text-right">{money(order.total)}</Td>
                    </tr>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
          <Card>
            <CardHeader title="Support requests" />
            {data.tickets.length === 0 ? <p className="p-5 text-sm text-slate-500">No support requests.</p> : (
              <ul className="divide-y divide-slate-100 text-sm">
                {data.tickets.map((ticket) => <li key={ticket.id} className="flex justify-between gap-2 px-5 py-3"><span>{ticket.subject} <span className="text-xs text-slate-500">{ticket.ticketNumber} · {formatDate(ticket.createdAt)}</span></span><StatusPill status={ticket.status} /></li>)}
              </ul>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="space-y-1 p-5 text-sm">
            <h2 className="mb-2 font-semibold">Contact</h2>
            <p>{data.email}</p>
            <p>{formatMobile(data.mobile)}</p>
          </Card>
          <Card>
            <CardHeader title="Saved addresses" />
            <ul className="divide-y divide-slate-100 text-sm">
              {data.addresses.map((address) => <li key={address.id} className="px-5 py-3 text-slate-600"><span className="font-medium text-slate-900">{address.fullName}</span>{address.label && ` (${address.label})`}<br />{address.line1}{address.line2 && `, ${address.line2}`}, {address.city}, {address.state} {address.pincode}<br />{address.phone}</li>)}
              {data.addresses.length === 0 && <li className="px-5 py-3 text-slate-500">None saved.</li>}
            </ul>
          </Card>
          <Card className="p-5 text-sm">
            <h2 className="mb-2 font-semibold">Shipped to</h2>
            <p className="text-slate-600">{data.shippingHistory.map((place) => `${place.city} ${place.pincode}`).join(" · ") || "—"}</p>
          </Card>
        </div>
      </div>
      <Modal open={reason !== null} title={suspend ? "Suspend this account?" : "Reactivate this account?"} onClose={() => setReason(null)}>
        <form className="space-y-4" onSubmit={async (event) => {
          event.preventDefault();
          const result = await run(() => ecomApi.patch<CustomerDetail>(`/admin/customers/${data.id}/status`, { status: suspend ? "inactive" : "active", reason: (reason ?? "").trim() }), suspend ? "Account suspended" : "Account reactivated");
          if (result) { setData(result); setReason(null); }
        }}>
          <p className="text-sm text-slate-600">{suspend ? "The customer is signed out everywhere and cannot sign in. Existing orders continue." : "The customer can sign in again."}</p>
          <Field label="Reason (recorded in the audit log) *"><input className={inputClass} required minLength={3} maxLength={300} value={reason ?? ""} onChange={(event) => setReason(event.target.value)} /></Field>
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setReason(null)}>Cancel</Button><Button type="submit" variant={suspend ? "danger" : "primary"} loading={busy}>Confirm</Button></div>
        </form>
      </Modal>
    </>
  );
}

export default function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequirePermission permission="customers.view">
      <Detail id={id} />
    </RequirePermission>
  );
}
