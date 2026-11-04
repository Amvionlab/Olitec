/**
 * Stock model (per product):
 *   stock_qty     physical units on hand
 *   reserved_qty  units held by unpaid online checkouts
 *   available     stock_qty − reserved_qty  (what customers can buy)
 *
 * Lifecycle of an online order:  reserve (checkout) → commit (payment captured) | release (failed / expired / cancelled)
 * COD orders deduct directly. Every change locks the product rows (SELECT … FOR UPDATE, in id order to avoid deadlocks)
 * inside the caller's transaction and appends a row to ecom_inventory_movements.
 */
import type { FastifyRequest } from "fastify";
import type { PoolConnection } from "mysql2/promise";
import { execute, query, queryOne, withTransaction } from "../../../db/pool.js";
import { BusinessRuleError, NotFoundError } from "../../../utils/errors.js";
import { audit } from "../shared/audit.js";
import { pageWindow, type PageQuery } from "../shared/http.js";

type MovementType = "stock_in" | "stock_out" | "adjustment" | "reservation" | "release" | "sale" | "return";

interface LockedProduct {
  id: number;
  name: string;
  sku: string;
  stock_qty: number;
  reserved_qty: number;
  status: string;
}

export interface StockLine {
  productId: number;
  quantity: number;
}

export class InsufficientStockError extends BusinessRuleError {
  constructor(public readonly items: { productId: number; name: string; available: number; requested: number }[]) {
    super(
      items.length === 1
        ? `Only ${Math.max(0, items[0].available)} unit(s) of ${items[0].name} are available.`
        : "Some items in your cart are no longer available in the requested quantity.",
    );
  }
}

async function lockProducts(db: PoolConnection, productIds: number[]): Promise<Map<number, LockedProduct>> {
  const ids = [...new Set(productIds)].sort((a, b) => a - b);
  if (!ids.length) return new Map();
  const rows = await query<LockedProduct>(
    `SELECT id, name, sku, stock_qty, reserved_qty, status FROM ecom_products WHERE id IN (${ids.map(() => "?").join(",")}) ORDER BY id FOR UPDATE`,
    ids,
    db,
  );
  return new Map(rows.map((row) => [Number(row.id), row]));
}

