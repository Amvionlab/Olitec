import type { FastifyRequest } from "fastify";
import { execute, query, queryOne, withTransaction } from "../../../db/pool.js";
import { BusinessRuleError, ForbiddenError, NotFoundError } from "../../../utils/errors.js";
import { inventoryService } from "../inventory/inventory.service.js";
import { audit } from "../shared/audit.js";
import { sha256 } from "../shared/auth.js";
import { json, pageWindow, type PageQuery } from "../shared/http.js";
import { getSettings } from "../shared/settings.js";
import { cancelOrder, changeStatus, createRefund, type Actor } from "./order-lifecycle.js";
import { ADMIN_SETTABLE, nextStatuses, STATUS_LABELS, type OrderStatus } from "./order-status.js";
import {
  customerOrderView,
  findOrderById,
  findOrderByNumber,
  orderHistory,
  orderItems,
  orderRefunds,
  orderRequests,
  type OrderRow,
} from "./orders.repository.js";

/** A customer may see an order they own, or a guest order when they hold its access token. */
export async function authorizeOrderAccess(request: FastifyRequest, orderNumber: string, token?: string): Promise<OrderRow> {
  const order = await findOrderByNumber(orderNumber);
  if (!order) throw new NotFoundError("Order");
  const owner = request.ecomCustomer && Number(order.customer_id) === request.ecomCustomer.id;
  const tokenOk = token !== undefined && token.length > 20 && sha256(token) === order.access_token_hash;
  if (!owner && !tokenOk) throw new NotFoundError("Order");
  return order;
}

function adminListRow(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    orderNumber: row.order_number,
    placedAt: row.placed_at,
    customerName: row.contact_name,
    customerEmail: row.contact_email,
    customerPhone: row.contact_phone,
    isGuest: row.customer_id === null,
    itemCount: Number(row.item_count),
    total: Number(row.grand_total),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: row.status,
    statusLabel: STATUS_LABELS[row.status as OrderStatus],
    shippingCity: (json<{ city?: string }>(row.shipping_address, {}).city ?? null) as string | null,
    trackingNumber: row.tracking_number,
    assignedTo: row.assigned_name ?? null,
    openRequests: Number(row.open_requests),
  };
}

export interface AdminOrderFilters extends PageQuery {
  q?: string;
  status?: OrderStatus;
  paymentStatus?: string;
  from?: string;
  to?: string;
  assignedToMe?: boolean;
  hasOpenRequest?: boolean;
}

