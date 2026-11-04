/**
 * Payment flow (online orders):
 *   1. initiate  — backend creates a gateway order for the server-computed total (never a client amount)
 *   2. customer pays in the gateway's checkout
 *   3. verify    — browser posts the gateway's signed response; we check the HMAC and re-fetch the payment
 *   4. webhook   — gateway posts payment.captured / payment.failed / refund.* (signature-checked, de-duplicated)
 * Steps 3 and 4 both end in markCaptured(), which is idempotent: it locks the payment and order rows and does
 * nothing if the payment was already recorded. Whichever arrives first confirms the order; the other is a no-op.
 *
 * PAYMENT_PROVIDER=mock (development only, refused in production) replaces the gateway with a simulated one.
 */
import { randomBytes } from "node:crypto";
import type { FastifyRequest } from "fastify";
import type { PoolConnection } from "mysql2/promise";
import { execute, query, queryOne, withTransaction } from "../../../db/pool.js";
import { BusinessRuleError, NotFoundError } from "../../../utils/errors.js";
import { inventoryService } from "../inventory/inventory.service.js";
import { audit } from "../shared/audit.js";
import { ecomConfig } from "../shared/config.js";
import { pageWindow, round2, type PageQuery } from "../shared/http.js";
import { changeStatus, createRefund, refundedSoFar } from "../orders/order-lifecycle.js";
import { findOrderById, type OrderRow } from "../orders/orders.repository.js";
import { authorizeOrderAccess } from "../orders/orders.service.js";
import { razorpay, toPaise, verifyCheckoutSignature, verifyWebhookSignature, PaymentGatewayError } from "./razorpay.js";

const provider = () => ecomConfig.payment.provider;

async function lockPayment(db: PoolConnection, providerOrderId: string) {
  return queryOne<{ id: number; order_id: number; status: string; amount: number; provider_payment_id: string | null }>(
    "SELECT id, order_id, status, amount, provider_payment_id FROM ecom_payments WHERE provider = ? AND provider_order_id = ? FOR UPDATE",
    [provider(), providerOrderId],
    db,
  );
}

/** Records a captured payment and confirms the order. Safe to call any number of times for the same payment. */
export async function markCaptured(providerOrderId: string, providerPaymentId: string, amountPaise: number, method: string | null) {
  const result = await withTransaction(async (db) => {
    const payment = await lockPayment(db, providerOrderId);
    if (!payment) throw new NotFoundError("Payment");
    const order = (await findOrderById(Number(payment.order_id), db, true))!;
    if (payment.status === "captured") return { orderNumber: order.order_number, alreadyProcessed: true };
    if (amountPaise !== toPaise(Number(payment.amount))) {
      // Never confirm an order for a different amount than we asked for. Recorded (committed) for staff follow-up.
      await execute("UPDATE ecom_payments SET status = 'failed', error_code = 'AMOUNT_MISMATCH', provider_payment_id = ? WHERE id = ?", [providerPaymentId, payment.id], db);
      return { orderNumber: order.order_number, alreadyProcessed: false, amountMismatch: true };
    }

    await execute("UPDATE ecom_payments SET status = 'captured', provider_payment_id = ?, method = ?, error_code = NULL, error_description = NULL WHERE id = ?", [providerPaymentId, method, payment.id], db);
    // Other attempts for the same order that never completed are closed.
    await execute("UPDATE ecom_payments SET status = 'failed', error_code = COALESCE(error_code, 'SUPERSEDED') WHERE order_id = ? AND id <> ? AND status = 'created'", [order.id, payment.id], db);

    const system = { type: "system" as const, id: null };
    if (order.status === "pending_payment" && order.stock_state === "reserved") {
      await inventoryService.commit(db, order.id, order.order_number);
      await execute("UPDATE ecom_orders SET payment_status = 'paid', stock_state = 'committed', reservation_expires_at = NULL WHERE id = ?", [order.id], db);
      await changeStatus(db, order, "confirmed", system, "Payment received");
    } else if (order.status === "cancelled" && order.stock_state === "released") {
      // Payment arrived after the stock hold expired. Fulfil it if stock is still there, otherwise refund it.
      const committed = await inventoryService.commitLate(db, order.id, order.order_number);
      if (committed) {
        await execute("UPDATE ecom_orders SET status = 'confirmed', payment_status = 'paid', stock_state = 'committed', confirmed_at = UTC_TIMESTAMP(), cancelled_at = NULL WHERE id = ?", [order.id], db);
        await execute(
          "INSERT INTO ecom_order_status_history (order_id, from_status, to_status, note, actor_type) VALUES (?, 'cancelled', 'confirmed', 'Late payment received; order reinstated', 'system')",
          [order.id],
          db,
        );
        // Restore the coupon use released at expiry.
        if (order.coupon_id && !(await queryOne("SELECT 1 FROM ecom_coupon_usages WHERE order_id = ?", [order.id], db))) {
          await execute("INSERT INTO ecom_coupon_usages (coupon_id, order_id, customer_id, email, discount) VALUES (?, ?, ?, ?, ?)", [order.coupon_id, order.id, order.customer_id, order.contact_email, order.discount_total], db);
          await execute("UPDATE ecom_coupons SET used_count = used_count + 1 WHERE id = ?", [order.coupon_id], db);
        }
      } else {
        await execute("UPDATE ecom_orders SET payment_status = 'paid' WHERE id = ?", [order.id], db);
        order.payment_status = "paid";
        await createRefund(db, order, "Payment received after the order expired and stock was no longer available", "system", null);
      }
    } else if (order.status === "cancelled") {
      // Cancelled by staff/customer while the payment was in flight: keep the money traceable and refund it.
      await execute("UPDATE ecom_orders SET payment_status = 'paid' WHERE id = ?", [order.id], db);
      order.payment_status = "paid";
      await createRefund(db, order, "Payment received for a cancelled order", "system", null);
    } else {
      // A second attempt was captured for an order that another payment already confirmed: refund the duplicate.
      await createRefund(db, order, `Duplicate payment ${providerPaymentId}`, "system", null, Number(payment.amount));
    }
    return { orderNumber: order.order_number, alreadyProcessed: false };
  });
  if ("amountMismatch" in result) throw new BusinessRuleError("The payment amount does not match the order total. Please contact support.");
  return result;
}

