/**
 * Printable tax invoice (HTML; customers and staff use the browser's "Save as PDF").
 * Seller details come from Settings → Store. Amounts come from the order snapshot, never from current product data.
 * Every interpolated value is HTML-escaped.
 */
import { escapeHtml as e, json } from "../shared/http.js";
import { getSettings } from "../shared/settings.js";
import { orderItems, type OrderRow } from "./orders.repository.js";

const inr = (value: number) => `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function address(value: unknown): string {
  const a = json<Record<string, string>>(value, {});
  return [a.fullName, a.line1, a.line2, `${a.city ?? ""}, ${a.state ?? ""} ${a.pincode ?? ""}`, a.phone ? `Phone: ${a.phone}` : ""]
    .filter(Boolean)
    .map(e)
    .join("<br>");
}

export async function renderInvoice(order: OrderRow): Promise<string> {
  const { store } = await getSettings();
  const items = await orderItems(order.id);
  const paid = ["paid", "partially_refunded", "refunded", "refund_pending"].includes(order.payment_status);
  const rows = items
    .map((item, index) => {
      const taxable = item.lineTotal / (1 + item.taxRate / 100);
      return `<tr><td>${index + 1}</td><td>${e(item.name)}<div class="muted">SKU ${e(item.sku)}${item.hsnCode ? ` · HSN ${e(item.hsnCode)}` : ""}</div></td>
        <td class="num">${item.quantity}</td><td class="num">${inr(item.unitPrice)}</td><td class="num">${inr(taxable)}</td>
        <td class="num">${item.taxRate}%</td><td class="num">${inr(item.lineTotal - taxable)}</td><td class="num">${inr(item.lineTotal)}</td></tr>`;
    })
    .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<title>Invoice ${e(order.order_number)}</title>
<style>
  body{font:14px/1.5 system-ui,sans-serif;color:#1e293b;margin:0;padding:32px;background:#fff}
  .wrap{max-width:900px;margin:0 auto} h1{font-size:22px;margin:0} .muted{color:#64748b;font-size:12px}
  .head{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #f99f1e;padding-bottom:16px;margin-bottom:16px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:16px 0}
  table{width:100%;border-collapse:collapse;margin-top:8px} th,td{border-bottom:1px solid #e2e8f0;padding:8px;text-align:left;vertical-align:top}
  th{background:#f8fafc;font-size:12px;text-transform:uppercase;color:#475569} .num{text-align:right;white-space:nowrap}
  .totals{margin-left:auto;width:320px;margin-top:12px} .totals td{border:none;padding:4px 8px} .grand td{font-weight:700;border-top:2px solid #1e293b}
  .badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;background:${paid ? "#dcfce7;color:#166534" : "#fef3c7;color:#92400e"}}
  .print{margin:24px 0;text-align:right} @media print{.print{display:none} body{padding:0}}
</style></head><body><div class="wrap">
<div class="print"><button onclick="window.print()">Print / Save as PDF</button></div>
<div class="head"><div><h1>${e(store.legalName || store.name)}</h1>
  <div class="muted">${e(store.address)}</div>${store.gstin ? `<div class="muted">GSTIN: ${e(store.gstin)}</div>` : ""}
  ${store.supportEmail ? `<div class="muted">${e(store.supportEmail)}${store.supportPhone ? ` · ${e(store.supportPhone)}` : ""}</div>` : ""}</div>
  <div style="text-align:right"><h1>Tax Invoice</h1><div>Order <strong>${e(order.order_number)}</strong></div>
  <div class="muted">Date: ${new Date(order.placed_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</div>
  <div class="badge">${paid ? "Paid" : order.payment_method === "cod" ? "Cash on Delivery" : "Payment pending"}</div></div></div>
<div class="grid"><div><strong>Bill to</strong><div>${address(order.billing_address)}</div>${order.billing_gstin ? `<div>GSTIN: ${e(order.billing_gstin)}</div>` : ""}</div>
  <div><strong>Ship to</strong><div>${address(order.shipping_address)}</div></div></div>
<table><thead><tr><th>#</th><th>Item</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Taxable</th><th class="num">GST</th><th class="num">GST amt</th><th class="num">Total</th></tr></thead>
<tbody>${rows}</tbody></table>
<table class="totals"><tbody>
  <tr><td>Subtotal (incl. GST)</td><td class="num">${inr(order.subtotal)}</td></tr>
  ${Number(order.discount_total) > 0 ? `<tr><td>Discount${order.coupon_code ? ` (${e(order.coupon_code)})` : ""}</td><td class="num">−${inr(order.discount_total)}</td></tr>` : ""}
  <tr><td>Shipping</td><td class="num">${Number(order.shipping_total) > 0 ? inr(order.shipping_total) : "Free"}</td></tr>
  <tr><td>GST included</td><td class="num">${inr(order.tax_total)}</td></tr>
  <tr class="grand"><td>Grand total</td><td class="num">${inr(order.grand_total)}</td></tr>
</tbody></table>
<p class="muted">This is a computer-generated invoice.${store.gstin ? "" : " Seller GSTIN not configured."}</p>
</div></body></html>`;
}
