const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2, minimumFractionDigits: 0 });

export function formatPrice(value: number): string {
  return inr.format(value);
}

export function formatDate(value: string | Date, withTime = false): string {
  return new Date(value).toLocaleString("en-IN", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Paragraphs from plain text (CMS pages are stored as text and always rendered as text, never as HTML). */
export function paragraphs(text: string | null | undefined): string[] {
  return (text ?? "").split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  failed: "Payment failed",
  cod_pending: "Pay on delivery",
  refund_pending: "Refund in progress",
  partially_refunded: "Partially refunded",
  refunded: "Refunded",
};

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002").replace(/\/$/, "");