export const orderService = {
  // ------------------------------------------------------------------ customer

  async listForCustomer(customerId: number, page: PageQuery) {
    const window = pageWindow(page);
    const [rows, count] = await Promise.all([
      query(
        `SELECT o.order_number, o.placed_at, o.status, o.payment_status, o.payment_method, o.grand_total,
                (SELECT SUM(quantity) FROM ecom_order_items WHERE order_id = o.id) AS item_count,
                (SELECT image_url FROM ecom_order_items WHERE order_id = o.id ORDER BY id LIMIT 1) AS image
           FROM ecom_orders o WHERE o.customer_id = ? ORDER BY o.placed_at DESC, o.id DESC LIMIT ? OFFSET ?`,
        [customerId, window.limit, window.offset],
      ),
      queryOne<{ total: number }>("SELECT COUNT(*) AS total FROM ecom_orders WHERE customer_id = ?", [customerId]),
    ]);
    return {
      items: rows.map((row) => ({
        orderNumber: row.order_number,
        placedAt: row.placed_at,
        status: row.status,
        statusLabel: STATUS_LABELS[row.status as OrderStatus],
        paymentStatus: row.payment_status,
        paymentMethod: row.payment_method,
        total: Number(row.grand_total),
        itemCount: Number(row.item_count ?? 0),
        image: row.image,
      })),
      meta: window.meta(Number(count?.total ?? 0)),
    };
  },

  async getForCustomer(request: FastifyRequest, orderNumber: string, token?: string) {
    const order = await authorizeOrderAccess(request, orderNumber, token);
    const settings = await getSettings();
    const view = await customerOrderView(order);
    const openRequest = view.requests.some((item) => item.status === "pending");
    const returnDeadline =
      order.delivered_at && settings.returns.returnWindowDays > 0 ? new Date(new Date(order.delivered_at).getTime() + settings.returns.returnWindowDays * 86400_000) : null;
    return {
      ...view,
      actions: {
        canPay: order.status === "pending_payment" && order.payment_method === "online",
        canCancel: !openRequest && settings.returns.cancellableStatuses.includes(order.status),
        canReturn: !openRequest && order.status === "delivered" && returnDeadline !== null && returnDeadline.getTime() > Date.now(),
        returnDeadline,
      },
    };
  },

  /**
   * Customer cancellation. Unpaid orders are cancelled at once; confirmed orders become a request that staff approve,
   * because the order may already be in fulfilment.
   */
  async requestCancellation(request: FastifyRequest, orderNumber: string, reason: string, token?: string) {
    const settings = await getSettings();
    const actor: Actor = { type: "customer", id: request.ecomCustomer?.id ?? null };
    const found = await authorizeOrderAccess(request, orderNumber, token);
    return withTransaction(async (db) => {
      const order = (await findOrderById(found.id, db, true))!;
      if (!settings.returns.cancellableStatuses.includes(order.status)) throw new BusinessRuleError("This order can no longer be cancelled.");
      if (await queryOne("SELECT 1 FROM ecom_order_requests WHERE order_id = ? AND status = 'pending'", [order.id], db)) {
        throw new BusinessRuleError("A request for this order is already being reviewed.");
      }
      if (order.status === "pending_payment") {
        await cancelOrder(db, order, actor, `Cancelled by customer: ${reason}`);
        return { cancelled: true, requestCreated: false };
      }
      await execute("INSERT INTO ecom_order_requests (order_id, request_type, reason) VALUES (?, 'cancellation', ?)", [order.id, reason], db);
      return { cancelled: false, requestCreated: true };
    });
  },

  async requestReturn(request: FastifyRequest, orderNumber: string, reason: string, token?: string) {
    const settings = await getSettings();
    const found = await authorizeOrderAccess(request, orderNumber, token);
    return withTransaction(async (db) => {
      const order = (await findOrderById(found.id, db, true))!;
      if (order.status !== "delivered" || !order.delivered_at) throw new BusinessRuleError("Returns can be requested only for delivered orders.");
      const days = settings.returns.returnWindowDays;
      if (days <= 0) throw new BusinessRuleError("Returns are not available for this store. Please contact support.");
      if (Date.now() > new Date(order.delivered_at).getTime() + days * 86400_000) throw new BusinessRuleError(`The ${days}-day return window for this order has closed.`);
      await execute("INSERT INTO ecom_order_requests (order_id, request_type, reason) VALUES (?, 'return', ?)", [order.id, reason], db);
      await changeStatus(db, order, "return_requested", { type: "customer", id: request.ecomCustomer?.id ?? null }, reason);
      return { requestCreated: true };
    });
  },

  /** Public tracking by order number + email. Returns status information only, never addresses or items' prices. */
  async track(orderNumber: string, email: string) {
    const order = await findOrderByNumber(orderNumber.trim().toUpperCase());
    if (!order || order.contact_email !== email.trim().toLowerCase()) throw new NotFoundError("Order");
    return {
      orderNumber: order.order_number,
      status: order.status,
      statusLabel: STATUS_LABELS[order.status],
      paymentStatus: order.payment_status,
      placedAt: order.placed_at,
      tracking: { courier: order.courier_name, number: order.tracking_number, url: order.tracking_url, shippedAt: order.shipped_at, deliveredAt: order.delivered_at },
      history: await orderHistory(order.id),
      itemCount: (await orderItems(order.id)).reduce((sum, item) => sum + item.quantity, 0),
    };
  },

  // ------------------------------------------------------------------ admin

  async adminList(request: FastifyRequest, filters: AdminOrderFilters) {
    const where = ["TRUE"];
    const params: unknown[] = [];
    if (filters.q) {
      const like = `%${filters.q.trim().replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
      where.push("(o.order_number LIKE ? OR o.contact_name LIKE ? OR o.contact_email LIKE ? OR o.contact_phone LIKE ? OR o.tracking_number LIKE ?)");
      params.push(like, like, like, like, like);
    }
    if (filters.status) {
      where.push("o.status = ?");
      params.push(filters.status);
    }
    if (filters.paymentStatus) {
      where.push("o.payment_status = ?");
      params.push(filters.paymentStatus);
    }
    if (filters.from) {
      where.push("o.placed_at >= ?");
      params.push(`${filters.from} 00:00:00`);
    }
    if (filters.to) {
      where.push("o.placed_at <= ?");
      params.push(`${filters.to} 23:59:59`);
    }
    if (filters.assignedToMe) {
      where.push("o.assigned_admin_id = ?");
      params.push(request.ecomAdmin?.id ?? 0);
    }
    if (filters.hasOpenRequest) where.push("EXISTS (SELECT 1 FROM ecom_order_requests r WHERE r.order_id = o.id AND r.status = 'pending')");

    const window = pageWindow(filters);
    const [rows, count] = await Promise.all([
      query(
        `SELECT o.*, a.name AS assigned_name,
                (SELECT SUM(quantity) FROM ecom_order_items WHERE order_id = o.id) AS item_count,
                (SELECT COUNT(*) FROM ecom_order_requests r WHERE r.order_id = o.id AND r.status = 'pending') AS open_requests
           FROM ecom_orders o LEFT JOIN admins a ON a.id = o.assigned_admin_id
          WHERE ${where.join(" AND ")} ORDER BY o.placed_at DESC, o.id DESC LIMIT ? OFFSET ?`,
        [...params, window.limit, window.offset],
      ),
      queryOne<{ total: number }>(`SELECT COUNT(*) AS total FROM ecom_orders o WHERE ${where.join(" AND ")}`, params),
    ]);
    return { items: rows.map(adminListRow), meta: window.meta(Number(count?.total ?? 0)) };
  },

  async adminGet(id: number) {
    const order = await findOrderById(id);
    if (!order) throw new NotFoundError("Order");
    const [view, history, notes, payments, refunds, requests, customer, assigned] = await Promise.all([
      customerOrderView(order),
      orderHistory(order.id, true),
      query("SELECT n.id, n.note, n.created_at, a.name AS admin_name FROM ecom_order_notes n LEFT JOIN admins a ON a.id = n.admin_id WHERE n.order_id = ? ORDER BY n.id DESC", [order.id]),
      query("SELECT * FROM ecom_payments WHERE order_id = ? ORDER BY id DESC", [order.id]),
      orderRefunds(order.id),
      orderRequests(order.id),
      order.customer_id
        ? queryOne<{ id: number; name: string; email: string; mobile: string; status: string; created_at: Date; orders: number }>(
            "SELECT c.id, c.name, c.email, c.mobile, c.status, c.created_at, (SELECT COUNT(*) FROM ecom_orders WHERE customer_id = c.id) AS orders FROM customers c WHERE c.id = ?",
            [order.customer_id],
          )
        : undefined,
      order.assigned_admin_id ? queryOne<{ id: number; name: string }>("SELECT id, name FROM admins WHERE id = ?", [order.assigned_admin_id]) : undefined,
    ]);
    return {
      id: Number(order.id),
      ...view,
      history,
      refunds,
      requests,
      notes: notes.map((note) => ({ id: Number(note.id), note: note.note, adminName: note.admin_name, createdAt: note.created_at })),
      payments: payments.map((payment) => ({
        id: Number(payment.id),
        provider: payment.provider,
        providerOrderId: payment.provider_order_id,
        providerPaymentId: payment.provider_payment_id,
        amount: Number(payment.amount),
        status: payment.status,
        method: payment.method,
        errorCode: payment.error_code,
        errorDescription: payment.error_description,
        createdAt: payment.created_at,
      })),
      customer: customer ? { id: Number(customer.id), name: customer.name, email: customer.email, mobile: customer.mobile, status: customer.status, since: customer.created_at, orderCount: Number(customer.orders) } : null,
      assignedTo: assigned ? { id: Number(assigned.id), name: assigned.name } : null,
      stockState: order.stock_state,
      allowedStatuses: nextStatuses(order.status).filter((status) => ADMIN_SETTABLE.includes(status)),
    };
  },

  async adminUpdateStatus(request: FastifyRequest, id: number, to: OrderStatus, note?: string) {
    if (!ADMIN_SETTABLE.includes(to)) throw new BusinessRuleError(`${STATUS_LABELS[to]} is set automatically and cannot be chosen here.`);
    const actor: Actor = { type: "admin", id: request.ecomAdmin!.id };
    await withTransaction(async (db) => {
      const order = await findOrderById(id, db, true);
      if (!order) throw new NotFoundError("Order");
      const from = order.status;
      if (to === "cancelled") {
        await cancelOrder(db, order, actor, note ?? "Cancelled by store");
        await execute("UPDATE ecom_order_requests SET status = 'approved', decided_by = ?, decided_at = UTC_TIMESTAMP(), admin_remark = ? WHERE order_id = ? AND request_type = 'cancellation' AND status = 'pending'", [actor.id, note ?? null, order.id], db);
      } else {
        if (to === "shipped" && !order.tracking_number && !order.courier_name) throw new BusinessRuleError("Add the courier and tracking number before marking the order as shipped.");
        await changeStatus(db, order, to, actor, note ?? null);
        // COD is collected on delivery.
        if (to === "delivered" && order.payment_method === "cod" && order.payment_status === "cod_pending") {
          await execute("UPDATE ecom_orders SET payment_status = 'paid' WHERE id = ?", [order.id], db);
        }
      }
      await audit(request, "order.status", "order", order.order_number, { from, to, note }, db);
    });
    return this.adminGet(id);
  },

  async adminUpdateShipping(request: FastifyRequest, id: number, input: { courierName?: string; trackingNumber?: string; trackingUrl?: string }) {
    const result = await execute(
      "UPDATE ecom_orders SET courier_name = COALESCE(?, courier_name), tracking_number = COALESCE(?, tracking_number), tracking_url = COALESCE(?, tracking_url) WHERE id = ?",
      [input.courierName ?? null, input.trackingNumber ?? null, input.trackingUrl ?? null, id],
    );
    if (!result.affectedRows) throw new NotFoundError("Order");
    await audit(request, "order.shipping", "order", id, input);
    return this.adminGet(id);
  },

  async adminAssign(request: FastifyRequest, id: number, adminId: number | null) {
    if (adminId && !(await queryOne("SELECT 1 FROM admins WHERE id = ? AND is_active = TRUE", [adminId]))) throw new BusinessRuleError("That staff member does not exist.");
    const result = await execute("UPDATE ecom_orders SET assigned_admin_id = ? WHERE id = ?", [adminId, id]);
    if (!result.affectedRows) throw new NotFoundError("Order");
    await audit(request, "order.assign", "order", id, { adminId });
    return this.adminGet(id);
  },

  async adminAddNote(request: FastifyRequest, id: number, note: string) {
    if (!(await findOrderById(id))) throw new NotFoundError("Order");
    await execute("INSERT INTO ecom_order_notes (order_id, admin_id, note) VALUES (?, ?, ?)", [id, request.ecomAdmin!.id, note]);
    return this.adminGet(id);
  },

  /**
   * Approve or reject a customer's cancellation/return request.
   * Approved cancellation → cancel (stock back, refund opened if paid). Approved return → Returned + restock + refund opened.
   * Rejected return → back to Delivered.
   */
  async adminDecideRequest(request: FastifyRequest, orderId: number, requestId: number, decision: "approved" | "rejected", remark: string) {
    const actor: Actor = { type: "admin", id: request.ecomAdmin!.id };
    await withTransaction(async (db) => {
      const order = await findOrderById(orderId, db, true);
      const item = await queryOne<{ id: number; request_type: "cancellation" | "return"; status: string }>(
        "SELECT id, request_type, status FROM ecom_order_requests WHERE id = ? AND order_id = ? FOR UPDATE",
        [requestId, orderId],
        db,
      );
      if (!order || !item) throw new NotFoundError("Request");
      if (item.status !== "pending") throw new BusinessRuleError("This request has already been decided.");
      await execute("UPDATE ecom_order_requests SET status = ?, admin_remark = ?, decided_by = ?, decided_at = UTC_TIMESTAMP() WHERE id = ?", [decision, remark, actor.id, item.id], db);

      if (item.request_type === "cancellation" && decision === "approved") {
        await cancelOrder(db, order, actor, `Cancellation approved: ${remark}`);
      } else if (item.request_type === "return") {
        if (decision === "approved") {
          await changeStatus(db, order, "returned", actor, `Return approved: ${remark}`);
          await inventoryService.restock(db, order.id, order.order_number, "Returned by customer", actor.id);
          await execute("UPDATE ecom_orders SET stock_state = 'restocked' WHERE id = ?", [order.id], db);
          if (["paid", "partially_refunded"].includes(order.payment_status)) await createRefund(db, order, `Return approved: ${remark}`, "admin", actor.id);
        } else {
          await changeStatus(db, order, "delivered", actor, `Return rejected: ${remark}`);
        }
      }
      await audit(request, `order.${item.request_type}.${decision}`, "order", order.order_number, { remark }, db);
    });
    return this.adminGet(orderId);
  },

  async staffList() {
    const rows = await query<{ id: number; name: string }>(
      "SELECT a.id, a.name FROM admins a LEFT JOIN ecom_admin_roles r ON r.admin_id = a.id WHERE a.is_active = TRUE AND (a.role = 'super_admin' OR r.role IS NOT NULL) ORDER BY a.name",
    );
    return rows.map((row) => ({ id: Number(row.id), name: row.name }));
  },

  async assertCustomerOwns(customerId: number, orderNumber: string) {
    const order = await findOrderByNumber(orderNumber);
    if (!order || Number(order.customer_id) !== customerId) throw new ForbiddenError();
    return order;
  },
};
