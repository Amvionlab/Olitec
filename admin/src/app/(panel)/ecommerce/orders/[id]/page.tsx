"use client";

import { use, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { TBody, THead, Table, Td, Th } from "@/components/ui/Table";
import { useEcom } from "@/components/ecommerce/EcomSession";
import { Field, LoadState, Modal, RequirePermission, StatusPill, Thumb, inputClass, useAction, useApi } from "@/components/ecommerce/kit";
import { formatDateTime } from "@/lib/format";
import { ECOM_API_BASE, ecomApi, label, money } from "@/services/ecommerce/api";

interface Address { fullName: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string }

interface AdminOrder {
  id: number;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  placedAt: string;
  reservationExpiresAt: string | null;
  contact: { name: string; email: string; phone: string };
  shippingAddress: Address;
  billingAddress: Address;
  billingGstin: string | null;
  items: { id: number; sku: string; name: string; image: string | null; unitPrice: number; mrp: number; quantity: number; lineTotal: number }[];
  totals: { subtotal: number; discount: number; shipping: number; tax: number; total: number; couponCode: string | null };
  tracking: { courier: string | null; number: string | null; url: string | null };
  history: { fromStatus: string | null; toStatus: string; label: string; note: string | null; at: string; actorType: string; actorName: string | null }[];
  requests: { id: number; type: string; reason: string; status: string; adminRemark: string | null; createdAt: string }[];
  refunds: { id: number; refundNumber: string; amount: number; reason: string; status: string; failureReason: string | null; createdAt: string }[];
  notes: { id: number; note: string; adminName: string | null; createdAt: string }[];
  payments: { id: number; provider: string; providerOrderId: string; providerPaymentId: string | null; amount: number; status: string; method: string | null; errorDescription: string | null; createdAt: string }[];
  customer: { id: number; name: string; email: string; mobile: string; orderCount: number } | null;
  assignedTo: { id: number; name: string } | null;
  stockState: string;
  allowedStatuses: string[];
  customerNote: string | null;
}

function AddressBlock({ title, address }: { title: string; address: Address }) {
  return (
    <div className="text-sm">
      <p className="mb-1 font-medium text-slate-900">{title}</p>
      <p className="text-slate-600">{address.fullName}<br />{address.line1}{address.line2 && <><br />{address.line2}</>}<br />{address.city}, {address.state} {address.pincode}<br />{address.phone}</p>
    </div>
  );
}

function OrderDetail({ id }: { id: string }) {
  const { can } = useEcom();
  const { data: order, error, loading, setData } = useApi<AdminOrder>(`/admin/orders/${encodeURIComponent(id)}`);
  const staff = useApi<{ id: number; name: string }[]>("/admin/orders/staff");
  const { run, busy } = useAction();
  const [statusTo, setStatusTo] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [confirmStatus, setConfirmStatus] = useState(false);
  const [shipping, setShipping] = useState<{ courierName: string; trackingNumber: string; trackingUrl: string } | null>(null);
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState<{ requestId: number; decision: "approved" | "rejected"; type: string; remark: string } | null>(null);
  const [refundForm, setRefundForm] = useState<{ amount: string; reason: string } | null>(null);
  const [processing, setProcessing] = useState<{ refundId: number; offline: boolean; reference: string } | null>(null);

  if (!order) return <LoadState loading={loading} error={error}>{null}</LoadState>;
  const manage = can("orders.manage");
  const update = (next: AdminOrder | undefined) => next && setData(next);
  const reload = async () => update(await ecomApi.get<AdminOrder>(`/admin/orders/${order.id}`));
  const hasOnlinePayment = order.payments.some((payment) => payment.status === "captured");

  return (
    <>
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed ${formatDateTime(order.placedAt)} · ${order.paymentMethod === "cod" ? "Cash on delivery" : "Online payment"}`}
        back={{ href: "/ecommerce/orders", label: "Orders" }}
        actions={
          <>
            <StatusPill status={order.status} />
            <StatusPill status={order.paymentStatus} />
            <a href={`${ECOM_API_BASE}/admin/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
              <FileText className="size-4" aria-hidden /> Invoice
            </a>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {order.requests.filter((request) => request.status === "pending").map((request) => (
            <Alert key={request.id} tone="warning" title={`Customer requested ${request.type}`}>
              <p>{request.reason}</p>
              {manage && (
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => setDecision({ requestId: request.id, decision: "approved", type: request.type, remark: "" })}>Approve</Button>
                  <Button size="sm" variant="secondary" onClick={() => setDecision({ requestId: request.id, decision: "rejected", type: request.type, remark: "" })}>Reject</Button>
                </div>
              )}
            </Alert>
          ))}

          <Card>
            <CardHeader title={`Items (${order.items.reduce((sum, item) => sum + item.quantity, 0)})`} description="Prices as charged at checkout" />
            <Table>
              <THead><tr><Th>Product</Th><Th className="text-right">Unit price</Th><Th className="text-right">Qty</Th><Th className="text-right">Total</Th></tr></THead>
              <TBody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <Td><span className="flex items-center gap-3"><Thumb src={item.image} /><span><span className="block font-medium">{item.name}</span><span className="text-xs text-slate-500">{item.sku}</span></span></span></Td>
                    <Td className="text-right">{money(item.unitPrice)}</Td>
                    <Td className="text-right">{item.quantity}</Td>
                    <Td className="text-right font-medium">{money(item.lineTotal)}</Td>
                  </tr>
                ))}
              </TBody>
            </Table>
            <dl className="space-y-1 border-t border-slate-100 p-5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{money(order.totals.subtotal)}</dd></div>
              {order.totals.discount > 0 && <div className="flex justify-between"><dt className="text-slate-500">Discount {order.totals.couponCode && `(${order.totals.couponCode})`}</dt><dd>−{money(order.totals.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-slate-500">Shipping</dt><dd>{money(order.totals.shipping)}</dd></div>
              <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{money(order.totals.total)}</dd></div>
              <div className="flex justify-between text-xs text-slate-500"><dt>GST included</dt><dd>{money(order.totals.tax)}</dd></div>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Payments" />
            {order.payments.length === 0 ? <p className="p-5 text-sm text-slate-500">{order.paymentMethod === "cod" ? "Cash on delivery — collected on delivery." : "No payment attempts yet."}</p> : (
              <Table>
                <THead><tr><Th>Date</Th><Th>Gateway reference</Th><Th>Method</Th><Th className="text-right">Amount</Th><Th>Status</Th></tr></THead>
                <TBody>
                  {order.payments.map((payment) => (
                    <tr key={payment.id}>
                      <Td className="text-xs">{formatDateTime(payment.createdAt)}</Td>
                      <Td className="text-xs">{payment.provider}: {payment.providerPaymentId ?? payment.providerOrderId}{payment.errorDescription && <span className="block text-red-600">{payment.errorDescription}</span>}</Td>
                      <Td>{payment.method ?? "—"}</Td>
                      <Td className="text-right">{money(payment.amount)}</Td>
                      <Td><StatusPill status={payment.status} /></Td>
                    </tr>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Refunds"
              action={can("refunds.manage") && ["paid", "partially_refunded"].includes(order.paymentStatus) && <Button size="sm" variant="secondary" onClick={() => setRefundForm({ amount: "", reason: "" })}>New refund</Button>}
            />
            {order.refunds.length === 0 ? <p className="p-5 text-sm text-slate-500">No refunds.</p> : (
              <ul className="divide-y divide-slate-100">
                {order.refunds.map((refund) => (
                  <li key={refund.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                    <span>
                      <span className="font-medium">{refund.refundNumber}</span> · {money(refund.amount)} <StatusPill status={refund.status} />
                      <span className="block text-xs text-slate-500">{refund.reason}{refund.failureReason && ` — ${refund.failureReason}`}</span>
                    </span>
                    {can("refunds.manage") && ["pending", "failed"].includes(refund.status) && (
                      <Button size="sm" onClick={() => setProcessing({ refundId: refund.id, offline: !hasOnlinePayment, reference: "" })}>Process refund</Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Status history" />
            <ol className="space-y-3 p-5">
              {order.history.map((entry, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500" aria-hidden />
                  <span>
                    <span className="font-medium">{entry.label}</span>
                    <span className="text-slate-500"> · {formatDateTime(entry.at)} · {entry.actorName ?? label(entry.actorType)}</span>
                    {entry.note && <span className="block text-slate-600">{entry.note}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          {manage && order.allowedStatuses.length > 0 && (
            <Card className="space-y-3 p-5">
              <h2 className="font-semibold">Update status</h2>
              <select className={inputClass} value={statusTo} onChange={(event) => setStatusTo(event.target.value)} aria-label="New status">
                <option value="">Choose next status…</option>
                {order.allowedStatuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
              </select>
              <input className={inputClass} placeholder="Note (optional, shown in history)" maxLength={500} value={statusNote} onChange={(event) => setStatusNote(event.target.value)} />
              <Button disabled={!statusTo} onClick={() => setConfirmStatus(true)} variant={statusTo === "cancelled" ? "danger" : "primary"}>Apply</Button>
            </Card>
          )}

          <Card className="space-y-3 p-5 text-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Shipping & tracking</h2>
              {manage && <Button size="sm" variant="ghost" onClick={() => setShipping({ courierName: order.tracking.courier ?? "", trackingNumber: order.tracking.number ?? "", trackingUrl: order.tracking.url ?? "" })}>Edit</Button>}
            </div>
            <p className="text-slate-600">{order.tracking.courier || order.tracking.number ? <>{order.tracking.courier} · {order.tracking.number}{order.tracking.url && <a className="block text-brand-700 hover:underline" href={order.tracking.url} target="_blank" rel="noopener noreferrer">Tracking link</a>}</> : "No courier details yet."}</p>
            <AddressBlock title="Ship to" address={order.shippingAddress} />
            <AddressBlock title="Bill to" address={order.billingAddress} />
            {order.billingGstin && <p>GSTIN: {order.billingGstin}</p>}
            {order.customerNote && <p className="rounded-lg bg-amber-50 p-2 text-amber-900">Customer note: {order.customerNote}</p>}
          </Card>

          <Card className="space-y-2 p-5 text-sm">
            <h2 className="font-semibold">Customer</h2>
            <p>{order.contact.name}<br />{order.contact.email}<br />{order.contact.phone}</p>
            {order.customer ? <Link href={`/ecommerce/customers/${order.customer.id}`} className="text-brand-700 hover:underline">Customer profile · {order.customer.orderCount} orders</Link> : <p className="text-slate-500">Guest checkout</p>}
          </Card>

          {manage && (
            <Card className="space-y-2 p-5 text-sm">
              <h2 className="font-semibold">Assigned to</h2>
              <select className={inputClass} value={order.assignedTo?.id ?? ""} onChange={async (event) => update(await run(() => ecomApi.patch<AdminOrder>(`/admin/orders/${order.id}/assign`, { adminId: event.target.value ? Number(event.target.value) : null }), "Assignment saved"))} aria-label="Assign order">
                <option value="">Unassigned</option>
                {staff.data?.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
              </select>
            </Card>
          )}

          <Card className="space-y-3 p-5 text-sm">
            <h2 className="font-semibold">Internal notes</h2>
            <form className="flex gap-2" onSubmit={async (event) => { event.preventDefault(); if (note.trim().length < 2) return; update(await run(() => ecomApi.post<AdminOrder>(`/admin/orders/${order.id}/notes`, { note: note.trim() }), "Note added")); setNote(""); }}>
              <input className={inputClass} placeholder="Visible to staff only" maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} aria-label="New note" />
              <Button type="submit" size="sm" loading={busy}>Add</Button>
            </form>
            <ul className="space-y-2">
              {order.notes.map((item) => <li key={item.id} className="rounded-lg bg-slate-50 p-2"><p>{item.note}</p><p className="text-xs text-slate-500">{item.adminName} · {formatDateTime(item.createdAt)}</p></li>)}
            </ul>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmStatus}
        title={`Change status to ${label(statusTo)}?`}
        description={statusTo === "cancelled" ? "Stock is returned to inventory and, if the order was paid, a refund is opened for processing." : "The customer sees the new status in their order tracking."}
        confirmLabel="Change status"
        tone={statusTo === "cancelled" ? "danger" : "primary"}
        loading={busy}
        onCancel={() => setConfirmStatus(false)}
        onConfirm={async () => {
          update(await run(() => ecomApi.patch<AdminOrder>(`/admin/orders/${order.id}/status`, { status: statusTo, ...(statusNote ? { note: statusNote } : {}) }), "Status updated"));
          setConfirmStatus(false);
          setStatusTo("");
          setStatusNote("");
        }}
      />

      <Modal open={shipping !== null} title="Courier and tracking" onClose={() => setShipping(null)}>
        {shipping && (
          <form className="space-y-4" onSubmit={async (event) => {
            event.preventDefault();
            const body = Object.fromEntries(Object.entries(shipping).filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()]));
            const result = await run(() => ecomApi.patch<AdminOrder>(`/admin/orders/${order.id}/shipping`, body), "Shipping details saved");
            if (result) { update(result); setShipping(null); }
          }}>
            <Field label="Courier"><input className={inputClass} value={shipping.courierName} maxLength={100} onChange={(event) => setShipping({ ...shipping, courierName: event.target.value })} /></Field>
            <Field label="Tracking number"><input className={inputClass} value={shipping.trackingNumber} maxLength={100} onChange={(event) => setShipping({ ...shipping, trackingNumber: event.target.value })} /></Field>
            <Field label="Tracking URL" hint="Must start with https://"><input className={inputClass} type="url" value={shipping.trackingUrl} maxLength={512} onChange={(event) => setShipping({ ...shipping, trackingUrl: event.target.value })} /></Field>
            <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShipping(null)}>Cancel</Button><Button type="submit" loading={busy}>Save</Button></div>
          </form>
        )}
      </Modal>

      <Modal open={decision !== null} title={`${decision?.decision === "approved" ? "Approve" : "Reject"} ${decision?.type} request`} onClose={() => setDecision(null)}>
        {decision && (
          <form className="space-y-4" onSubmit={async (event) => {
            event.preventDefault();
            const result = await run(() => ecomApi.post<AdminOrder>(`/admin/orders/${order.id}/requests/${decision.requestId}`, { decision: decision.decision, remark: decision.remark.trim() }), "Request decided");
            if (result) { update(result); setDecision(null); }
          }}>
            <p className="text-sm text-slate-600">
              {decision.decision === "approved"
                ? decision.type === "return" ? "The order becomes Returned, stock goes back to inventory and a refund is opened." : "The order is cancelled, stock is returned and a refund is opened if it was paid."
                : decision.type === "return" ? "The order goes back to Delivered." : "The order continues as normal."}
            </p>
            <Field label="Remark for the customer *"><textarea className={`${inputClass} min-h-20`} required minLength={3} maxLength={500} value={decision.remark} onChange={(event) => setDecision({ ...decision, remark: event.target.value })} /></Field>
            <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setDecision(null)}>Cancel</Button><Button type="submit" variant={decision.decision === "approved" ? "primary" : "danger"} loading={busy}>Confirm</Button></div>
          </form>
        )}
      </Modal>

      <Modal open={refundForm !== null} title="New refund" onClose={() => setRefundForm(null)}>
        {refundForm && (
          <form className="space-y-4" onSubmit={async (event) => {
            event.preventDefault();
            const ok = await run(() => ecomApi.post("/admin/refunds", { orderId: order.id, amount: Number(refundForm.amount), reason: refundForm.reason.trim() }), "Refund created — process it to send the money");
            if (ok) { setRefundForm(null); await reload(); }
          }}>
            <Field label="Amount (₹) *" hint={`Order total ${money(order.totals.total)}`}><input className={inputClass} inputMode="decimal" required value={refundForm.amount} onChange={(event) => setRefundForm({ ...refundForm, amount: event.target.value })} /></Field>
            <Field label="Reason *"><textarea className={`${inputClass} min-h-20`} required minLength={3} maxLength={500} value={refundForm.reason} onChange={(event) => setRefundForm({ ...refundForm, reason: event.target.value })} /></Field>
            <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setRefundForm(null)}>Cancel</Button><Button type="submit" loading={busy}>Create refund</Button></div>
          </form>
        )}
      </Modal>

      <Modal open={processing !== null} title="Process refund" onClose={() => setProcessing(null)}>
        {processing && (
          <form className="space-y-4" onSubmit={async (event) => {
            event.preventDefault();
            const ok = await run(() => ecomApi.post(`/admin/refunds/${processing.refundId}/process`, processing.offline ? { offlineReference: processing.reference.trim() } : {}), "Refund sent");
            setProcessing(null);
            if (ok) await reload();
          }}>
            {processing.offline ? (
              <>
                <p className="text-sm text-slate-600">This order has no online payment. Pay the customer by bank transfer or UPI, then record the transaction reference here.</p>
                <Field label="Transfer reference *"><input className={inputClass} required minLength={3} maxLength={60} value={processing.reference} onChange={(event) => setProcessing({ ...processing, reference: event.target.value })} /></Field>
              </>
            ) : (
              <p className="text-sm text-slate-600">The refund is sent to the payment gateway, which returns the money to the customer&apos;s original payment method. This cannot be undone.</p>
            )}
            <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setProcessing(null)}>Cancel</Button><Button type="submit" variant="danger" loading={busy}>Send refund</Button></div>
          </form>
        )}
      </Modal>
    </>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequirePermission permission="orders.view">
      <OrderDetail id={id} />
    </RequirePermission>
  );
}