export async function markFailed(providerOrderId: string, providerPaymentId: string | null, code: string | null, description: string | null) {
  await withTransaction(async (db) => {
    const payment = await lockPayment(db, providerOrderId);
    if (!payment || payment.status === "captured") return;
    await execute(
      "UPDATE ecom_payments SET status = 'failed', provider_payment_id = COALESCE(?, provider_payment_id), error_code = ?, error_description = ? WHERE id = ?",
      [providerPaymentId, code?.slice(0, 100) ?? null, description?.slice(0, 500) ?? null, payment.id],
      db,
    );
    // The order stays Pending Payment (stock still held) so the customer can retry until the hold expires.
    await execute("UPDATE ecom_orders SET payment_status = 'failed' WHERE id = ? AND status = 'pending_payment'", [payment.order_id], db);
  });
}

export const paymentService = {
  /** Starts (or resumes) payment for an order. Amount always comes from the order row. */
  async initiate(request: FastifyRequest, orderNumber: string, token?: string) {
    const order = await authorizeOrderAccess(request, orderNumber, token);
    if (order.payment_method !== "online") throw new BusinessRuleError("This order is not paid online.");
    if (order.status !== "pending_payment") throw new BusinessRuleError(order.status === "cancelled" ? "This order was cancelled because payment was not completed in time." : "This order is already paid.");

    const amount = Number(order.grand_total);
    const reuse = await queryOne<{ provider_order_id: string }>(
      "SELECT provider_order_id FROM ecom_payments WHERE order_id = ? AND provider = ? AND status = 'created' AND amount = ? ORDER BY id DESC LIMIT 1",
      [order.id, provider(), amount],
    );
    let providerOrderId = reuse?.provider_order_id;
    if (!providerOrderId) {
      providerOrderId =
        provider() === "mock"
          ? `mock_order_${randomBytes(8).toString("hex")}`
          : (await razorpay.createOrder(toPaise(amount), order.order_number, { orderNumber: order.order_number })).id;
      await execute("INSERT INTO ecom_payments (order_id, provider, provider_order_id, amount) VALUES (?, ?, ?, ?)", [order.id, provider(), providerOrderId, amount]);
    }
    return {
      provider: provider(),
      keyId: provider() === "razorpay" ? ecomConfig.payment.razorpayKeyId : null,
      providerOrderId,
      amount: toPaise(amount),
      currency: "INR",
      orderNumber: order.order_number,
      prefill: { name: order.contact_name, email: order.contact_email, contact: order.contact_phone },
      expiresAt: order.reservation_expires_at,
    };
  },

  /** Browser callback after Razorpay checkout. The signature proves the response came from Razorpay for our order. */
  async verify(request: FastifyRequest, input: { orderNumber: string; token?: string; providerOrderId: string; providerPaymentId: string; signature: string }) {
    const order = await authorizeOrderAccess(request, input.orderNumber, input.token);
    const payment = await queryOne<{ order_id: number }>("SELECT order_id FROM ecom_payments WHERE provider = 'razorpay' AND provider_order_id = ?", [input.providerOrderId]);
    if (!payment || Number(payment.order_id) !== Number(order.id)) throw new BusinessRuleError("This payment does not belong to the order.");
    if (!verifyCheckoutSignature(input.providerOrderId, input.providerPaymentId, input.signature)) {
      request.log.warn({ orderNumber: order.order_number }, "Payment signature verification failed");
      throw new BusinessRuleError("We could not verify this payment. If money was deducted, it will be confirmed automatically or refunded.");
    }
    // Re-fetch from the gateway: confirms status and amount, and captures if the account uses manual capture.
    let gatewayPayment = await razorpay.fetchPayment(input.providerPaymentId);
    if (gatewayPayment.order_id !== input.providerOrderId) throw new BusinessRuleError("This payment does not belong to the order.");
    if (gatewayPayment.status === "authorized") gatewayPayment = await razorpay.capture(gatewayPayment.id, gatewayPayment.amount);
    if (gatewayPayment.status !== "captured") {
      if (gatewayPayment.status === "failed") await markFailed(input.providerOrderId, gatewayPayment.id, gatewayPayment.error_code ?? null, gatewayPayment.error_description ?? null);
      throw new BusinessRuleError("The payment has not been completed.");
    }
    return markCaptured(input.providerOrderId, gatewayPayment.id, gatewayPayment.amount, gatewayPayment.method ?? null);
  },

  /** The customer closed the gateway window or the gateway reported a failure in the browser. */
  async reportFailure(request: FastifyRequest, input: { orderNumber: string; token?: string; providerOrderId: string; code?: string; description?: string }) {
    const order = await authorizeOrderAccess(request, input.orderNumber, input.token);
    const payment = await queryOne<{ order_id: number }>("SELECT order_id FROM ecom_payments WHERE provider_order_id = ?", [input.providerOrderId]);
    if (!payment || Number(payment.order_id) !== Number(order.id)) throw new NotFoundError("Payment");
    // Browser-reported failures are not trusted to cancel anything; they only mark the attempt so the UI can offer a retry.
    await markFailed(input.providerOrderId, null, input.code ?? "CLIENT_REPORTED", input.description ?? "Payment was not completed");
    return { orderNumber: order.order_number };
  },

  /** Development only: completes a mock payment as success or failure. */
  async completeMock(request: FastifyRequest, input: { orderNumber: string; token?: string; providerOrderId: string; outcome: "success" | "failure" }) {
    if (provider() !== "mock") throw new NotFoundError("Route");
    const order = await authorizeOrderAccess(request, input.orderNumber, input.token);
    const payment = await queryOne<{ order_id: number; amount: number }>("SELECT order_id, amount FROM ecom_payments WHERE provider = 'mock' AND provider_order_id = ?", [input.providerOrderId]);
    if (!payment || Number(payment.order_id) !== Number(order.id)) throw new NotFoundError("Payment");
    if (input.outcome === "failure") {
      await markFailed(input.providerOrderId, null, "MOCK_DECLINED", "Simulated payment failure");
      return { orderNumber: order.order_number, status: "failed" };
    }
    await markCaptured(input.providerOrderId, `mock_pay_${randomBytes(8).toString("hex")}`, toPaise(Number(payment.amount)), "mock");
    return { orderNumber: order.order_number, status: "captured" };
  },

  /**
   * Razorpay webhook. Requires the raw body for signature verification; each event id is processed once
   * (ecom_payment_events unique key), so gateway retries are harmless.
   */
  async handleWebhook(request: FastifyRequest, rawBody: string) {
    if (!verifyWebhookSignature(rawBody, request.headers["x-razorpay-signature"] as string | undefined)) {
      request.log.warn("Rejected webhook with invalid signature");
      throw new BusinessRuleError("Invalid signature.");
    }
    const event = JSON.parse(rawBody) as {
      event: string;
      payload?: {
        payment?: { entity: { id: string; order_id: string; amount: number; method?: string; error_code?: string; error_description?: string } };
        refund?: { entity: { id: string; status: string; payment_id: string } };
      };
    };
    const eventId = (request.headers["x-razorpay-event-id"] as string | undefined) ?? `${event.event}:${event.payload?.payment?.entity.id ?? event.payload?.refund?.entity.id}`;
    const inserted = await execute(
      "INSERT IGNORE INTO ecom_payment_events (provider, provider_event_id, event_type, payload) VALUES ('razorpay', ?, ?, ?)",
      [eventId.slice(0, 100), event.event.slice(0, 60), rawBody],
    );
    if (!inserted.affectedRows) {
      const previous = await queryOne<{ processed_at: Date | null }>("SELECT processed_at FROM ecom_payment_events WHERE provider = 'razorpay' AND provider_event_id = ?", [eventId.slice(0, 100)]);
      if (previous?.processed_at) return { duplicate: true };
      // Seen but not finished (earlier attempt failed): process again — the handlers are idempotent.
    }

    const payment = event.payload?.payment?.entity;
    const refund = event.payload?.refund?.entity;
    if ((event.event === "payment.captured" || event.event === "order.paid") && payment) {
      const known = await queryOne("SELECT 1 FROM ecom_payments WHERE provider = 'razorpay' AND provider_order_id = ?", [payment.order_id]);
      if (known) await markCaptured(payment.order_id, payment.id, payment.amount, payment.method ?? null);
    } else if (event.event === "payment.failed" && payment) {
      await markFailed(payment.order_id, payment.id, payment.error_code ?? null, payment.error_description ?? null);
    } else if ((event.event === "refund.processed" || event.event === "refund.failed") && refund) {
      await settleRefund(refund.id, event.event === "refund.processed" ? "processed" : "failed", null);
    }
    await execute("UPDATE ecom_payment_events SET processed_at = UTC_TIMESTAMP() WHERE provider = 'razorpay' AND provider_event_id = ?", [eventId.slice(0, 100)]);
    return { duplicate: false };
  },

  // ------------------------------------------------------------------ admin

  async adminListPayments(filters: { status?: string; q?: string; from?: string; to?: string } & PageQuery) {
    const where = ["TRUE"];
    const params: unknown[] = [];
    if (filters.status) {
      where.push("p.status = ?");
      params.push(filters.status);
    }
    if (filters.q) {
      where.push("(o.order_number LIKE ? OR p.provider_payment_id LIKE ? OR p.provider_order_id LIKE ? OR o.contact_email LIKE ?)");
      params.push(...Array(4).fill(`%${filters.q}%`));
    }
    if (filters.from) {
      where.push("p.created_at >= ?");
      params.push(`${filters.from} 00:00:00`);
    }
    if (filters.to) {
      where.push("p.created_at <= ?");
      params.push(`${filters.to} 23:59:59`);
    }
    const window = pageWindow(filters);
    const [rows, count, summary] = await Promise.all([
      query(
        `SELECT p.*, o.order_number, o.contact_name, o.contact_email, o.status AS order_status FROM ecom_payments p JOIN ecom_orders o ON o.id = p.order_id
          WHERE ${where.join(" AND ")} ORDER BY p.id DESC LIMIT ? OFFSET ?`,
        [...params, window.limit, window.offset],
      ),
      queryOne<{ total: number }>(`SELECT COUNT(*) AS total FROM ecom_payments p JOIN ecom_orders o ON o.id = p.order_id WHERE ${where.join(" AND ")}`, params),
      queryOne<{ captured: number; captured_amount: number; failed: number; created: number }>(
        `SELECT SUM(p.status = 'captured') AS captured, COALESCE(SUM(CASE WHEN p.status = 'captured' THEN p.amount END), 0) AS captured_amount,
                SUM(p.status = 'failed') AS failed, SUM(p.status = 'created') AS created
           FROM ecom_payments p JOIN ecom_orders o ON o.id = p.order_id WHERE ${where.join(" AND ")}`,
        params,
      ),
    ]);
    return {
      items: rows.map((row) => ({
        id: Number(row.id),
        orderId: Number(row.order_id),
        orderNumber: row.order_number,
        customerName: row.contact_name,
        customerEmail: row.contact_email,
        orderStatus: row.order_status,
        provider: row.provider,
        providerOrderId: row.provider_order_id,
        providerPaymentId: row.provider_payment_id,
        amount: Number(row.amount),
        status: row.status,
        method: row.method,
        errorCode: row.error_code,
        errorDescription: row.error_description,
        createdAt: row.created_at,
      })),
      summary: { captured: Number(summary?.captured ?? 0), capturedAmount: Number(summary?.captured_amount ?? 0), failed: Number(summary?.failed ?? 0), awaiting: Number(summary?.created ?? 0) },
      meta: window.meta(Number(count?.total ?? 0)),
    };
  },

  async adminListRefunds(filters: { status?: string } & PageQuery) {
    const where = filters.status ? "WHERE r.status = ?" : "";
    const params = filters.status ? [filters.status] : [];
    const window = pageWindow(filters);
    const [rows, count] = await Promise.all([
      query(
        `SELECT r.*, o.order_number, o.contact_name, o.payment_method, a.name AS approved_by_name
           FROM ecom_refunds r JOIN ecom_orders o ON o.id = r.order_id LEFT JOIN admins a ON a.id = r.approved_by
           ${where} ORDER BY r.id DESC LIMIT ? OFFSET ?`,
        [...params, window.limit, window.offset],
      ),
      queryOne<{ total: number }>(`SELECT COUNT(*) AS total FROM ecom_refunds r ${where}`, params),
    ]);
    return {
      items: rows.map((row) => ({
        id: Number(row.id),
        refundNumber: row.refund_number,
        orderId: Number(row.order_id),
        orderNumber: row.order_number,
        customerName: row.contact_name,
        paymentMethod: row.payment_method,
        amount: Number(row.amount),
        reason: row.reason,
        status: row.status,
        providerRefundId: row.provider_refund_id,
        failureReason: row.failure_reason,
        requestedBy: row.requested_by,
        approvedBy: row.approved_by_name,
        processedAt: row.processed_at,
        createdAt: row.created_at,
      })),
      meta: window.meta(Number(count?.total ?? 0)),
    };
  },

  /** Staff-initiated refund for an order (partial or full). Opens a pending refund; processing is a separate step. */
  async adminCreateRefund(request: FastifyRequest, orderId: number, amount: number, reason: string) {
    const number = await withTransaction(async (db) => {
      const order = await findOrderById(orderId, db, true);
      if (!order) throw new NotFoundError("Order");
      if (!["paid", "partially_refunded", "refund_pending"].includes(order.payment_status)) throw new BusinessRuleError("Only paid orders can be refunded.");
      const refundNumber = await createRefund(db, order, reason, "admin", request.ecomAdmin!.id, amount);
      await audit(request, "refund.create", "order", order.order_number, { refundNumber, amount, reason }, db);
      return refundNumber;
    });
    return { refundNumber: number };
  },

  /**
   * Sends a pending refund to the gateway (online payments) or records it as paid out offline (COD / bank transfer).
   * Requires refunds.manage. Status flips to processed when the gateway confirms (immediately or via webhook).
   */
  async adminProcessRefund(request: FastifyRequest, refundId: number, input: { offlineReference?: string }) {
    const refund = await withTransaction(async (db) => {
      const row = await queryOne<{ id: number; refund_number: string; order_id: number; payment_id: number | null; amount: number; status: string }>(
        "SELECT id, refund_number, order_id, payment_id, amount, status FROM ecom_refunds WHERE id = ? FOR UPDATE",
        [refundId],
        db,
      );
      if (!row) throw new NotFoundError("Refund");
      if (row.status !== "pending" && row.status !== "failed") throw new BusinessRuleError("This refund is already being processed.");
      await execute("UPDATE ecom_refunds SET status = 'processing', approved_by = ?, failure_reason = NULL WHERE id = ?", [request.ecomAdmin!.id, row.id], db);
      return row;
    });

    const payment = refund.payment_id
      ? await queryOne<{ provider: string; provider_payment_id: string }>("SELECT provider, provider_payment_id FROM ecom_payments WHERE id = ?", [refund.payment_id])
      : undefined;

    try {
      if (!payment) {
        if (!input.offlineReference) throw new BusinessRuleError("This order has no online payment. Enter the reference of the offline refund (bank transfer/UPI).");
        await settleRefund(null, "processed", refund.id, `offline:${input.offlineReference}`);
      } else if (payment.provider === "mock") {
        await settleRefund(null, "processed", refund.id, `mock_rfnd_${randomBytes(6).toString("hex")}`);
      } else {
        const result = await razorpay.refund(payment.provider_payment_id, toPaise(Number(refund.amount)), refund.refund_number);
        await execute("UPDATE ecom_refunds SET provider_refund_id = ? WHERE id = ?", [result.id, refund.id]);
        if (result.status === "processed") await settleRefund(result.id, "processed", null);
        if (result.status === "failed") await settleRefund(result.id, "failed", null);
      }
    } catch (error) {
      const message = error instanceof PaymentGatewayError || error instanceof BusinessRuleError ? error.message : "Refund could not be sent to the gateway.";
      await execute("UPDATE ecom_refunds SET status = 'failed', failure_reason = ? WHERE id = ?", [message.slice(0, 500), refund.id]);
      await audit(request, "refund.failed", "refund", refund.refund_number, { message });
      throw error;
    }
    await audit(request, "refund.process", "refund", refund.refund_number, { amount: Number(refund.amount), offline: !payment });
    return (await this.adminListRefunds({ pageSize: 100 })).items.find((item) => item.id === refund.id);
  },

  async adminRejectRefund(request: FastifyRequest, refundId: number, reason: string) {
    await withTransaction(async (db) => {
      const row = await queryOne<{ order_id: number; status: string; refund_number: string }>("SELECT order_id, status, refund_number FROM ecom_refunds WHERE id = ? FOR UPDATE", [refundId], db);
      if (!row) throw new NotFoundError("Refund");
      if (row.status !== "pending") throw new BusinessRuleError("Only pending refunds can be rejected.");
      await execute("UPDATE ecom_refunds SET status = 'rejected', failure_reason = ?, approved_by = ? WHERE id = ?", [reason, request.ecomAdmin!.id, refundId], db);
      await syncOrderRefundState(db, Number(row.order_id));
      await audit(request, "refund.reject", "refund", row.refund_number, { reason }, db);
    });
  },
};

