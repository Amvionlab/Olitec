/**
 * Unit tests that need no database. Run: npm test
 * Also a regression check that the existing warranty API still responds as before.
 */
import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

process.env.RAZORPAY_KEY_SECRET ??= "unit-test-key-secret";
process.env.RAZORPAY_KEY_ID ??= "rzp_test_unit";
process.env.RAZORPAY_WEBHOOK_SECRET ??= "unit-test-webhook-secret";
process.env.LOG_LEVEL = "silent";

const { buildApp } = await import("../../../app.js");
const { hashPassword, verifyPassword } = await import("../shared/auth.js");
const { verifyCheckoutSignature, verifyWebhookSignature } = await import("../payments/razorpay.js");
const { canTransition, ADMIN_SETTABLE } = await import("../orders/order-status.js");
const { hasPermission, ROLE_PERMISSIONS } = await import("../shared/permissions.js");

describe("password hashing", () => {
  it("verifies the right password and rejects others", async () => {
    const hash = await hashPassword("correct horse battery");
    assert.match(hash, /^scrypt\$32768\$8\$1\$/);
    assert.equal(await verifyPassword("correct horse battery", hash), true);
    assert.equal(await verifyPassword("wrong password", hash), false);
  });

  it("never produces the same hash twice (random salt)", async () => {
    assert.notEqual(await hashPassword("same"), await hashPassword("same"));
  });
});

describe("Razorpay signatures", () => {
  it("accepts a correct checkout signature and rejects a tampered one", () => {
    const signature = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!).update("order_1|pay_1").digest("hex");
    assert.equal(verifyCheckoutSignature("order_1", "pay_1", signature), true);
    assert.equal(verifyCheckoutSignature("order_1", "pay_2", signature), false);
    assert.equal(verifyCheckoutSignature("order_1", "pay_1", "0".repeat(64)), false);
    assert.equal(verifyCheckoutSignature("order_1", "pay_1", "not-hex"), false);
  });

  it("checks webhook bodies byte-for-byte", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const signature = createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!).update(body).digest("hex");
    assert.equal(verifyWebhookSignature(body, signature), true);
    assert.equal(verifyWebhookSignature(`${body} `, signature), false);
    assert.equal(verifyWebhookSignature(body, undefined), false);
  });
});

describe("order status rules", () => {
  it("allows the normal fulfilment path", () => {
    const path = ["pending_payment", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered"] as const;
    for (let index = 1; index < path.length; index += 1) assert.equal(canTransition(path[index - 1], path[index]), true, `${path[index - 1]} → ${path[index]}`);
  });

  it("blocks skipping back or cancelling after shipment", () => {
    assert.equal(canTransition("delivered", "processing"), false);
    assert.equal(canTransition("shipped", "cancelled"), false);
    assert.equal(canTransition("refunded", "confirmed"), false);
    assert.equal(canTransition("pending_payment", "shipped"), false);
  });

  it("keeps payment-driven statuses out of the admin dropdown", () => {
    assert.equal(ADMIN_SETTABLE.includes("confirmed"), false);
    assert.equal(ADMIN_SETTABLE.includes("refunded"), false);
  });
});

describe("role permissions", () => {
  it("gives Super Admin every permission and limits other roles", () => {
    assert.equal(hasPermission("super_admin", "users.manage"), true);
    assert.equal(hasPermission("shop_admin", "users.manage"), false);
    assert.equal(hasPermission("inventory_manager", "orders.manage"), false);
    assert.equal(hasPermission("customer_support", "refunds.manage"), false);
    assert.equal(hasPermission("order_manager", "refunds.manage"), true);
    assert.equal(hasPermission("product_manager", "products.manage"), true);
    assert.ok(ROLE_PERMISSIONS.customer_support.length < ROLE_PERMISSIONS.shop_admin.length);
  });
});

describe("HTTP layer (no database needed)", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  before(async () => {
    app = await buildApp();
  });
  after(async () => {
    await app.close();
  });

  it("keeps the existing warranty API working (regression)", async () => {
    const health = await app.inject({ method: "GET", url: "/health" });
    assert.equal(health.statusCode, 200);
    const products = await app.inject({ method: "GET", url: "/api/products" });
    assert.equal(products.statusCode, 200);
    assert.equal(products.json().meta.source, "mock");
    const detail = await app.inject({ method: "GET", url: `/api/products/${products.json().data[0].slug}` });
    assert.equal(detail.statusCode, 200);
    const warranties = await app.inject({ method: "GET", url: "/api/warranties" });
    assert.equal(warranties.statusCode, 200);
  });

  it("rejects state-changing e-commerce requests without the client header (CSRF)", async () => {
    const response = await app.inject({ method: "POST", url: "/api/ecommerce/cart/items", payload: { productId: 1, quantity: 1 } });
    assert.equal(response.statusCode, 403);
  });

  it("rejects requests from origins that are not allowed", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/ecommerce/auth/login",
      headers: { origin: "https://evil.example", "x-olitec-client": "web" },
      payload: { email: "a@b.co", password: "x" },
    });
    assert.equal(response.statusCode, 403);
  });

  it("validates request bodies before touching the database", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/ecommerce/auth/register",
      headers: { "x-olitec-client": "web" },
      payload: { name: "A", email: "not-an-email", mobile: "123", password: "short" },
    });
    assert.equal(response.statusCode, 400);
    assert.equal(response.json().error.code, "VALIDATION_ERROR");
  });

  it("rejects webhooks with a bad signature", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/ecommerce/payments/webhooks/razorpay",
      headers: { "content-type": "application/json", "x-razorpay-signature": "0".repeat(64) },
      payload: JSON.stringify({ event: "payment.captured" }),
    });
    assert.equal(response.statusCode, 422);
  });

  it("refuses admin routes without an admin session", async () => {
    const response = await app.inject({ method: "GET", url: "/api/ecommerce/admin/dashboard" });
    // 401 with a database, 503 when DB credentials are not configured — never 200.
    assert.ok([401, 503].includes(response.statusCode), `got ${response.statusCode}`);
  });

  it("authenticates admin routes before validating the body (no schema details to anonymous callers)", async () => {
    const response = await app.inject({ method: "POST", url: "/api/ecommerce/admin/products", headers: { "x-olitec-client": "test" }, payload: { nonsense: true } });
    assert.ok([401, 503].includes(response.statusCode), `got ${response.statusCode}`);
  });

  it("does not serve arbitrary files from the media route", async () => {
    const response = await app.inject({ method: "GET", url: "/api/ecommerce/media/..%2F..%2F.env" });
    assert.equal(response.statusCode, 404);
  });
});
