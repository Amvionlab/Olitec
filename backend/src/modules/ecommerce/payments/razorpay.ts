/**
 * Minimal Razorpay REST client (orders, payments, refunds) and signature checks.
 * Docs: https://razorpay.com/docs/api/ — key secret and webhook secret never leave the backend.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError } from "../../../utils/errors.js";
import { ecomConfig } from "../shared/config.js";

const API = "https://api.razorpay.com/v1";

export class PaymentGatewayError extends AppError {
  constructor(message: string, details?: unknown) {
    super(502, "PAYMENT_GATEWAY_ERROR", message, details);
  }
}

function assertConfigured() {
  const { razorpayKeyId, razorpayKeySecret } = ecomConfig.payment;
  if (!razorpayKeyId || !razorpayKeySecret) throw new AppError(503, "PAYMENTS_NOT_CONFIGURED", "Online payments are not configured yet.");
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  assertConfigured();
  const { razorpayKeyId, razorpayKeySecret } = ecomConfig.payment;
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      authorization: `Basic ${Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64")}`,
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: { code?: string; description?: string } };
  if (!response.ok) throw new PaymentGatewayError(data.error?.description ?? "The payment gateway did not accept the request.", { code: data.error?.code, status: response.status });
  return data;
}

export interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method?: string;
  error_code?: string | null;
  error_description?: string | null;
}

export const razorpay = {
  createOrder: (amountPaise: number, receipt: string, notes: Record<string, string>) =>
    call<{ id: string; amount: number; currency: string; status: string }>("POST", "/orders", { amount: amountPaise, currency: "INR", receipt, notes, payment_capture: 1 }),

  fetchPayment: (paymentId: string) => call<RazorpayPayment>("GET", `/payments/${encodeURIComponent(paymentId)}`),

  capture: (paymentId: string, amountPaise: number) => call<RazorpayPayment>("POST", `/payments/${encodeURIComponent(paymentId)}/capture`, { amount: amountPaise, currency: "INR" }),

  refund: (paymentId: string, amountPaise: number, receipt: string) =>
    call<{ id: string; status: "pending" | "processed" | "failed"; amount: number }>("POST", `/payments/${encodeURIComponent(paymentId)}/refund`, {
      amount: amountPaise,
      receipt,
      speed: "normal",
    }),
};

function safeEqualHex(expected: string, actual: string): boolean {
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(actual, "hex");
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

/** Checkout callback signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  assertConfigured();
  const expected = createHmac("sha256", ecomConfig.payment.razorpayKeySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return /^[a-f0-9]{64}$/i.test(signature) && safeEqualHex(expected, signature.toLowerCase());
}

/** Webhook signature: HMAC_SHA256(raw request body, webhook secret) in the X-Razorpay-Signature header. */
export function verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
  const secret = ecomConfig.payment.razorpayWebhookSecret;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return /^[a-f0-9]{64}$/i.test(signature) && safeEqualHex(expected, signature.toLowerCase());
}

export const toPaise = (rupees: number) => Math.round(rupees * 100);
