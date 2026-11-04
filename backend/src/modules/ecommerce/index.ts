/**
 * E-commerce module — mounted at /api/ecommerce by routes/index.ts.
 *
 * Self-contained: it has its own routes, services and tables (ecom_*), and shares only the customers/admins
 * identity tables and the API conventions (response envelope, AppError, JSON Schema validation) with the warranty
 * routes. Warranty routes keep using their mock repositories and are not affected by anything here.
 */
import type { FastifyPluginAsync } from "fastify";
import { env } from "../../config/env.js";
import { isDatabaseConfigured } from "../../config/database.js";
import { closePool } from "../../db/pool.js";
import { ForbiddenError } from "../../utils/errors.js";
import { adminMiscRoutes } from "./admin/admin.routes.js";
import { adminAuthRoutes, authRoutes } from "./auth/auth.routes.js";
import { adminBulkEnquiryRoutes, bulkEnquiryRoutes } from "./bulk-enquiries/bulk-enquiries.routes.js";
import { cartRoutes } from "./cart/cart.routes.js";
import { adminCategoryRoutes, categoryRoutes } from "./categories/categories.routes.js";
import { adminContentRoutes, contentRoutes } from "./content/content.routes.js";
import { adminCouponRoutes } from "./coupons/coupons.routes.js";
import { accountRoutes, adminCustomerRoutes, supportRoutes } from "./customers/customers.routes.js";
import { adminInventoryRoutes } from "./inventory/inventory.routes.js";
import { releaseExpiredReservations } from "./orders/order-lifecycle.js";
import { adminOrderRoutes, checkoutRoutes, orderRoutes } from "./orders/orders.routes.js";
import { adminPaymentRoutes, paymentRoutes, paymentWebhookRoutes } from "./payments/payments.routes.js";
import { adminProductRoutes, brandRoutes, productRoutes } from "./products/products.routes.js";
import { requireAdmin } from "./shared/auth.js";
import { ecomConfig } from "./shared/config.js";

/** Header the storefront and admin send on every state-changing request (see their api clients). */
export const CSRF_HEADER = "x-olitec-client";

export const ecommerceModule: FastifyPluginAsync = async (app) => {
  /*
   * CSRF defence for cookie-authenticated writes:
   *   1. a custom header is required — browsers cannot add it cross-site without a CORS preflight, which only the
   *      allowed origins pass; and
   *   2. when the browser sends Origin, it must be one of CORS_ORIGINS.
   * Gateway webhooks are exempt: they carry no cookies and are authenticated by signature.
   */
  app.addHook("onRequest", async (request) => {
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
    if (request.url.startsWith("/api/ecommerce/payments/webhooks/")) return;
    const origin = request.headers.origin;
    if (origin && !env.corsOrigins.includes(origin)) throw new ForbiddenError("Request origin not allowed.");
    if (!request.headers[CSRF_HEADER]) throw new ForbiddenError("Missing request header.");
  });

  // Storefront
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(productRoutes, { prefix: "/products" });
  await app.register(brandRoutes, { prefix: "/brands" });
  await app.register(categoryRoutes, { prefix: "/categories" });
  await app.register(cartRoutes, { prefix: "/cart" });
  await app.register(checkoutRoutes, { prefix: "/checkout" });
  await app.register(orderRoutes, { prefix: "/orders" });
  await app.register(paymentRoutes, { prefix: "/payments" });
  await app.register(paymentWebhookRoutes, { prefix: "/payments/webhooks" });
  await app.register(accountRoutes, { prefix: "/account" });
  await app.register(supportRoutes, { prefix: "/support" });
  await app.register(bulkEnquiryRoutes, { prefix: "/bulk-enquiries" });
  await app.register(contentRoutes);

  // Admin — every route checks its permission server-side (requireAdmin).
  await app.register(
    async (admin) => {
      admin.addHook("onSend", async (_request, reply) => {
        reply.header("cache-control", "no-store");
        reply.header("x-robots-tag", "noindex");
      });
      // Authenticate before body validation, so anonymous callers get 401 (not schema details) on every admin route.
      // Each route still checks its own permission in preHandler.
      const signInRoutes = ["/login", "/logout", "/forgot-password", "/reset-password"].map((path) => `/api/ecommerce/admin/auth${path}`);
      admin.addHook("preValidation", async (request, reply) => {
        if (signInRoutes.includes(request.url.split("?")[0])) return;
        await requireAdmin().call(admin, request, reply);
      });
      await admin.register(adminAuthRoutes, { prefix: "/auth" });
      await admin.register(adminProductRoutes);
      await admin.register(adminCategoryRoutes, { prefix: "/categories" });
      await admin.register(adminInventoryRoutes, { prefix: "/inventory" });
      await admin.register(adminOrderRoutes, { prefix: "/orders" });
      await admin.register(adminPaymentRoutes);
      await admin.register(adminCustomerRoutes);
      await admin.register(adminCouponRoutes, { prefix: "/coupons" });
      await admin.register(adminBulkEnquiryRoutes, { prefix: "/bulk-enquiries" });
      await admin.register(adminContentRoutes);
      await admin.register(adminMiscRoutes);
    },
    { prefix: "/admin" },
  );

  // Release stock held by checkouts that were never paid.
  let timer: NodeJS.Timeout | undefined;
  app.addHook("onReady", async () => {
    if (!isDatabaseConfigured() || ecomConfig.reservationSweepMs <= 0) {
      if (!isDatabaseConfigured()) app.log.warn("E-commerce: DB_USER/DB_PASSWORD not set — /api/ecommerce routes will respond 503 until configured.");
      return;
    }
    timer = setInterval(() => {
      releaseExpiredReservations()
        .then((count) => count && app.log.info({ count }, "Released expired checkout reservations"))
        .catch((error) => app.log.error({ err: error }, "Reservation sweep failed"));
    }, ecomConfig.reservationSweepMs);
    timer.unref();
  });
  app.addHook("onClose", async () => {
    if (timer) clearInterval(timer);
    await closePool();
  });
};
