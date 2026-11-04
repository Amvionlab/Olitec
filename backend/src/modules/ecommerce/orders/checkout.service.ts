/**
 * Order creation. One transaction:
 *   1. re-read the cart and re-validate every line (status, stock, purchase limits)
 *   2. lock + reserve stock (online) or deduct it (COD)          — prevents overselling
 *   3. lock + re-validate the coupon and record its use          — enforces usage limits under concurrency
 *   4. price everything on the server; reject if it differs from what the customer confirmed
 *   5. insert the order with item snapshots and status history, then empty the cart
 * The idempotency key (unique column) makes retries/double-clicks return the same order instead of a second one.
 */
import type { FastifyReply, FastifyRequest } from "fastify";
import { execute, queryOne, withTransaction } from "../../../db/pool.js";
import { AppError, BusinessRuleError, UnauthorizedError } from "../../../utils/errors.js";
import { cartService, lineIssue, loadCartLines } from "../cart/cart.service.js";
import { isPincodeServiceable, priceLines } from "../cart/pricing.js";
import { evaluateCoupon } from "../coupons/coupon-rules.js";
import { inventoryService } from "../inventory/inventory.service.js";
import { newToken, sha256 } from "../shared/auth.js";
import { round2 } from "../shared/http.js";
import type { AddressInput } from "../shared/schemas.js";
import { nextNumber } from "../shared/sequences.js";
import { getSettings } from "../shared/settings.js";

export interface CheckoutInput {
  idempotencyKey: string;
  contact: { name: string; email: string; phone: string };
  shippingAddressId?: number;
  shippingAddress?: AddressInput;
  billingSameAsShipping: boolean;
  billingAddressId?: number;
  billingAddress?: AddressInput;
  billingGstin?: string;
  paymentMethod: "online" | "cod";
  customerNote?: string;
  saveAddress?: boolean;
  expectedTotal?: number;
}

class PriceChangedError extends AppError {
  constructor(total: number) {
    super(409, "PRICE_CHANGED", "Prices or offers changed since you reviewed your order. Please check the updated total and confirm again.", { total });
  }
}

async function resolveAddress(customerId: number | undefined, id: number | undefined, inline: AddressInput | undefined, label: string): Promise<AddressInput> {
  if (id) {
    if (!customerId) throw new UnauthorizedError("Sign in to use a saved address.");
    const row = await queryOne<{ full_name: string; phone: string; line1: string; line2: string | null; city: string; state: string; pincode: string }>(
      "SELECT full_name, phone, line1, line2, city, state, pincode FROM ecom_addresses WHERE id = ? AND customer_id = ?",
      [id, customerId],
    );
    if (!row) throw new BusinessRuleError(`The selected ${label} address was not found.`);
    return { fullName: row.full_name, phone: row.phone, line1: row.line1, line2: row.line2 ?? undefined, city: row.city, state: row.state, pincode: row.pincode };
  }
  if (!inline) throw new BusinessRuleError(`Please enter a ${label} address.`);
  return inline;
}

export async function existingOrderForKey(idempotencyKey: string, customerId: number | undefined, email: string) {
  const row = await queryOne<{ order_number: string; customer_id: number | null; contact_email: string }>(
    "SELECT order_number, customer_id, contact_email FROM ecom_orders WHERE idempotency_key = ?",
    [idempotencyKey],
  );
  if (!row) return undefined;
  const sameOwner = customerId ? Number(row.customer_id) === customerId : row.customer_id === null && row.contact_email === email.toLowerCase();
  if (!sameOwner) throw new BusinessRuleError("This checkout session is no longer valid. Please refresh the page.");
  return row.order_number;
}

