/**
 * State changes on orders that also touch stock, coupons or refunds. All functions take the caller's transaction
 * connection and expect the order row to have been locked with FOR UPDATE.
 */
import type { PoolConnection } from "mysql2/promise";
import { execute, query, queryOne, withTransaction } from "../../../db/pool.js";
import { BusinessRuleError } from "../../../utils/errors.js";
import { inventoryService } from "../inventory/inventory.service.js";
import { round2 } from "../shared/http.js";
import { nextNumber } from "../shared/sequences.js";
import { canTransition, STATUS_LABELS, STATUS_TIMESTAMP, type OrderStatus } from "./order-status.js";
import { findOrderById, type OrderRow } from "./orders.repository.js";

export interface Actor {
  type: "customer" | "admin" | "system";
  id: number | null;
}

export async function changeStatus(db: PoolConnection, order: OrderRow, to: OrderStatus, actor: Actor, note: string | null = null) {
  if (!canTransition(order.status, to)) {
    throw new BusinessRuleError(`An order cannot move from ${STATUS_LABELS[order.status]} to ${STATUS_LABELS[to]}.`);
  }
  const stamp = STATUS_TIMESTAMP[to];
  await execute(`UPDATE ecom_orders SET status = ?${stamp ? `, ${stamp} = UTC_TIMESTAMP()` : ""} WHERE id = ?`, [to, order.id], db);
  await execute(
    "INSERT INTO ecom_order_status_history (order_id, from_status, to_status, note, actor_type, actor_id) VALUES (?, ?, ?, ?, ?, ?)",
    [order.id, order.status, to, note, actor.type, actor.id],
    db,
  );
  order.status = to;
}

/** Gives a coupon use back when an order is cancelled before it was ever paid. */
export async function releaseCouponUsage(db: PoolConnection, order: OrderRow) {
  if (!order.coupon_id) return;
  const result = await execute("DELETE FROM ecom_coupon_usages WHERE order_id = ?", [order.id], db);
  if (result.affectedRows) await execute("UPDATE ecom_coupons SET used_count = GREATEST(0, CAST(used_count AS SIGNED) - 1) WHERE id = ?", [order.coupon_id], db);
}

export async function refundedSoFar(db: PoolConnection, orderId: number): Promise<number> {
  const row = await queryOne<{ total: number | null }>(
    "SELECT SUM(amount) AS total FROM ecom_refunds WHERE order_id = ? AND status IN ('pending', 'processing', 'processed')",
    [orderId],
    db,
  );
  return Number(row?.total ?? 0);
}

/** Creates a pending refund for the unrefunded balance (or `amount`). Processing it at the gateway is a separate, authorised step. */
export async function createRefund(db: PoolConnection, order: OrderRow, reason: string, requestedBy: Actor["type"], adminId: number | null, amount?: number) {
  const balance = round2(Number(order.grand_total) - (await refundedSoFar(db, order.id)));
  const value = round2(amount ?? balance);
  if (value <= 0 || value > balance) throw new BusinessRuleError(`Refund amount must be between ₹1 and ₹${balance.toLocaleString("en-IN")}.`);
  const payment = await queryOne<{ id: number }>("SELECT id FROM ecom_payments WHERE order_id = ? AND status = 'captured' ORDER BY id DESC LIMIT 1", [order.id], db);
  const refundNumber = await nextNumber("refund", db);
  await execute(
    "INSERT INTO ecom_refunds (refund_number, order_id, payment_id, amount, reason, status, requested_by, approved_by) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)",
    [refundNumber, order.id, payment?.id ?? null, value, reason, requestedBy, adminId],
    db,
  );
  await execute("UPDATE ecom_orders SET payment_status = 'refund_pending' WHERE id = ? AND payment_status IN ('paid', 'partially_refunded')", [order.id], db);
  return refundNumber;
}

/**
 * Cancels an order: frees reserved stock or puts sold stock back, returns the coupon use if it was never paid,
 * and opens a refund for anything already paid.
 */
export async function cancelOrder(db: PoolConnection, order: OrderRow, actor: Actor, note: string) {
  const wasPaid = ["paid", "partially_refunded"].includes(order.payment_status);
  await changeStatus(db, order, "cancelled", actor, note);

  if (order.stock_state === "reserved") {
    await inventoryService.release(db, order.id, order.order_number, "Order cancelled");
    await execute("UPDATE ecom_orders SET stock_state = 'released' WHERE id = ?", [order.id], db);
  } else if (order.stock_state === "committed") {
    await inventoryService.restock(db, order.id, order.order_number, "Order cancelled", actor.type === "admin" ? actor.id : null);
    await execute("UPDATE ecom_orders SET stock_state = 'restocked' WHERE id = ?", [order.id], db);
  }

  if (wasPaid) {
    await createRefund(db, order, `Order cancelled: ${note}`, actor.type, actor.type === "admin" ? actor.id : null);
  } else {
    await releaseCouponUsage(db, order);
    // Unpaid online orders are closed as failed; COD orders keep cod_pending (reports exclude cancelled orders).
    if (order.payment_status === "pending") await execute("UPDATE ecom_orders SET payment_status = 'failed' WHERE id = ?", [order.id], db);
  }
}

/**
 * Cancels unpaid online orders whose stock hold has expired and releases the stock. Runs on a timer (see index.ts).
 * A payment that still arrives later is handled in payments.service (late capture).
 */
export async function releaseExpiredReservations(limit = 50): Promise<number> {
  const due = await query<{ id: number }>(
    `SELECT id FROM ecom_orders WHERE status = 'pending_payment' AND stock_state = 'reserved' AND reservation_expires_at < UTC_TIMESTAMP() ORDER BY id LIMIT ?`,
    [limit],
  );
  let released = 0;
  for (const { id } of due) {
    await withTransaction(async (db) => {
      const order = await findOrderById(Number(id), db, true);
      if (!order || order.status !== "pending_payment" || order.stock_state !== "reserved") return;
      // A captured payment that is still being processed must win over expiry.
      const captured = await queryOne("SELECT 1 FROM ecom_payments WHERE order_id = ? AND status = 'captured'", [order.id], db);
      if (captured) return;
      await cancelOrder(db, order, { type: "system", id: null }, "Payment was not completed in time");
      released += 1;
    });
  }
  return released;
}
