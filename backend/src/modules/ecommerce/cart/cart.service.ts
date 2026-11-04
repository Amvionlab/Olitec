/**
 * Carts. Signed-in customers have one cart (ecom_carts.customer_id); guests get a random token in an httpOnly
 * cookie (only its hash is stored). On sign-in the guest cart is merged into the customer's cart.
 * Prices and stock are always re-read from ecom_products — the cart stores only product ids and quantities.
 */
import type { FastifyReply, FastifyRequest } from "fastify";
import { execute, query, queryOne, withTransaction } from "../../../db/pool.js";
import { BusinessRuleError, NotFoundError } from "../../../utils/errors.js";
import { listPublicCoupons } from "../coupons/coupon-rules.js";
import { newToken, sha256 } from "../shared/auth.js";
import { COOKIE } from "../shared/config.js";
import { clearCookie, readCookie, setCookie } from "../shared/http.js";
import { priceLines } from "./pricing.js";

const GUEST_CART_DAYS = 30;

interface CartLineRow {
  item_id: number;
  product_id: number;
  quantity: number;
  slug: string;
  sku: string;
  name: string;
  status: string;
  category_id: number;
  category_active: number;
  mrp: number;
  selling_price: number;
  tax_rate: number;
  available: number;
  max_order_qty: number;
  low_stock_threshold: number;
  attributes: unknown;
  image: string | null;
}

export type CartIssue = "unavailable" | "out_of_stock" | "insufficient_stock" | "exceeds_limit";

async function findCartId(request: FastifyRequest): Promise<number | undefined> {
  if (request.ecomCustomer) {
    return (await queryOne<{ id: number }>("SELECT id FROM ecom_carts WHERE customer_id = ?", [request.ecomCustomer.id]))?.id;
  }
  const token = readCookie(request, COOKIE.cart);
  if (!token) return undefined;
  return (await queryOne<{ id: number }>("SELECT id FROM ecom_carts WHERE token_hash = ? AND customer_id IS NULL", [sha256(token)]))?.id;
}

async function ensureCartId(request: FastifyRequest, reply: FastifyReply): Promise<number> {
  const existing = await findCartId(request);
  if (existing) return Number(existing);
  if (request.ecomCustomer) {
    await execute("INSERT IGNORE INTO ecom_carts (customer_id) VALUES (?)", [request.ecomCustomer.id]);
    return Number((await queryOne<{ id: number }>("SELECT id FROM ecom_carts WHERE customer_id = ?", [request.ecomCustomer.id]))!.id);
  }
  const token = newToken();
  const result = await execute("INSERT INTO ecom_carts (token_hash) VALUES (?)", [sha256(token)]);
  setCookie(reply, COOKIE.cart, token, GUEST_CART_DAYS * 86400);
  return result.insertId;
}

export async function loadCartLines(cartId: number): Promise<CartLineRow[]> {
  return query<CartLineRow>(
    `SELECT ci.id AS item_id, ci.product_id, ci.quantity, p.slug, p.sku, p.name, p.status, p.category_id, c.is_active AS category_active,
            p.mrp, p.selling_price, p.tax_rate, (p.stock_qty - p.reserved_qty) AS available, p.max_order_qty, p.low_stock_threshold, p.attributes,
            (SELECT url FROM ecom_product_images i WHERE i.product_id = p.id ORDER BY i.sort_order, i.id LIMIT 1) AS image
       FROM ecom_cart_items ci JOIN ecom_products p ON p.id = ci.product_id JOIN ecom_categories c ON c.id = p.category_id
      WHERE ci.cart_id = ? ORDER BY ci.created_at, ci.id`,
    [cartId],
  );
}

export function lineIssue(row: CartLineRow): CartIssue | null {
  if (row.status !== "active" || !row.category_active) return "unavailable";
  const available = Number(row.available);
  if (available <= 0) return "out_of_stock";
  if (row.quantity > available) return "insufficient_stock";
  if (row.quantity > row.max_order_qty) return "exceeds_limit";
  return null;
}

