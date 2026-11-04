/**
 * End-to-end API tests against a real MySQL database.
 *
 * Opt-in, because they write data:  ECOM_TEST_DB=1 with DB_NAME ending in "_test", after `npm run db:migrate`.
 *   PowerShell:  $env:ECOM_TEST_DB=1; $env:DB_NAME="olitec_shop_test"; npm run db:migrate; npm test
 * Every run uses fresh unique SKUs/emails, so runs never clash; nothing is deleted.
 */
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { after, before, beforeEach, describe, it } from "node:test";

process.env.PAYMENT_PROVIDER = "mock";
process.env.RAZORPAY_WEBHOOK_SECRET = "integration-webhook-secret";
process.env.LOG_LEVEL = "silent";
process.env.ECOM_RESERVATION_SWEEP_MS = "0";

const enabled = process.env.ECOM_TEST_DB === "1";
const { databaseConfig } = await import("../../../config/database.js");
const safeDb = databaseConfig.database.endsWith("_test");

describe("e-commerce integration", { skip: !enabled ? "set ECOM_TEST_DB=1 to run" : !safeDb ? "DB_NAME must end in _test" : false }, async () => {
  const { buildApp } = await import("../../../app.js");
  const { execute, queryOne, closePool } = await import("../../../db/pool.js");
  const { hashPassword } = await import("../shared/auth.js");
  const { resetRateLimits } = await import("../shared/rate-limit.js");
  const { clearSettingsCache } = await import("../shared/settings.js");
  const { releaseExpiredReservations } = await import("../orders/order-lifecycle.js");

  let app: Awaited<ReturnType<typeof buildApp>>;
  const run = randomUUID().slice(0, 8).toUpperCase();
  const adminEmail = `it-admin-${run.toLowerCase()}@test.example`;
  const adminPassword = "integration-pass-123";
  let categoryId = 0;

  /** Minimal cookie-keeping client around app.inject. */
  function client() {
    const jar = new Map<string, string>();
    return async (method: "GET" | "POST" | "PATCH" | "DELETE", url: string, payload?: unknown) => {
      const response = await app.inject({
        method,
        url: `/api/ecommerce${url}`,
        payload: payload as never,
        headers: { "x-olitec-client": "test", cookie: [...jar].map(([key, value]) => `${key}=${value}`).join("; ") },
      });
      const setCookie = response.headers["set-cookie"];
      for (const header of Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : []) {
        const [pair] = header.split(";");
        const [key, value] = pair.split("=");
        if (header.includes("Max-Age=0")) jar.delete(key);
        else jar.set(key, value);
      }
      return { status: response.statusCode, body: response.headers["content-type"]?.includes("json") ? response.json() : response.body };
    };
  }

  async function makeProduct(stock: number, price = 1000, extra: Record<string, unknown> = {}) {
    const sku = `IT-${run}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const result = await execute(
      `INSERT INTO ecom_products (sku, slug, name, category_id, mrp, selling_price, stock_qty, max_order_qty, status, tax_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 18)`,
      [sku, sku.toLowerCase(), `Test product ${sku}`, categoryId, price * 1.2, price, stock, (extra.maxOrderQty as number) ?? 10],
    );
    return { id: result.insertId, sku };
  }

  const checkoutBody = (overrides: Record<string, unknown> = {}) => ({
    idempotencyKey: randomUUID(),
    contact: { name: "Test Buyer", email: `buyer-${run.toLowerCase()}@test.example`, phone: "9876543210" },
    shippingAddress: { fullName: "Test Buyer", phone: "9876543210", line1: "1 Test Street", city: "Chennai", state: "Tamil Nadu", pincode: "600001" },
    billingSameAsShipping: true,
    paymentMethod: "online",
    ...overrides,
  });

  async function stockOf(productId: number) {
    return (await queryOne<{ stock_qty: number; reserved_qty: number }>("SELECT stock_qty, reserved_qty FROM ecom_products WHERE id = ?", [productId]))!;
  }

  before(async () => {
    app = await buildApp();
    await execute("INSERT INTO admins (name, email, password_hash, role) VALUES ('IT Super', ?, ?, 'super_admin')", [adminEmail, await hashPassword(adminPassword)]);
    categoryId = (await execute("INSERT INTO ecom_categories (name, slug) VALUES (?, ?)", [`IT ${run}`, `it-${run.toLowerCase()}`])).insertId;
    await execute(
      "UPDATE ecom_settings SET setting_value = JSON_SET(setting_value, '$.flatFee', 100, '$.freeShippingThreshold', 5000) WHERE setting_key = 'shipping'",
    );
    await execute("UPDATE ecom_settings SET setting_value = JSON_SET(setting_value, '$.returnWindowDays', 7) WHERE setting_key = 'returns'");
    clearSettingsCache();
  });

  after(async () => {
    await app.close();
    await closePool();
  });

  // The suite makes many checkout/login calls from one IP; the limiter itself is covered by its own logic.
  beforeEach(() => resetRateLimits());

  it("admin creates and edits products; duplicate SKUs are rejected", async () => {
    resetRateLimits();
    const admin = client();
    assert.equal((await admin("POST", "/admin/auth/login", { email: adminEmail, password: "wrong-password" })).status, 401);
    assert.equal((await admin("POST", "/admin/auth/login", { email: adminEmail, password: adminPassword })).status, 200);

    const sku = `IT-${run}-NEW`;
    const created = await admin("POST", "/admin/products", { sku, name: "Integration Panel", categoryId, mrp: 2000, sellingPrice: 1800, initialStock: 5, status: "active" });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    assert.equal(created.body.data.stockQty, 5);
    assert.equal((await admin("POST", "/admin/products", { sku, name: "Dup", categoryId, mrp: 10, sellingPrice: 9 })).status, 409);
    assert.equal((await admin("POST", "/admin/products", { sku: `${sku}-X`, name: "Bad price", categoryId, mrp: 10, sellingPrice: 11 })).status, 422);

    const updated = await admin("PATCH", `/admin/products/${created.body.data.id}`, { sellingPrice: 1700, isFeatured: true });
    assert.equal(updated.body.data.sellingPrice, 1700);
    const audit = await queryOne("SELECT 1 FROM ecom_audit_logs WHERE action = 'product.update' AND entity_id = ?", [String(created.body.data.id)]);
    assert.ok(audit, "product update is audited");

    const publicDetail = await client()("GET", `/products/${created.body.data.slug}`);
    assert.equal(publicDetail.status, 200);
    assert.equal(publicDetail.body.data.sellingPrice, 1700);
  });

  it("enforces admin roles on the backend", async () => {
    resetRateLimits();
    const superAdmin = client();
    await superAdmin("POST", "/admin/auth/login", { email: adminEmail, password: adminPassword });
    const email = `it-inv-${run.toLowerCase()}@test.example`;
    assert.equal((await superAdmin("POST", "/admin/users", { name: "Inventory Person", email, password: "inventory-pass-1", role: "inventory_manager" })).status, 201);

    const inventory = client();
    assert.equal((await inventory("POST", "/admin/auth/login", { email, password: "inventory-pass-1" })).status, 200);
    const product = await makeProduct(2);
    assert.equal((await inventory("POST", "/admin/products", { sku: `IT-${run}-NOPE`, name: "x", categoryId, mrp: 1, sellingPrice: 1 })).status, 403);
    assert.equal((await inventory("GET", "/admin/orders")).status, 403);
    assert.equal((await inventory("POST", "/admin/refunds", { orderId: 1, amount: 1, reason: "nope" })).status, 403);
    const adjusted = await inventory("POST", `/admin/inventory/${product.id}/adjust`, { type: "stock_in", quantity: 3, note: "Delivery" });
    assert.equal(adjusted.status, 200);
    assert.equal(adjusted.body.data.stockQty, 5);
  });

  it("cart computes totals on the server and enforces stock", async () => {
    const product = await makeProduct(3, 1000);
    const shopper = client();
    const added = await shopper("POST", "/cart/items", { productId: product.id, quantity: 2 });
    assert.equal(added.status, 200);
    const totals = added.body.data.totals;
    assert.equal(totals.subtotal, 2000);
    assert.equal(totals.shipping, 100, "flat fee below the free-shipping threshold");
    assert.equal(totals.total, 2100);
    assert.equal(totals.tax, Math.round(((2000 * 18) / 118) * 100) / 100, "GST is included in the price");
    const itemId = added.body.data.items[0].id;
    assert.equal((await shopper("PATCH", `/cart/items/${itemId}`, { quantity: 4 })).status, 422, "cannot exceed stock");
    assert.equal((await shopper("POST", "/cart/items", { productId: product.id, quantity: 2 })).status, 422, "adding more than available fails");
  });

  it("coupons: validation, limits and minimum order value", async () => {
    const code = `IT${run}`;
    await execute(
      "INSERT INTO ecom_coupons (code, discount_type, discount_value, min_order_value, max_discount, usage_limit, per_customer_limit) VALUES (?, 'percentage', 50, 1500, 300, 1, 1)",
      [code],
    );
    const product = await makeProduct(10, 1000);
    const shopper = client();
    await shopper("POST", "/cart/items", { productId: product.id, quantity: 1 });
    assert.equal((await shopper("POST", "/cart/coupon", { code })).status, 422, "below minimum order value");
    await shopper("POST", "/cart/items", { productId: product.id, quantity: 1 });
    const applied = await shopper("POST", "/cart/coupon", { code });
    assert.equal(applied.status, 200);
    assert.equal(applied.body.data.totals.discount, 300, "capped at max discount");
    assert.equal((await shopper("POST", "/cart/coupon", { code: "DOES-NOT-EXIST" })).status, 422);

    const placed = await shopper("POST", "/checkout/orders", checkoutBody());
    assert.equal(placed.status, 201, JSON.stringify(placed.body));
    const used = await queryOne<{ used_count: number }>("SELECT used_count FROM ecom_coupons WHERE code = ?", [code]);
    assert.equal(used!.used_count, 1);

    const other = client();
    await other("POST", "/cart/items", { productId: product.id, quantity: 2 });
    assert.equal((await other("POST", "/cart/coupon", { code })).status, 422, "total usage limit reached");
  });

  it("checkout reserves stock, is idempotent, and payment commits it", async () => {
    const product = await makeProduct(3, 1000);
    const shopper = client();
    await shopper("POST", "/cart/items", { productId: product.id, quantity: 2 });
    const body = checkoutBody();

    const priceCheck = await shopper("POST", "/checkout/orders", { ...body, idempotencyKey: randomUUID(), expectedTotal: 1 });
    assert.equal(priceCheck.status, 409, "order is refused when the confirmed total is stale");

    const first = await shopper("POST", "/checkout/orders", body);
    assert.equal(first.status, 201, JSON.stringify(first.body));
    const { orderNumber, accessToken } = first.body.data;
    assert.deepEqual(await stockOf(product.id), { stock_qty: 3, reserved_qty: 2 });

    const retry = await shopper("POST", "/checkout/orders", body);
    assert.equal(retry.body.data.orderNumber, orderNumber, "same idempotency key → same order");
    assert.equal(retry.body.data.duplicate, true);
    const count = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM ecom_orders WHERE idempotency_key = ?", [body.idempotencyKey]);
    assert.equal(Number(count!.n), 1);

    const token = retry.body.data.accessToken ?? accessToken;
    const payment = await shopper("POST", "/payments/initiate", { orderNumber, token });
    assert.equal(payment.status, 200);
    assert.equal(payment.body.data.amount, 210000, "amount comes from the order (₹2,100 in paise)");

    const failed = await shopper("POST", "/payments/mock/complete", { orderNumber, token, providerOrderId: payment.body.data.providerOrderId, outcome: "failure" });
    assert.equal(failed.body.data.status, "failed");
    assert.equal((await stockOf(product.id)).reserved_qty, 2, "stock stays held after a failed attempt so the customer can retry");

    const retryPayment = await shopper("POST", "/payments/initiate", { orderNumber, token });
    const paid = await shopper("POST", "/payments/mock/complete", { orderNumber, token, providerOrderId: retryPayment.body.data.providerOrderId, outcome: "success" });
    assert.equal(paid.status, 200, JSON.stringify(paid.body));
    assert.deepEqual(await stockOf(product.id), { stock_qty: 1, reserved_qty: 0 });

    const order = await shopper("GET", `/orders/${orderNumber}?token=${token}`);
    assert.equal(order.body.data.status, "confirmed");
    assert.equal(order.body.data.paymentStatus, "paid");
    assert.equal((await client()("GET", `/orders/${orderNumber}`)).status, 404, "other visitors cannot see the order");

    const again = await shopper("POST", "/payments/initiate", { orderNumber, token });
    assert.equal(again.status, 422, "a paid order cannot be paid twice");
  });

  it("prevents overselling under concurrent checkouts", async () => {
    const product = await makeProduct(1, 500);
    const buyers = [client(), client(), client()];
    for (const buyer of buyers) await buyer("POST", "/cart/items", { productId: product.id, quantity: 1 });
    const results = await Promise.all(buyers.map((buyer, index) => buyer("POST", "/checkout/orders", checkoutBody({ contact: { name: "Racer", email: `racer${index}-${run.toLowerCase()}@test.example`, phone: "9876543210" } }))));
    assert.equal(results.filter((result) => result.status === 201).length, 1, JSON.stringify(results.map((result) => result.status)));
    assert.deepEqual(await stockOf(product.id), { stock_qty: 1, reserved_qty: 1 });
  });

  it("expired and cancelled checkouts release stock", async () => {
    const product = await makeProduct(2, 500);
    const shopper = client();
    await shopper("POST", "/cart/items", { productId: product.id, quantity: 2 });
    const placed = await shopper("POST", "/checkout/orders", checkoutBody());
    const { orderNumber } = placed.body.data;
    assert.equal((await stockOf(product.id)).reserved_qty, 2);

    await execute("UPDATE ecom_orders SET reservation_expires_at = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 MINUTE) WHERE order_number = ?", [orderNumber]);
    assert.ok((await releaseExpiredReservations()) >= 1);
    assert.equal((await stockOf(product.id)).reserved_qty, 0);
    const order = await queryOne<{ status: string }>("SELECT status FROM ecom_orders WHERE order_number = ?", [orderNumber]);
    assert.equal(order!.status, "cancelled");

    const second = client();
    await second("POST", "/cart/items", { productId: product.id, quantity: 1 });
    const next = await second("POST", "/checkout/orders", checkoutBody());
    const cancel = await second("POST", `/orders/${next.body.data.orderNumber}/cancel`, { reason: "Changed my mind", token: next.body.data.accessToken });
    assert.equal(cancel.body.data.cancelled, true);
    assert.equal((await stockOf(product.id)).reserved_qty, 0);
  });

  it("webhooks are verified and processed once", async () => {
    const event = JSON.stringify({ event: "payment.failed", payload: { payment: { entity: { id: "pay_x", order_id: "order_unknown", amount: 100 } } } });
    const signature = createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!).update(event).digest("hex");
    const send = () =>
      app.inject({
        method: "POST",
        url: "/api/ecommerce/payments/webhooks/razorpay",
        headers: { "content-type": "application/json", "x-razorpay-signature": signature, "x-razorpay-event-id": `evt_${run}` },
        payload: event,
      });
    const first = await send();
    assert.equal(first.statusCode, 200, first.body);
    assert.equal(first.json().data.duplicate, false);
    const second = await send();
    assert.equal(second.json().data.duplicate, true);
  });

  it("order status transitions, cancellation and refund workflow", async () => {
    resetRateLimits();
    const product = await makeProduct(5, 2000);
    const shopper = client();
    await shopper("POST", "/cart/items", { productId: product.id, quantity: 1 });
    const placed = await shopper("POST", "/checkout/orders", checkoutBody());
    const { orderNumber, accessToken: token } = placed.body.data;
    const payment = await shopper("POST", "/payments/initiate", { orderNumber, token });
    await shopper("POST", "/payments/mock/complete", { orderNumber, token, providerOrderId: payment.body.data.providerOrderId, outcome: "success" });
    const orderId = Number((await queryOne<{ id: number }>("SELECT id FROM ecom_orders WHERE order_number = ?", [orderNumber]))!.id);

    const admin = client();
    await admin("POST", "/admin/auth/login", { email: adminEmail, password: adminPassword });
    assert.equal((await admin("PATCH", `/admin/orders/${orderId}/status`, { status: "delivered" })).status, 422, "cannot jump to delivered");
    assert.equal((await admin("PATCH", `/admin/orders/${orderId}/status`, { status: "processing" })).status, 200);
    assert.equal((await admin("PATCH", `/admin/orders/${orderId}/status`, { status: "packed" })).status, 200);
    assert.equal((await admin("PATCH", `/admin/orders/${orderId}/status`, { status: "shipped" })).status, 422, "tracking required before shipping");
    await admin("PATCH", `/admin/orders/${orderId}/shipping`, { courierName: "Test Courier", trackingNumber: "TRK123" });
    assert.equal((await admin("PATCH", `/admin/orders/${orderId}/status`, { status: "shipped" })).status, 200);
    assert.equal((await admin("PATCH", `/admin/orders/${orderId}/status`, { status: "delivered" })).status, 200);

    const returnRequest = await shopper("POST", `/orders/${orderNumber}/return`, { reason: "Damaged on arrival", token });
    assert.equal(returnRequest.status, 200, JSON.stringify(returnRequest.body));
    const detail = await admin("GET", `/admin/orders/${orderId}`);
    const requestId = detail.body.data.requests[0].id;
    const decided = await admin("POST", `/admin/orders/${orderId}/requests/${requestId}`, { decision: "approved", remark: "Photos confirm damage" });
    assert.equal(decided.body.data.status, "returned");
    assert.equal((await stockOf(product.id)).stock_qty, 5, "returned units are restocked");

    const refunds = await admin("GET", "/admin/refunds?status=pending");
    const refund = refunds.body.data.find((item: { orderNumber: string }) => item.orderNumber === orderNumber);
    assert.ok(refund, "approving the return opens a refund");
    const processed = await admin("POST", `/admin/refunds/${refund.id}/process`, {});
    assert.equal(processed.status, 200, JSON.stringify(processed.body));
    const final = await shopper("GET", `/orders/${orderNumber}?token=${token}`);
    assert.equal(final.body.data.status, "refunded");
    assert.equal(final.body.data.paymentStatus, "refunded");

    const tracked = await client()("POST", "/orders/track", { orderNumber, email: `buyer-${run.toLowerCase()}@test.example` });
    assert.equal(tracked.status, 200);
    assert.equal((await client()("POST", "/orders/track", { orderNumber, email: "someone@else.example" })).status, 404);
  });

  it("customer registration, login, guest cart merge and order history", async () => {
    resetRateLimits();
    const product = await makeProduct(5, 700);
    const visitor = client();
    await visitor("POST", "/cart/items", { productId: product.id, quantity: 1 });
    const email = `it-customer-${run.toLowerCase()}@test.example`;
    const mobile = `9${String(Date.now()).slice(-9)}`;
    const registered = await visitor("POST", "/auth/register", { name: "Integration Customer", email, mobile, password: "customer-pass-1" });
    assert.equal(registered.status, 201, JSON.stringify(registered.body));
    assert.equal((await visitor("GET", "/cart")).body.data.itemCount, 1, "guest cart merged into the account");
    assert.equal((await client()("POST", "/auth/register", { name: "Dup", email, mobile: "9123456780", password: "customer-pass-1" })).status, 409);

    const placed = await visitor("POST", "/checkout/orders", checkoutBody({ contact: { name: "Integration Customer", email, phone: mobile } }));
    assert.equal(placed.status, 201);
    const history = await visitor("GET", "/orders");
    assert.equal(history.body.data[0].orderNumber, placed.body.data.orderNumber);

    await visitor("POST", "/auth/logout");
    assert.equal((await visitor("GET", "/orders")).status, 401);
    const login = await visitor("POST", "/auth/login", { email, password: "customer-pass-1" });
    assert.equal(login.status, 200);
    assert.equal((await visitor("GET", "/orders")).body.data.length, 1);
  });

  it("bulk enquiries, reports and exports", async () => {
    resetRateLimits();
    const created = await client()("POST", "/bulk-enquiries", {
      contactName: "Bulk Buyer",
      companyName: "Integration Pvt Ltd",
      email: "bulk@test.example",
      phone: "9876501234",
      products: [{ name: "Solar panels", quantity: 200 }],
      deliveryLocation: "Vellore, Tamil Nadu",
    });
    assert.equal(created.status, 201);
    const admin = client();
    await admin("POST", "/admin/auth/login", { email: adminEmail, password: adminPassword });
    const list = await admin("GET", "/admin/bulk-enquiries?status=new");
    const enquiry = list.body.data.items.find((item: { enquiryNumber: string }) => item.enquiryNumber === created.body.data.enquiryNumber);
    assert.ok(enquiry);
    const quoted = await admin("POST", `/admin/bulk-enquiries/${enquiry.id}/quotations`, {
      items: [{ name: "Solar panel 540 W", quantity: 200, unitPrice: 12000, taxRate: 12 }],
      validUntil: new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10),
      status: "sent",
    });
    assert.equal(quoted.body.data.status, "quotation_sent");
    assert.equal(quoted.body.data.quotations[0].total, 2688000);

    const dashboard = await admin("GET", "/admin/dashboard");
    assert.equal(dashboard.status, 200);
    assert.ok(dashboard.body.data.metrics.totalOrders > 0);
    const report = await admin("GET", "/admin/reports/orders");
    assert.equal(report.status, 200);
    const csv = await app.inject({ method: "GET", url: "/api/ecommerce/admin/reports/sales?format=csv", headers: { cookie: "" } });
    assert.equal(csv.statusCode, 401, "exports require a session");
  });
});
