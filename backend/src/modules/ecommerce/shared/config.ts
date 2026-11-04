/** E-commerce settings from environment variables. Secrets are read here only and never sent to clients. */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../../../config/env.js";

function toInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const paymentProvider = (process.env.PAYMENT_PROVIDER ?? (env.isProduction ? "razorpay" : "mock")) as "razorpay" | "mock";

if (env.isProduction && paymentProvider === "mock") {
  throw new Error("PAYMENT_PROVIDER=mock is not allowed when NODE_ENV=production.");
}

export const ecomConfig = {
  /** Public storefront URL, used in password-reset links and invoices. */
  siteUrl: process.env.ECOM_SITE_URL ?? "http://localhost:3002",
  mediaDir: path.resolve(backendRoot, process.env.ECOM_MEDIA_DIR ?? "uploads/ecommerce"),
  /** Public base URL under which uploaded images are served. */
  mediaBaseUrl: process.env.ECOM_MEDIA_BASE_URL ?? `http://localhost:${env.port}/api/ecommerce/media`,
  maxUploadBytes: 5 * 1024 * 1024,

  customerSessionDays: toInt(process.env.ECOM_CUSTOMER_SESSION_DAYS, 7),
  adminSessionHours: toInt(process.env.ECOM_ADMIN_SESSION_HOURS, 12),
  cookieSecure: (process.env.COOKIE_SECURE ?? (env.isProduction ? "true" : "false")) === "true",
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,

  payment: {
    provider: paymentProvider,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
    razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
  },

  /** How often expired checkout reservations are released (ms). 0 disables the background sweep. */
  reservationSweepMs: toInt(process.env.ECOM_RESERVATION_SWEEP_MS, 60_000),
} as const;

export const COOKIE = {
  customer: "ecom_session",
  admin: "ecom_admin_session",
  cart: "ecom_cart",
} as const;
