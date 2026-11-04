/**
 * Coupon validation — the single place that decides whether a coupon applies and how much it is worth.
 * Used by the cart preview and, with row locks, by order creation.
 */
import { query, queryOne, type Queryable } from "../../../db/pool.js";
import { BusinessRuleError } from "../../../utils/errors.js";
import { json, round2 } from "../shared/http.js";

export interface CouponRow {
  id: number;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  starts_at: Date | null;
  ends_at: Date | null;
  usage_limit: number | null;
  per_customer_limit: number | null;
  used_count: number;
  new_customers_only: number | boolean;
  applies_to: "all" | "products" | "categories";
  applicable_ids: unknown;
  is_active: number | boolean;
}

export interface PricedLine {
  productId: number;
  categoryId: number;
  unitPrice: number;
  taxRate: number;
  quantity: number;
}

export interface CouponContext {
  customerId?: number;
  email?: string;
  db?: Queryable;
  /** Lock the coupon row (order creation). */
  forUpdate?: boolean;
}

export interface CouponResult {
  coupon: CouponRow;
  discount: number;
  /** Product ids the discount is spread over. */
  eligibleProductIds: Set<number>;
}

export async function findCoupon(code: string, ctx: CouponContext = {}): Promise<CouponRow | undefined> {
  return queryOne<CouponRow>(`SELECT * FROM ecom_coupons WHERE code = ?${ctx.forUpdate ? " FOR UPDATE" : ""}`, [code.trim().toUpperCase()], ctx.db);
}

/** Throws BusinessRuleError with a customer-friendly message when the coupon cannot be used. */
export async function evaluateCoupon(code: string, lines: PricedLine[], ctx: CouponContext = {}): Promise<CouponResult> {
  const coupon = await findCoupon(code, ctx);
  const now = Date.now();
  if (!coupon || !coupon.is_active) throw new BusinessRuleError("This coupon code is not valid.");
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) throw new BusinessRuleError("This coupon is not active yet.");
  if (coupon.ends_at && new Date(coupon.ends_at).getTime() < now) throw new BusinessRuleError("This coupon has expired.");
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) throw new BusinessRuleError("This coupon has reached its usage limit.");

  const email = ctx.email?.toLowerCase();
  if (coupon.per_customer_limit !== null && (ctx.customerId || email)) {
    const row = await queryOne<{ uses: number }>(
      "SELECT COUNT(*) AS uses FROM ecom_coupon_usages WHERE coupon_id = ? AND (customer_id = ? OR email = ?)",
      [coupon.id, ctx.customerId ?? 0, email ?? ""],
      ctx.db,
    );
    if (Number(row?.uses ?? 0) >= coupon.per_customer_limit) throw new BusinessRuleError("You have already used this coupon the maximum number of times.");
  }

  if (coupon.new_customers_only) {
    if (!ctx.customerId && !email) throw new BusinessRuleError("Sign in or enter your email at checkout to use this new-customer coupon.");
    const row = await queryOne<{ orders: number }>(
      `SELECT COUNT(*) AS orders FROM ecom_orders
        WHERE (customer_id = ? OR contact_email = ?) AND payment_status IN ('paid', 'cod_pending', 'partially_refunded', 'refunded')`,
      [ctx.customerId ?? 0, email ?? ""],
      ctx.db,
    );
    if (Number(row?.orders ?? 0) > 0) throw new BusinessRuleError("This coupon is only for first orders.");
  }

  const ids = new Set(json<number[]>(coupon.applicable_ids, []).map(Number));
  const eligible = lines.filter((line) =>
    coupon.applies_to === "all" ? true : coupon.applies_to === "products" ? ids.has(line.productId) : ids.has(line.categoryId),
  );
  if (eligible.length === 0) throw new BusinessRuleError("This coupon does not apply to the items in your cart.");

  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  if (subtotal < Number(coupon.min_order_value)) {
    throw new BusinessRuleError(`Add items worth ₹${round2(Number(coupon.min_order_value) - subtotal).toLocaleString("en-IN")} more to use this coupon.`);
  }

  const eligibleSubtotal = eligible.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  let discount = coupon.discount_type === "percentage" ? (eligibleSubtotal * Number(coupon.discount_value)) / 100 : Number(coupon.discount_value);
  if (coupon.max_discount !== null) discount = Math.min(discount, Number(coupon.max_discount));
  discount = round2(Math.min(discount, eligibleSubtotal));

  return { coupon, discount, eligibleProductIds: new Set(eligible.map((line) => line.productId)) };
}

/** Coupons usable by anyone right now — shown on the cart page. */
export async function listPublicCoupons() {
  return query<{ code: string; description: string | null }>(
    `SELECT code, description FROM ecom_coupons
      WHERE is_active = TRUE AND new_customers_only = FALSE AND applies_to = 'all'
        AND (starts_at IS NULL OR starts_at <= UTC_TIMESTAMP()) AND (ends_at IS NULL OR ends_at > UTC_TIMESTAMP())
        AND (usage_limit IS NULL OR used_count < usage_limit) AND description IS NOT NULL
      ORDER BY created_at DESC LIMIT 5`,
  );
}