const ISSUE_MESSAGES: Record<CartIssue, (row: CartLineRow) => string> = {
  unavailable: () => "This product is no longer available.",
  out_of_stock: () => "Out of stock.",
  insufficient_stock: (row) => `Only ${row.available} available.`,
  exceeds_limit: (row) => `Maximum ${row.max_order_qty} per order.`,
};

async function buildView(cartId: number | undefined, request: FastifyRequest) {
  if (!cartId) return emptyCart();
  const [cart, rows] = await Promise.all([queryOne<{ coupon_code: string | null }>("SELECT coupon_code FROM ecom_carts WHERE id = ?", [cartId]), loadCartLines(cartId)]);
  const items = rows.map((row) => {
    const issue = lineIssue(row);
    const unitPrice = Number(row.selling_price);
    return {
      id: Number(row.item_id),
      productId: Number(row.product_id),
      slug: row.slug,
      sku: row.sku,
      name: row.name,
      image: row.image,
      attributes: row.attributes,
      mrp: Number(row.mrp),
      unitPrice,
      quantity: row.quantity,
      lineTotal: Math.round(unitPrice * row.quantity * 100) / 100,
      maxPurchasable: Math.max(0, Math.min(Number(row.available), row.max_order_qty)),
      issue,
      issueMessage: issue ? ISSUE_MESSAGES[issue](row) : null,
    };
  });
  // Unavailable lines are shown but excluded from totals.
  const priced = rows
    .filter((row) => lineIssue(row) !== "unavailable" && lineIssue(row) !== "out_of_stock")
    .map((row) => ({ productId: Number(row.product_id), categoryId: Number(row.category_id), unitPrice: Number(row.selling_price), taxRate: Number(row.tax_rate), quantity: row.quantity }));
  const totals = await priceLines(priced, cart?.coupon_code, { customerId: request.ecomCustomer?.id, email: request.ecomCustomer?.email });
  const { couponResult: _ignored, ...publicTotals } = totals;
  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    couponCode: cart?.coupon_code ?? null,
    totals: publicTotals,
    canCheckout: items.length > 0 && items.every((item) => item.issue === null),
    availableCoupons: await listPublicCoupons(),
  };
}

function emptyCart() {
  return {
    items: [],
    itemCount: 0,
    couponCode: null,
    totals: { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0, coupon: null, couponError: null, freeShippingThreshold: 0 },
    canCheckout: false,
    availableCoupons: [] as { code: string; description: string | null }[],
  };
}

async function assertPurchasable(productId: number, quantity: number) {
  const product = await queryOne<{ status: string; available: number; max_order_qty: number; name: string; category_active: number }>(
    `SELECT p.status, (p.stock_qty - p.reserved_qty) AS available, p.max_order_qty, p.name, c.is_active AS category_active
       FROM ecom_products p JOIN ecom_categories c ON c.id = p.category_id WHERE p.id = ?`,
    [productId],
  );
  if (!product || product.status !== "active" || !product.category_active) throw new NotFoundError("Product");
  if (quantity > product.max_order_qty) throw new BusinessRuleError(`You can buy at most ${product.max_order_qty} of ${product.name} per order.`);
  if (quantity > Number(product.available)) {
    throw new BusinessRuleError(Number(product.available) > 0 ? `Only ${product.available} unit(s) of ${product.name} are available.` : `${product.name} is out of stock.`);
  }
}