export const checkoutService = {
  async placeOrder(request: FastifyRequest, reply: FastifyReply, input: CheckoutInput) {
    const settings = await getSettings();
    const customer = request.ecomCustomer;
    if (!customer && !settings.checkout.guestCheckout) throw new UnauthorizedError("Please sign in to place an order.");
    const email = input.contact.email.trim().toLowerCase();

    // Retried submission: hand back the order that was already created (a new access token is issued for guests).
    const existing = await existingOrderForKey(input.idempotencyKey, customer?.id, email);
    if (existing) {
      const accessToken = newToken();
      await execute("UPDATE ecom_orders SET access_token_hash = ? WHERE order_number = ?", [sha256(accessToken), existing]);
      return { orderNumber: existing, accessToken, duplicate: true };
    }

    const cartId = await cartService.findCartId(request);
    const rows = cartId ? await loadCartLines(cartId) : [];
    if (!rows.length) throw new BusinessRuleError("Your cart is empty.");
    const problems = rows.filter((row) => lineIssue(row) !== null);
    if (problems.length) {
      throw new AppError(422, "CART_INVALID", "Some items in your cart need attention before checkout.", problems.map((row) => ({ productId: Number(row.product_id), name: row.name, issue: lineIssue(row) })));
    }

    const shipping = await resolveAddress(customer?.id, input.shippingAddressId, input.shippingAddress, "shipping");
    const billing = input.billingSameAsShipping ? shipping : await resolveAddress(customer?.id, input.billingAddressId, input.billingAddress, "billing");
    if (!(await isPincodeServiceable(shipping.pincode))) throw new BusinessRuleError(`Sorry, we do not deliver to pincode ${shipping.pincode} yet.`);

    const cart = await queryOne<{ coupon_code: string | null }>("SELECT coupon_code FROM ecom_carts WHERE id = ?", [cartId]);
    const lines = rows.map((row) => ({
      productId: Number(row.product_id),
      categoryId: Number(row.category_id),
      unitPrice: Number(row.selling_price),
      taxRate: Number(row.tax_rate),
      quantity: row.quantity,
    }));

    if (input.paymentMethod === "cod") {
      if (!settings.checkout.codEnabled) throw new BusinessRuleError("Cash on Delivery is not available.");
    }

    const accessToken = newToken();
    const orderNumber = await withTransaction(async (db) => {
      // Stock first, then coupon — the same lock order as cancellation, so the two cannot deadlock.
      const reservationMinutes = settings.checkout.reservationMinutes;
      const tempRef = `checkout:${input.idempotencyKey.slice(0, 20)}`;
      if (input.paymentMethod === "cod") await inventoryService.deduct(db, lines, tempRef);
      else await inventoryService.reserve(db, lines, tempRef);

      const totals = await priceLines(lines, null, {});
      let discount = 0;
      let couponId: number | null = null;
      let couponCode: string | null = null;
      let finalTotals = totals;
      if (cart?.coupon_code) {
        const result = await evaluateCoupon(cart.coupon_code, lines, { customerId: customer?.id, email, db, forUpdate: true });
        finalTotals = await priceLines(lines, cart.coupon_code, { customerId: customer?.id, email, db, strictCoupon: true });
        discount = result.discount;
        couponId = Number(result.coupon.id);
        couponCode = result.coupon.code;
      }
      if (input.expectedTotal !== undefined && round2(input.expectedTotal) !== finalTotals.total) throw new PriceChangedError(finalTotals.total);
      if (input.paymentMethod === "cod" && settings.checkout.codMaxOrderValue > 0 && finalTotals.total > settings.checkout.codMaxOrderValue) {
        throw new BusinessRuleError(`Cash on Delivery is available for orders up to ₹${settings.checkout.codMaxOrderValue.toLocaleString("en-IN")}.`);
      }

      const number = await nextNumber("order", db);
      const isCod = input.paymentMethod === "cod";
      const result = await execute(
        `INSERT INTO ecom_orders (order_number, customer_id, idempotency_key, access_token_hash, contact_name, contact_email, contact_phone,
           shipping_address, billing_address, billing_gstin, subtotal, discount_total, shipping_total, tax_total, grand_total, coupon_id, coupon_code,
           payment_method, payment_status, status, stock_state, reservation_expires_at, customer_note, confirmed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${isCod ? "NULL" : "DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE)"}, ?, ${isCod ? "UTC_TIMESTAMP()" : "NULL"})`,
        [
          number, customer?.id ?? null, input.idempotencyKey, sha256(accessToken), input.contact.name, email, input.contact.phone,
          JSON.stringify(shipping), JSON.stringify(billing), input.billingGstin ?? null,
          finalTotals.subtotal, discount, finalTotals.shipping, finalTotals.tax, finalTotals.total, couponId, couponCode,
          input.paymentMethod, isCod ? "cod_pending" : "pending", isCod ? "confirmed" : "pending_payment", isCod ? "committed" : "reserved",
          ...(isCod ? [] : [reservationMinutes]), input.customerNote ?? null,
        ],
        db,
      );
      const orderId = result.insertId;

      for (const row of rows) {
        await execute(
          `INSERT INTO ecom_order_items (order_id, product_id, sku, product_name, image_url, attributes, mrp, unit_price, tax_rate, hsn_code, quantity, line_total, category_id)
           SELECT ?, p.id, p.sku, p.name, (SELECT url FROM ecom_product_images i WHERE i.product_id = p.id ORDER BY i.sort_order, i.id LIMIT 1), p.attributes,
                  p.mrp, p.selling_price, p.tax_rate, p.hsn_code, ?, ROUND(p.selling_price * ?, 2), p.category_id
             FROM ecom_products p WHERE p.id = ?`,
          [orderId, row.quantity, row.quantity, row.product_id],
          db,
        );
      }
      // Point the stock movements written above at the real order number.
      await execute("UPDATE ecom_inventory_movements SET reference_id = ? WHERE reference_type = 'order' AND reference_id = ?", [number, tempRef], db);
      await execute(
        "INSERT INTO ecom_order_status_history (order_id, from_status, to_status, note, actor_type, actor_id) VALUES (?, NULL, ?, ?, ?, ?)",
        [orderId, isCod ? "confirmed" : "pending_payment", isCod ? "Order placed (Cash on Delivery)" : "Order placed, awaiting payment", customer ? "customer" : "system", customer?.id ?? null],
        db,
      );
      if (couponId) {
        await execute("INSERT INTO ecom_coupon_usages (coupon_id, order_id, customer_id, email, discount) VALUES (?, ?, ?, ?, ?)", [couponId, orderId, customer?.id ?? null, email, discount], db);
        await execute("UPDATE ecom_coupons SET used_count = used_count + 1 WHERE id = ?", [couponId], db);
      }
      if (customer && input.saveAddress && input.shippingAddress) {
        const saved = await queryOne<{ count: number }>("SELECT COUNT(*) AS count FROM ecom_addresses WHERE customer_id = ?", [customer.id], db);
        await execute(
          `INSERT INTO ecom_addresses (customer_id, full_name, phone, line1, line2, city, state, pincode, is_default_shipping, is_default_billing)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [customer.id, shipping.fullName, shipping.phone, shipping.line1, shipping.line2 ?? null, shipping.city, shipping.state, shipping.pincode, Number(saved?.count) === 0, Number(saved?.count) === 0],
          db,
        );
      }
      await execute("DELETE FROM ecom_cart_items WHERE cart_id = ?", [cartId], db);
      await execute("UPDATE ecom_carts SET coupon_code = NULL WHERE id = ?", [cartId], db);
      return number;
    }).catch((error: unknown) => {
      // Two submissions with the same key raced: the loser hits the unique index — return the winner's order.
      if ((error as { code?: string }).code === "ER_DUP_ENTRY" && String((error as Error).message).includes("idempotency")) {
        return existingOrderForKey(input.idempotencyKey, customer?.id, email).then(async (number) => {
          if (!number) throw error;
          await execute("UPDATE ecom_orders SET access_token_hash = ? WHERE order_number = ?", [sha256(accessToken), number]);
          return number;
        });
      }
      throw error;
    });

    reply.status(201);
    return { orderNumber, accessToken, duplicate: false };
  },

  /** Review step before placing the order: server-side totals for the current cart and destination. */
  async preview(request: FastifyRequest, input: { pincode?: string; email?: string }) {
    const cart = await cartService.view(request);
    const settings = await getSettings();
    return {
      ...cart,
      serviceable: input.pincode ? await isPincodeServiceable(input.pincode) : null,
      checkout: {
        guestCheckout: settings.checkout.guestCheckout,
        codEnabled: settings.checkout.codEnabled,
        codMaxOrderValue: settings.checkout.codMaxOrderValue,
        reservationMinutes: settings.checkout.reservationMinutes,
        estimatedDelivery: settings.shipping.estimatedDays,
      },
    };
  },
};
