"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, FileText, Package, Truck } from "lucide-react";
import { Alert, Button, Card, Spinner, StatusPill, TextArea, orderTone } from "@/components/ui";
import { ProductImage } from "@/components/product/ProductImage";
import { API_BASE, api, errorMessage, toQuery } from "@/services/api";
import type { OrderDetail } from "@/types";
import { formatDate, formatPrice, PAYMENT_STATUS_LABELS } from "@/utils/format";
import { PayButton } from "./PayButton";

const PROGRESS = ["confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered"] as const;
const PROGRESS_LABELS: Record<(typeof PROGRESS)[number], string> = {
  confirmed: "Confirmed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};

function Address({ title, address }: { title: string; address: OrderDetail["shippingAddress"] }) {
  return (
    <div className="text-sm">
      <p className="mb-1 font-semibold text-slate-900">{title}</p>
      <p className="text-slate-600">
        {address.fullName}
        <br />
        {address.line1}
        {address.line2 && (
          <>
            <br />
            {address.line2}
          </>
        )}
        <br />
        {address.city}, {address.state} {address.pincode}
        <br />
        {address.phone}
      </p>
    </div>
  );
}

/** Full order view for customers: status timeline, payment, items, addresses, tracking and cancel/return requests. */
export function OrderView({ orderNumber, token, autoPay }: { orderNumber: string; token?: string; autoPay?: boolean }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "success" | "error" | "info"; text: string } | null>(null);
  const [requestType, setRequestType] = useState<"cancel" | "return" | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setOrder(await api.get<OrderDetail>(`/orders/${orderNumber}${toQuery({ token })}`));
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }, [orderNumber, token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <Alert>{error === "Order not found." ? "We could not find this order. Sign in with the account that placed it, or use Track order." : error}</Alert>;
  if (!order) return <Spinner label="Loading order" />;

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (reason.trim().length < 5) return setMessage({ kind: "error", text: "Please tell us the reason (at least 5 characters)." });
    setBusy(true);
    try {
      const result = await api.post<{ cancelled?: boolean }>(`/orders/${orderNumber}/${requestType}`, { reason: reason.trim(), token });
      setMessage({
        kind: "success",
        text: result.cancelled ? "Your order has been cancelled." : requestType === "cancel" ? "Cancellation requested. We will update you shortly." : "Return requested. Our team will contact you.",
      });
      setRequestType(null);
      setReason("");
      await load();
    } catch (reason) {
      setMessage({ kind: "error", text: errorMessage(reason) });
    } finally {
      setBusy(false);
    }
  };

  const reached = (status: string) => order.history.some((entry) => entry.toStatus === status);
  const inFulfilment = !["cancelled", "pending_payment", "refunded"].includes(order.status);
  const invoiceUrl = `${API_BASE}/orders/${orderNumber}/invoice${toQuery({ token })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Order {order.orderNumber}</h1>
          <p className="text-sm text-slate-500">Placed {formatDate(order.placedAt, true)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill label={order.statusLabel} tone={orderTone(order.status)} />
          <StatusPill label={PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus} tone={order.paymentStatus === "paid" ? "green" : order.paymentStatus === "failed" ? "red" : "amber"} />
        </div>
      </div>

      {message && <Alert kind={message.kind}>{message.text}</Alert>}

      {order.actions.canPay && (
        <Card className="flex flex-col gap-4 border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-amber-900">Payment pending — {formatPrice(order.totals.total)}</p>
            <p className="text-sm text-amber-800">
              {order.reservationExpiresAt ? `Complete payment by ${formatDate(order.reservationExpiresAt, true)} to keep your items.` : "Complete payment to confirm your order."}
            </p>
          </div>
          <PayButton
            orderNumber={order.orderNumber}
            token={token}
            autoStart={autoPay}
            onDone={(result) => {
              setMessage(result);
              void load();
            }}
          />
        </Card>
      )}

      {order.status === "confirmed" && order.history.length <= 2 && !message && (
        <Alert kind="success">Thank you! Your order is confirmed. Keep your order number {order.orderNumber} to track it.</Alert>
      )}

      {inFulfilment && (
        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Order progress</h2>
          <ol className="grid gap-3 sm:grid-cols-6">
            {PROGRESS.map((status) => {
              const done = reached(status) || order.status === status;
              const entry = order.history.find((item) => item.toStatus === status);
              return (
                <li key={status} className="flex items-center gap-2 sm:flex-col sm:text-center">
                  {done ? <CheckCircle2 className="size-6 text-leaf" aria-hidden /> : <Circle className="size-6 text-slate-300" aria-hidden />}
                  <span>
                    <span className={done ? "block text-sm font-semibold text-slate-900" : "block text-sm text-slate-500"}>{PROGRESS_LABELS[status]}</span>
                    {entry && <span className="text-xs text-slate-500">{formatDate(entry.at)}</span>}
                  </span>
                </li>
              );
            })}
          </ol>
          {(order.tracking.number || order.tracking.courier) && (
            <p className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <Truck className="size-4 text-brand-600" aria-hidden />
              {order.tracking.courier} {order.tracking.number && <>· Tracking number <strong>{order.tracking.number}</strong></>}
              {order.tracking.url && (
                <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 hover:underline">
                  Track shipment
                </a>
              )}
            </p>
          )}
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="divide-y divide-slate-100">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4">
              <ProductImage src={item.image} alt={item.name} sizes="64px" className="size-16 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                {item.slug ? (
                  <Link href={`/products/${item.slug}`} className="font-medium text-slate-900 hover:text-brand-700">
                    {item.name}
                  </Link>
                ) : (
                  <p className="font-medium text-slate-900">{item.name}</p>
                )}
                <p className="text-xs text-slate-500">
                  SKU {item.sku} · {formatPrice(item.unitPrice)} × {item.quantity}
                </p>
              </div>
              <p className="font-semibold">{formatPrice(item.lineTotal)}</p>
            </div>
          ))}
        </Card>
        <Card className="space-y-3 p-5 text-sm">
          <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span>{formatPrice(order.totals.subtotal)}</span></div>
          {order.totals.discount > 0 && <div className="flex justify-between text-leaf"><span>Discount {order.totals.couponCode && `(${order.totals.couponCode})`}</span><span>−{formatPrice(order.totals.discount)}</span></div>}
          <div className="flex justify-between"><span className="text-slate-600">Shipping</span><span>{order.totals.shipping > 0 ? formatPrice(order.totals.shipping) : "Free"}</span></div>
          <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold"><span>Total</span><span>{formatPrice(order.totals.total)}</span></div>
          <div className="flex justify-between text-xs text-slate-500"><span>Includes GST</span><span>{formatPrice(order.totals.tax)}</span></div>
          <p className="pt-2 text-slate-600">
            Payment: {order.paymentMethod === "cod" ? "Cash on delivery" : "Online"}
            {order.payment?.reference && <span className="block text-xs text-slate-500">Reference {order.payment.reference}</span>}
          </p>
          <a href={invoiceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline">
            <FileText className="size-4" aria-hidden /> View / download invoice
          </a>
        </Card>
      </div>

      <Card className="grid gap-6 p-5 sm:grid-cols-3">
        <Address title="Shipping address" address={order.shippingAddress} />
        <Address title="Billing address" address={order.billingAddress} />
        <div className="text-sm">
          <p className="mb-1 font-semibold text-slate-900">Contact</p>
          <p className="text-slate-600">
            {order.contact.name}
            <br />
            {order.contact.email}
            <br />
            {order.contact.phone}
          </p>
          {order.billingGstin && <p className="mt-2 text-slate-600">GSTIN {order.billingGstin}</p>}
        </div>
      </Card>

      {(order.requests.length > 0 || order.refunds.length > 0) && (
        <Card className="space-y-3 p-5 text-sm">
          <h2 className="font-semibold text-slate-900">Requests and refunds</h2>
          {order.requests.map((request) => (
            <div key={request.id} className="rounded-lg bg-slate-50 p-3">
              <p className="font-medium capitalize">
                {request.type} request · <span className="text-slate-600">{request.status}</span>
              </p>
              <p className="text-slate-600">{request.reason}</p>
              {request.adminRemark && <p className="mt-1 text-slate-500">Response: {request.adminRemark}</p>}
            </div>
          ))}
          {order.refunds.map((refund) => (
            <div key={refund.refundNumber} className="flex justify-between rounded-lg bg-slate-50 p-3">
              <span>
                Refund {refund.refundNumber} · <span className="capitalize text-slate-600">{refund.status}</span>
              </span>
              <span className="font-semibold">{formatPrice(refund.amount)}</span>
            </div>
          ))}
        </Card>
      )}

      {(order.actions.canCancel || order.actions.canReturn) && (
        <Card className="space-y-3 p-5">
          {!requestType ? (
            <div className="flex flex-wrap items-center gap-3">
              <Package className="size-5 text-slate-400" aria-hidden />
              <p className="flex-1 text-sm text-slate-600">
                {order.actions.canReturn && order.actions.returnDeadline ? `You can request a return until ${formatDate(order.actions.returnDeadline)}.` : "Need to change something?"}
              </p>
              {order.actions.canCancel && (
                <Button variant="secondary" size="sm" onClick={() => setRequestType("cancel")}>
                  Cancel order
                </Button>
              )}
              {order.actions.canReturn && (
                <Button variant="secondary" size="sm" onClick={() => setRequestType("return")}>
                  Request return
                </Button>
              )}
            </div>
          ) : (
            <form onSubmit={submitRequest} className="space-y-3">
              <label htmlFor="request-reason" className="block text-sm font-semibold text-slate-900">
                {requestType === "cancel" ? "Why do you want to cancel?" : "Why are you returning this order?"}
              </label>
              <TextArea id="request-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} required />
              <div className="flex gap-2">
                <Button type="submit" variant="danger" size="sm" loading={busy}>
                  {requestType === "cancel" ? "Confirm cancellation" : "Submit return request"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setRequestType(null)}>
                  Keep order
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}
    </div>
  );
}