/** Applies a refund outcome (from the API response, the webhook, or an offline payout) and updates the order. */
async function settleRefund(providerRefundId: string | null, status: "processed" | "failed", refundId: number | null, reference?: string) {
  await withTransaction(async (db) => {
    const row = refundId
      ? await queryOne<{ id: number; order_id: number; status: string }>("SELECT id, order_id, status FROM ecom_refunds WHERE id = ? FOR UPDATE", [refundId], db)
      : await queryOne<{ id: number; order_id: number; status: string }>("SELECT id, order_id, status FROM ecom_refunds WHERE provider_refund_id = ? FOR UPDATE", [providerRefundId], db);
    if (!row || row.status === "processed") return;
    await execute(
      `UPDATE ecom_refunds SET status = ?, provider_refund_id = COALESCE(?, provider_refund_id), processed_at = ${status === "processed" ? "UTC_TIMESTAMP()" : "NULL"},
              failure_reason = ${status === "failed" ? "'Rejected by the payment gateway'" : "NULL"} WHERE id = ?`,
      [status, reference ?? providerRefundId, row.id],
      db,
    );
    await syncOrderRefundState(db, Number(row.order_id));
  });
}

/** Recomputes the order's payment status from its refunds and moves cancelled/returned orders to Refunded when fully refunded. */
async function syncOrderRefundState(db: PoolConnection, orderId: number) {
  const order = (await findOrderById(orderId, db, true)) as OrderRow;
  const processed = await queryOne<{ total: number | null }>("SELECT SUM(amount) AS total FROM ecom_refunds WHERE order_id = ? AND status = 'processed'", [orderId], db);
  const refunded = round2(Number(processed?.total ?? 0));
  const open = (await refundedSoFar(db, orderId)) - refunded > 0;
  const full = refunded >= Number(order.grand_total);
  const paymentStatus = full ? "refunded" : open ? "refund_pending" : refunded > 0 ? "partially_refunded" : "paid";
  await execute("UPDATE ecom_orders SET payment_status = ? WHERE id = ?", [paymentStatus, orderId], db);
  if (full && (order.status === "cancelled" || order.status === "returned")) {
    await changeStatus(db, order, "refunded", { type: "system", id: null }, "Refund completed");
  }
}