export const cartService = {
  view: async (request: FastifyRequest) => buildView(await findCartId(request), request),

  async add(request: FastifyRequest, reply: FastifyReply, productId: number, quantity: number) {
    const cartId = await ensureCartId(request, reply);
    const existing = await queryOne<{ quantity: number }>("SELECT quantity FROM ecom_cart_items WHERE cart_id = ? AND product_id = ?", [cartId, productId]);
    await assertPurchasable(productId, (existing?.quantity ?? 0) + quantity);
    await execute(
      "INSERT INTO ecom_cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)",
      [cartId, productId, quantity],
    );
    return buildView(cartId, request);
  },

  async update(request: FastifyRequest, itemId: number, quantity: number) {
    const cartId = await findCartId(request);
    const item = cartId ? await queryOne<{ product_id: number }>("SELECT product_id FROM ecom_cart_items WHERE id = ? AND cart_id = ?", [itemId, cartId]) : undefined;
    if (!item) throw new NotFoundError("Cart item");
    await assertPurchasable(Number(item.product_id), quantity);
    await execute("UPDATE ecom_cart_items SET quantity = ? WHERE id = ?", [quantity, itemId]);
    return buildView(cartId, request);
  },

  async remove(request: FastifyRequest, itemId: number) {
    const cartId = await findCartId(request);
    if (cartId) await execute("DELETE FROM ecom_cart_items WHERE id = ? AND cart_id = ?", [itemId, cartId]);
    return buildView(cartId, request);
  },

  /** Validates the coupon against the current cart before saving it; invalid codes are rejected with the reason. */
  async applyCoupon(request: FastifyRequest, reply: FastifyReply, code: string) {
    const cartId = await ensureCartId(request, reply);
    const rows = (await loadCartLines(cartId)).filter((row) => lineIssue(row) === null);
    if (!rows.length) throw new BusinessRuleError("Add items to your cart before applying a coupon.");
    await priceLines(
      rows.map((row) => ({ productId: Number(row.product_id), categoryId: Number(row.category_id), unitPrice: Number(row.selling_price), taxRate: Number(row.tax_rate), quantity: row.quantity })),
      code,
      { customerId: request.ecomCustomer?.id, email: request.ecomCustomer?.email, strictCoupon: true },
    );
    await execute("UPDATE ecom_carts SET coupon_code = ? WHERE id = ?", [code.trim().toUpperCase(), cartId]);
    return buildView(cartId, request);
  },

  async removeCoupon(request: FastifyRequest) {
    const cartId = await findCartId(request);
    if (cartId) await execute("UPDATE ecom_carts SET coupon_code = NULL WHERE id = ?", [cartId]);
    return buildView(cartId, request);
  },

  /** Called right after sign-in/registration: moves guest items into the customer's cart (quantities capped by stock/limits). */
  async mergeGuestCart(request: FastifyRequest, reply: FastifyReply, customerId: number) {
    const token = readCookie(request, COOKIE.cart);
    if (!token) return;
    const guest = await queryOne<{ id: number; coupon_code: string | null }>("SELECT id, coupon_code FROM ecom_carts WHERE token_hash = ? AND customer_id IS NULL", [sha256(token)]);
    clearCookie(reply, COOKIE.cart);
    if (!guest) return;
    await withTransaction(async (db) => {
      await execute("INSERT IGNORE INTO ecom_carts (customer_id) VALUES (?)", [customerId], db);
      const target = (await queryOne<{ id: number; coupon_code: string | null }>("SELECT id, coupon_code FROM ecom_carts WHERE customer_id = ? FOR UPDATE", [customerId], db))!;
      await execute(
        `INSERT INTO ecom_cart_items (cart_id, product_id, quantity)
         SELECT ?, gi.product_id, LEAST(gi.quantity, p.max_order_qty) FROM ecom_cart_items gi JOIN ecom_products p ON p.id = gi.product_id WHERE gi.cart_id = ?
         ON DUPLICATE KEY UPDATE quantity = LEAST(ecom_cart_items.quantity + VALUES(quantity), 10000)`,
        [target.id, guest.id],
        db,
      );
      if (!target.coupon_code && guest.coupon_code) await execute("UPDATE ecom_carts SET coupon_code = ? WHERE id = ?", [guest.coupon_code, target.id], db);
      await execute("DELETE FROM ecom_carts WHERE id = ?", [guest.id], db);
    });
  },

  /** Removes purchased items after an order is placed. */
  async clearForOrder(cartId: number) {
    await execute("DELETE FROM ecom_cart_items WHERE cart_id = ?", [cartId]);
    await execute("UPDATE ecom_carts SET coupon_code = NULL WHERE id = ?", [cartId]);
  },

  findCartId,
};