function mergeLines(lines: StockLine[]): StockLine[] {
  const totals = new Map<number, number>();
  for (const line of lines) totals.set(line.productId, (totals.get(line.productId) ?? 0) + line.quantity);
  return [...totals.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

async function record(
  db: PoolConnection,
  productId: number,
  type: MovementType,
  quantity: number,
  stockAfter: number,
  reservedAfter: number,
  reference: { type: string; id: string | null },
  note: string | null = null,
  adminId: number | null = null,
) {
  await execute(
    `INSERT INTO ecom_inventory_movements (product_id, movement_type, quantity, stock_after, reserved_after, reference_type, reference_id, note, admin_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [productId, type, quantity, stockAfter, reservedAfter, reference.type, reference.id, note, adminId],
    db,
  );
}

async function orderLines(db: PoolConnection, orderId: number): Promise<StockLine[]> {
  const rows = await query<{ product_id: number | null; quantity: number }>("SELECT product_id, quantity FROM ecom_order_items WHERE order_id = ?", [orderId], db);
  return mergeLines(rows.filter((row) => row.product_id !== null).map((row) => ({ productId: Number(row.product_id), quantity: row.quantity })));
}

export const inventoryService = {
  /** Checks availability and holds stock for an unpaid order. Throws InsufficientStockError listing every short item. */
  async reserve(db: PoolConnection, lines: StockLine[], orderNumber: string) {
    const merged = mergeLines(lines);
    const products = await lockProducts(db, merged.map((line) => line.productId));
    const short = merged.flatMap((line) => {
      const product = products.get(line.productId);
      const available = product && product.status === "active" ? product.stock_qty - product.reserved_qty : 0;
      return available < line.quantity ? [{ productId: line.productId, name: product?.name ?? "This product", available, requested: line.quantity }] : [];
    });
    if (short.length) throw new InsufficientStockError(short);

    for (const line of merged) {
      const product = products.get(line.productId)!;
      const reserved = product.reserved_qty + line.quantity;
      await execute("UPDATE ecom_products SET reserved_qty = ? WHERE id = ?", [reserved, line.productId], db);
      await record(db, line.productId, "reservation", 0, product.stock_qty, reserved, { type: "order", id: orderNumber }, `Reserved ${line.quantity}`);
    }
  },

  /** Deducts stock immediately (COD orders). */
  async deduct(db: PoolConnection, lines: StockLine[], orderNumber: string) {
    const merged = mergeLines(lines);
    const products = await lockProducts(db, merged.map((line) => line.productId));
    const short = merged.flatMap((line) => {
      const product = products.get(line.productId);
      const available = product && product.status === "active" ? product.stock_qty - product.reserved_qty : 0;
      return available < line.quantity ? [{ productId: line.productId, name: product?.name ?? "This product", available, requested: line.quantity }] : [];
    });
    if (short.length) throw new InsufficientStockError(short);
    for (const line of merged) {
      const product = products.get(line.productId)!;
      const stock = product.stock_qty - line.quantity;
      await execute("UPDATE ecom_products SET stock_qty = ?, sold_count = sold_count + ? WHERE id = ?", [stock, line.quantity, line.productId], db);
      await record(db, line.productId, "sale", -line.quantity, stock, product.reserved_qty, { type: "order", id: orderNumber });
    }
  },

  /** Converts an order's reservation into a sale (payment captured). */
  async commit(db: PoolConnection, orderId: number, orderNumber: string) {
    const lines = await orderLines(db, orderId);
    const products = await lockProducts(db, lines.map((line) => line.productId));
    for (const line of lines) {
      const product = products.get(line.productId);
      if (!product) continue;
      const stock = product.stock_qty - line.quantity;
      const reserved = Math.max(0, product.reserved_qty - line.quantity);
      await execute("UPDATE ecom_products SET stock_qty = ?, reserved_qty = ?, sold_count = sold_count + ? WHERE id = ?", [stock, reserved, line.quantity, line.productId], db);
      await record(db, line.productId, "sale", -line.quantity, stock, reserved, { type: "order", id: orderNumber });
    }
  },

  /**
   * Re-reserves and commits stock for an order whose reservation had already been released (payment arrived late).
   * Returns false, changing nothing, when the stock is no longer available.
   */
  async commitLate(db: PoolConnection, orderId: number, orderNumber: string): Promise<boolean> {
    const lines = await orderLines(db, orderId);
    const products = await lockProducts(db, lines.map((line) => line.productId));
    const enough = lines.every((line) => {
      const product = products.get(line.productId);
      return product && product.stock_qty - product.reserved_qty >= line.quantity;
    });
    if (!enough) return false;
    for (const line of lines) {
      const product = products.get(line.productId)!;
      const stock = product.stock_qty - line.quantity;
      await execute("UPDATE ecom_products SET stock_qty = ?, sold_count = sold_count + ? WHERE id = ?", [stock, line.quantity, line.productId], db);
      await record(db, line.productId, "sale", -line.quantity, stock, product.reserved_qty, { type: "order", id: orderNumber }, "Late payment");
    }
    return true;
  },

  /** Releases an unpaid order's reservation. */
  async release(db: PoolConnection, orderId: number, orderNumber: string, note: string) {
    const lines = await orderLines(db, orderId);
    const products = await lockProducts(db, lines.map((line) => line.productId));
    for (const line of lines) {
      const product = products.get(line.productId);
      if (!product) continue;
      const reserved = Math.max(0, product.reserved_qty - line.quantity);
      await execute("UPDATE ecom_products SET reserved_qty = ? WHERE id = ?", [reserved, line.productId], db);
      await record(db, line.productId, "release", 0, product.stock_qty, reserved, { type: "order", id: orderNumber }, note);
    }
  },

  /** Puts sold units back on hand (cancelled after payment, or returned). */
  async restock(db: PoolConnection, orderId: number, orderNumber: string, note: string, adminId: number | null) {
    const lines = await orderLines(db, orderId);
    const products = await lockProducts(db, lines.map((line) => line.productId));
    for (const line of lines) {
      const product = products.get(line.productId);
      if (!product) continue;
      const stock = product.stock_qty + line.quantity;
      await execute("UPDATE ecom_products SET stock_qty = ?, sold_count = GREATEST(0, CAST(sold_count AS SIGNED) - ?) WHERE id = ?", [stock, line.quantity, line.productId], db);
      await record(db, line.productId, "return", line.quantity, stock, product.reserved_qty, { type: "order", id: orderNumber }, note, adminId);
    }
  },

  // ------------------------------------------------------------------ admin

  /**
   * Manual stock change. stock_in / stock_out move by `quantity`; adjustment sets the on-hand count to `quantity`
   * (physical count). On-hand can never drop below what unpaid checkouts are holding.
   */
  async adjust(request: FastifyRequest, productId: number, input: { type: "stock_in" | "stock_out" | "adjustment"; quantity: number; note?: string; lowStockThreshold?: number }) {
    const adminId = request.ecomAdmin?.id ?? null;
    return withTransaction(async (db) => {
      const product = (await lockProducts(db, [productId])).get(productId);
      if (!product) throw new NotFoundError("Product");
      const stock =
        input.type === "stock_in" ? product.stock_qty + input.quantity : input.type === "stock_out" ? product.stock_qty - input.quantity : input.quantity;
      if (stock < product.reserved_qty) {
        throw new BusinessRuleError(`Stock cannot go below ${product.reserved_qty}: that many units are held by checkouts awaiting payment.`);
      }
      if (input.type !== "adjustment" && input.quantity <= 0) throw new BusinessRuleError("Quantity must be greater than zero.");
      await execute(
        "UPDATE ecom_products SET stock_qty = ?, low_stock_threshold = COALESCE(?, low_stock_threshold) WHERE id = ?",
        [stock, input.lowStockThreshold ?? null, productId],
        db,
      );
      await record(db, productId, input.type, stock - product.stock_qty, stock, product.reserved_qty, { type: "manual", id: null }, input.note ?? null, adminId);
      await audit(request, `inventory.${input.type}`, "product", productId, { from: product.stock_qty, to: stock, note: input.note }, db);
      return { productId, stockQty: stock, reservedQty: product.reserved_qty, available: stock - product.reserved_qty };
    });
  },

  async list(filters: { q?: string; stock?: "low" | "out" | "in"; categoryId?: number } & PageQuery) {
    const where = ["p.status <> 'archived'"];
    const params: unknown[] = [];
    if (filters.q) {
      where.push("(p.name LIKE ? OR p.sku LIKE ?)");
      params.push(`%${filters.q}%`, `%${filters.q}%`);
    }
    if (filters.categoryId) {
      where.push("p.category_id = ?");
      params.push(filters.categoryId);
    }
    if (filters.stock === "out") where.push("p.stock_qty - p.reserved_qty <= 0");
    if (filters.stock === "low") where.push("p.stock_qty - p.reserved_qty > 0 AND p.stock_qty - p.reserved_qty <= p.low_stock_threshold");
    if (filters.stock === "in") where.push("p.stock_qty - p.reserved_qty > p.low_stock_threshold");
    const window = pageWindow(filters);
    const [rows, count, summary] = await Promise.all([
      query(
        `SELECT p.id, p.sku, p.name, p.status, p.stock_qty, p.reserved_qty, (p.stock_qty - p.reserved_qty) AS available, p.low_stock_threshold, c.name AS category_name,
                (SELECT MAX(created_at) FROM ecom_inventory_movements m WHERE m.product_id = p.id) AS last_movement_at
           FROM ecom_products p JOIN ecom_categories c ON c.id = p.category_id
          WHERE ${where.join(" AND ")} ORDER BY available ASC, p.name LIMIT ? OFFSET ?`,
        [...params, window.limit, window.offset],
      ),
      queryOne<{ total: number }>(`SELECT COUNT(*) AS total FROM ecom_products p WHERE ${where.join(" AND ")}`, params),
      queryOne<{ low: number; out_count: number; units: number; reserved: number }>(
        `SELECT SUM(stock_qty - reserved_qty > 0 AND stock_qty - reserved_qty <= low_stock_threshold) AS low,
                SUM(stock_qty - reserved_qty <= 0) AS out_count, SUM(stock_qty) AS units, SUM(reserved_qty) AS reserved
           FROM ecom_products WHERE status = 'active'`,
      ),
    ]);
    return {
      items: rows.map((row) => ({
        id: Number(row.id),
        sku: row.sku,
        name: row.name,
        status: row.status,
        category: row.category_name,
        stockQty: row.stock_qty,
        reservedQty: row.reserved_qty,
        available: Number(row.available),
        lowStockThreshold: row.low_stock_threshold,
        lastMovementAt: row.last_movement_at,
      })),
      summary: {
        lowStock: Number(summary?.low ?? 0),
        outOfStock: Number(summary?.out_count ?? 0),
        unitsOnHand: Number(summary?.units ?? 0),
        unitsReserved: Number(summary?.reserved ?? 0),
      },
      meta: window.meta(Number(count?.total ?? 0)),
    };
  },

  async movements(filters: { productId?: number; type?: MovementType; from?: string; to?: string } & PageQuery) {
    const where = ["TRUE"];
    const params: unknown[] = [];
    if (filters.productId) {
      where.push("m.product_id = ?");
      params.push(filters.productId);
    }
    if (filters.type) {
      where.push("m.movement_type = ?");
      params.push(filters.type);
    }
    if (filters.from) {
      where.push("m.created_at >= ?");
      params.push(`${filters.from} 00:00:00`);
    }
    if (filters.to) {
      where.push("m.created_at <= ?");
      params.push(`${filters.to} 23:59:59`);
    }
    const window = pageWindow(filters);
    const [rows, count] = await Promise.all([
      query(
        `SELECT m.*, p.name AS product_name, p.sku, a.name AS admin_name
           FROM ecom_inventory_movements m JOIN ecom_products p ON p.id = m.product_id LEFT JOIN admins a ON a.id = m.admin_id
          WHERE ${where.join(" AND ")} ORDER BY m.id DESC LIMIT ? OFFSET ?`,
        [...params, window.limit, window.offset],
      ),
      queryOne<{ total: number }>(`SELECT COUNT(*) AS total FROM ecom_inventory_movements m WHERE ${where.join(" AND ")}`, params),
    ]);
    return {
      items: rows.map((row) => ({
        id: Number(row.id),
        productId: Number(row.product_id),
        productName: row.product_name,
        sku: row.sku,
        type: row.movement_type,
        quantity: row.quantity,
        stockAfter: row.stock_after,
        reservedAfter: row.reserved_after,
        reference: row.reference_id ? `${row.reference_type}:${row.reference_id}` : row.reference_type,
        note: row.note,
        adminName: row.admin_name,
        createdAt: row.created_at,
      })),
      meta: window.meta(Number(count?.total ?? 0)),
    };
  },

  /**
   * Reconciliation: compares each product's reserved_qty with the quantities held by open (reserved) orders.
   * With `apply`, mismatches are corrected and logged as adjustments.
   */
  async reconcile(request: FastifyRequest, apply: boolean) {
    const rows = await query<{ id: number; sku: string; name: string; reserved_qty: number; held: number; stock_qty: number }>(
      `SELECT p.id, p.sku, p.name, p.reserved_qty, p.stock_qty,
              COALESCE((SELECT SUM(i.quantity) FROM ecom_order_items i JOIN ecom_orders o ON o.id = i.order_id
                         WHERE i.product_id = p.id AND o.stock_state = 'reserved'), 0) AS held
         FROM ecom_products p`,
    );
    const mismatches = rows
      .filter((row) => Number(row.held) !== row.reserved_qty)
      .map((row) => ({ productId: Number(row.id), sku: row.sku, name: row.name, recordedReserved: row.reserved_qty, actualHeld: Number(row.held) }));
    if (apply && mismatches.length) {
      await withTransaction(async (db) => {
        for (const item of mismatches) {
          const product = (await lockProducts(db, [item.productId])).get(item.productId)!;
          const reserved = Math.min(item.actualHeld, product.stock_qty);
          await execute("UPDATE ecom_products SET reserved_qty = ? WHERE id = ?", [reserved, item.productId], db);
          await record(db, item.productId, "adjustment", 0, product.stock_qty, reserved, { type: "reconciliation", id: null }, `Reserved ${product.reserved_qty} → ${reserved}`, request.ecomAdmin?.id ?? null);
        }
        await audit(request, "inventory.reconcile", "inventory", null, { corrected: mismatches.length }, db);
      });
    }
    return { checked: rows.length, mismatches, applied: apply && mismatches.length > 0 };
  },
};
