// A fixed time zone keeps server-rendered and client-rendered dates identical.
const dateFormatter = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});
const currencyFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

export function formatInr(value: number): string {
  return currencyFormatter.format(value);
}

export function formatWarrantyPeriod(months: number): string {
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} year${years > 1 ? "s" : ""}`;
  }
  return `${months} months`;
}

export function formatMobile(mobile: string): string {
  return mobile.length === 10 ? `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}` : mobile;
}

/** Whole days from `from` until `to` (negative if `to` is in the past). */
export function daysBetween(from: Date, to: string): number {
  const ms = new Date(to).getTime() - from.getTime();
  return Math.ceil(ms / 86_400_000);
}
