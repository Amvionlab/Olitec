/** Order reads shared by customer and admin views. */
import { query, queryOne, type Queryable } from "../../../db/pool.js";
import { json } from "../shared/http.js";
import { STATUS_LABELS, type OrderStatus } from "./order-status.js";

export interface OrderRow {
  id: number;
  order_number: string;
  customer_id: number | null;
  idempotency_key: string;
  access_token_hash: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  shipping_address: unknown;
  billing_address: unknown;
  billing_gstin: string | null;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  grand_total: number;
  coupon_id: number | null;
  coupon_code: string | null;
  payment_method: "online" | "cod";
  payment_status: string;
  status: OrderStatus;
  stock_state: "reserved" | "committed" | "released" | "restocked";
  reservation_expires_at: Date | null;
  courier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  assigned_admin_id: number | null;
  customer_note: string | null;
  placed_at: Date;
  confirmed_at: Date | null;
  shipped_at: Date | null;
  delivered_at: Date | null;
  cancelled_at: Date | null;
}

export async function findOrderByNumber(orderNumber: string, db?: Queryable, forUpdate = false) {
  return queryOne<OrderRow>(`SELECT * FROM ecom_orders WHERE order_number = ?${forUpdate ? " FOR UPDATE" : ""}`, [orderNumber], db);
}

export async function findOrderById(id: number, db?: Queryable, forUpdate = false) {
  return queryOne<OrderRow>(`SELECT * FROM ecom_orders WHERE id = ?${forUpdate ? " FOR UPDATE" : ""}`, [id], db);
}

export async function orderItems(orderId: number, db?: Queryable) {
  const rows = await query(
    `SELECT i.*, p.slug FROM ecom_order_items i LEFT JOIN ecom_products p ON p.id = i.product_id WHERE i.order_id = ? ORDER BY i.id`,
    [orderId],
    db,
  );
  return rows.map((row) => ({
    id: Number(row.id),
    productId: row.product_id ? Number(row.product_id) : null,
    slug: row.slug ?? null,
    sku: row.sku,
    name: row.product_name,
    image: row.image_url,
    attributes: json<Record<string, string>>(row.attributes, {}),
    mrp: Number(row.mrp),
    unitPrice: Number(row.unit_price),
    taxRate: Number(row.tax_rate),
    hsnCode: row.hsn_code,
    quantity: row.quantity,
    lineTotal: Number(row.line_total),
  }));
}

export async function orderHistory(orderId: number, includeActors = false) {
  const rows = await query(
    `SELECT h.*, a.name AS admin_name FROM ecom_order_status_history h LEFT JOIN admins a ON h.actor_type = 'admin' AND a.id = h.actor_id
      WHERE h.order_id = ? ORDER BY h.id`,
    [orderId],
  );
  return rows.map((row) => ({
    fromStatus: row.from_status,
    toStatus: row.to_status,
    label: STATUS_LABELS[row.to_status as OrderStatus] ?? row.to_status,
    note: row.note,
    at: row.created_at,
    ...(includeActors ? { actorType: row.actor_type, actorName: row.admin_name ?? null } : {}),
  }));
}

export async function orderRequests(orderId: number) {
  const rows = await query("SELECT * FROM ecom_order_requests WHERE order_id = ? ORDER BY id DESC", [orderId]);
  return rows.map((row) => ({
    id: Number(row.id),
    type: row.request_type,
    reason: row.reason,
    status: row.status,
    adminRemark: row.admin_remark,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
  }));
}

export async function orderRefunds(orderId: number) {
  const rows = await query("SELECT * FROM ecom_refunds WHERE order_id = ? ORDER BY id DESC", [orderId]);
  return rows.map((row) => ({
    id: Number(row.id),
    refundNumber: row.refund_number,
    amount: Number(row.amount),
    reason: row.reason,
    status: row.status,
    providerRefundId: row.provider_refund_id,
    failureReason: row.failure_reason,
    requestedBy: row.requested_by,
    processedAt: row.processed_at,
    createdAt: row.created_at,
  }));
}

/** The order as the customer sees it (no internal notes, no admin names). */
export async function customerOrderView(order: OrderRow) {
  const [items, history, requests, refunds, payment] = await Promise.all([
    orderItems(order.id),
    orderHistory(order.id),
    orderRequests(order.id),
    orderRefunds(order.id),
    queryOne<{ provider_payment_id: string | null; method: string | null; status: string }>(
      "SELECT provider_payment_id, method, status FROM ecom_payments WHERE order_id = ? ORDER BY id DESC LIMIT 1",
      [order.id],
    ),
  ]);
  return {
    orderNumber: order.order_number,
    status: order.status,
    statusLabel: STATUS_LABELS[order.status],
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    payment: payment ? { reference: payment.provider_payment_id, method: payment.method, status: payment.status } : null,
    placedAt: order.placed_at,
    reservationExpiresAt: order.status === "pending_payment" ? order.reservation_expires_at : null,
    contact: { name: order.contact_name, email: order.contact_email, phone: order.contact_phone },
    shippingAddress: json(order.shipping_address, {}),
    billingAddress: json(order.billing_address, {}),
    billingGstin: order.billing_gstin,
    items,
    totals: {
      subtotal: Number(order.subtotal),
      discount: Number(order.discount_total),
      shipping: Number(order.shipping_total),
      tax: Number(order.tax_total),
      total: Number(order.grand_total),
      couponCode: order.coupon_code,
    },
    tracking: { courier: order.courier_name, number: order.tracking_number, url: order.tracking_url, shippedAt: order.shipped_at, deliveredAt: order.delivered_at },
    history,
    requests,
    refunds: refunds.map(({ id: _id, providerRefundId: _ref, requestedBy: _by, ...refund }) => refund),
    customerNote: order.customer_note,
  };
}
