import type { FastifyRequest } from "fastify";
import { execute, query, queryOne, withTransaction } from "../../../db/pool.js";
import { BusinessRuleError, NotFoundError } from "../../../utils/errors.js";
import { audit } from "../shared/audit.js";
import { escapeHtml as e, json, pageWindow, round2, type PageQuery } from "../shared/http.js";
import { nextNumber } from "../shared/sequences.js";
import { getSettings } from "../shared/settings.js";

export const ENQUIRY_STATUSES = ["new", "contacted", "quotation_sent", "negotiation", "converted", "closed"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export interface EnquiryInput {
  contactName: string;
  companyName?: string;
  email: string;
  phone: string;
  products: { productId?: number; name: string; quantity: number }[];
  deliveryLocation: string;
  gstin?: string;
  requirements?: string;
}

export interface QuotationInput {
  items: { productId?: number; name: string; sku?: string; quantity: number; unitPrice: number; taxRate: number }[];
  shippingTotal?: number;
  validUntil: string;
  terms?: string;
  status?: "draft" | "sent";
}

function quotationTotals(input: QuotationInput) {
  // Quotation unit prices are entered before GST, as is usual for B2B quotes.
  const subtotal = round2(input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  const tax = round2(input.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity * item.taxRate) / 100, 0));
  const shipping = round2(input.shippingTotal ?? 0);
  return { subtotal, tax, shipping, total: round2(subtotal + tax + shipping) };
}

export const bulkEnquiryService = {
  async create(request: FastifyRequest, input: EnquiryInput) {
    const enquiryNumber = await nextNumber("enquiry");
    await execute(
      `INSERT INTO ecom_bulk_enquiries (enquiry_number, customer_id, contact_name, company_name, email, phone, products, delivery_location, gstin, requirements)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        enquiryNumber, request.ecomCustomer?.id ?? null, input.contactName, input.companyName ?? null, input.email.toLowerCase(), input.phone,
        JSON.stringify(input.products), input.deliveryLocation, input.gstin ?? null, input.requirements ?? null,
      ],
    );
    return { enquiryNumber };
  },

  async adminList(filters: { status?: EnquiryStatus; q?: string; assignedToMe?: boolean } & PageQuery, adminId: number) {
    const where = ["TRUE"];
    const params: unknown[] = [];
    if (filters.status) {
      where.push("e.status = ?");
      params.push(filters.status);
    }
    if (filters.q) {
      where.push("(e.enquiry_number LIKE ? OR e.contact_name LIKE ? OR e.company_name LIKE ? OR e.email LIKE ? OR e.phone LIKE ?)");
      params.push(...Array(5).fill(`%${filters.q}%`));
    }
    if (filters.assignedToMe) {
      where.push("e.assigned_admin_id = ?");
      params.push(adminId);
    }
    const window = pageWindow(filters);
    const [rows, count, counts] = await Promise.all([
      query(
        `SELECT e.*, a.name AS assigned_name FROM ecom_bulk_enquiries e LEFT JOIN admins a ON a.id = e.assigned_admin_id
          WHERE ${where.join(" AND ")} ORDER BY e.id DESC LIMIT ? OFFSET ?`,
        [...params, window.limit, window.offset],
      ),
      queryOne<{ total: number }>(`SELECT COUNT(*) AS total FROM ecom_bulk_enquiries e WHERE ${where.join(" AND ")}`, params),
      query<{ status: string; count: number }>("SELECT status, COUNT(*) AS count FROM ecom_bulk_enquiries GROUP BY status"),
    ]);
    return {
      items: rows.map((row) => ({
        id: Number(row.id),
        enquiryNumber: row.enquiry_number,
        contactName: row.contact_name,
        companyName: row.company_name,
        email: row.email,
        phone: row.phone,
        products: json<EnquiryInput["products"]>(row.products, []),
        deliveryLocation: row.delivery_location,
        status: row.status,
        assignedTo: row.assigned_name,
        createdAt: row.created_at,
      })),
      counts: Object.fromEntries(ENQUIRY_STATUSES.map((status) => [status, Number(counts.find((row) => row.status === status)?.count ?? 0)])),
      meta: window.meta(Number(count?.total ?? 0)),
    };
  },

  async adminGet(id: number) {
    const row = await queryOne(
      `SELECT e.*, a.name AS assigned_name, o.order_number AS converted_order_number FROM ecom_bulk_enquiries e
         LEFT JOIN admins a ON a.id = e.assigned_admin_id LEFT JOIN ecom_orders o ON o.id = e.converted_order_id WHERE e.id = ?`,
      [id],
    );
    if (!row) throw new NotFoundError("Enquiry");
    const [notes, quotations] = await Promise.all([
      query("SELECT n.id, n.note, n.created_at, a.name AS admin_name FROM ecom_enquiry_notes n LEFT JOIN admins a ON a.id = n.admin_id WHERE n.enquiry_id = ? ORDER BY n.id DESC", [id]),
      query("SELECT q.*, a.name AS created_by_name FROM ecom_quotations q LEFT JOIN admins a ON a.id = q.created_by WHERE q.enquiry_id = ? ORDER BY q.id DESC", [id]),
    ]);
    return {
      id: Number(row.id),
      enquiryNumber: row.enquiry_number,
      customerId: row.customer_id ? Number(row.customer_id) : null,
      contactName: row.contact_name,
      companyName: row.company_name,
      email: row.email,
      phone: row.phone,
      products: json<EnquiryInput["products"]>(row.products, []),
      deliveryLocation: row.delivery_location,
      gstin: row.gstin,
      requirements: row.requirements,
      status: row.status,
      assignedAdminId: row.assigned_admin_id ? Number(row.assigned_admin_id) : null,
      assignedTo: row.assigned_name,
      convertedOrderNumber: row.converted_order_number,
      createdAt: row.created_at,
      notes: notes.map((note) => ({ id: Number(note.id), note: note.note, adminName: note.admin_name, createdAt: note.created_at })),
      quotations: quotations.map((quote) => ({
        id: Number(quote.id),
        quotationNumber: quote.quotation_number,
        items: json<QuotationInput["items"]>(quote.items, []),
        subtotal: Number(quote.subtotal),
        tax: Number(quote.tax_total),
        shipping: Number(quote.shipping_total),
        total: Number(quote.grand_total),
        validUntil: quote.valid_until,
        terms: quote.terms,
        status: quote.status,
        createdBy: quote.created_by_name,
        createdAt: quote.created_at,
      })),
    };
  },

  async adminUpdate(request: FastifyRequest, id: number, input: { status?: EnquiryStatus; assignedAdminId?: number | null; convertedOrderNumber?: string }) {
    let convertedOrderId: number | null | undefined;
    if (input.convertedOrderNumber) {
      const order = await queryOne<{ id: number }>("SELECT id FROM ecom_orders WHERE order_number = ?", [input.convertedOrderNumber]);
      if (!order) throw new BusinessRuleError("No order exists with that number.");
      convertedOrderId = Number(order.id);
    }
    const result = await execute(
      `UPDATE ecom_bulk_enquiries SET status = COALESCE(?, status),
              assigned_admin_id = IF(?, ?, assigned_admin_id), converted_order_id = COALESCE(?, converted_order_id) WHERE id = ?`,
      [input.status ?? (convertedOrderId ? "converted" : null), input.assignedAdminId !== undefined, input.assignedAdminId ?? null, convertedOrderId ?? null, id],
    );
    if (!result.affectedRows) throw new NotFoundError("Enquiry");
    await audit(request, "enquiry.update", "enquiry", id, input);
    return this.adminGet(id);
  },

  async addNote(request: FastifyRequest, id: number, note: string) {
    if (!(await queryOne("SELECT 1 FROM ecom_bulk_enquiries WHERE id = ?", [id]))) throw new NotFoundError("Enquiry");
    await execute("INSERT INTO ecom_enquiry_notes (enquiry_id, admin_id, note) VALUES (?, ?, ?)", [id, request.ecomAdmin!.id, note]);
    return this.adminGet(id);
  },

  async createQuotation(request: FastifyRequest, id: number, input: QuotationInput) {
    if (new Date(input.validUntil).getTime() < Date.now() - 86400_000) throw new BusinessRuleError("The validity date must be in the future.");
    const totals = quotationTotals(input);
    await withTransaction(async (db) => {
      const enquiry = await queryOne<{ status: string }>("SELECT status FROM ecom_bulk_enquiries WHERE id = ? FOR UPDATE", [id], db);
      if (!enquiry) throw new NotFoundError("Enquiry");
      const number = await nextNumber("quotation", db);
      await execute(
        `INSERT INTO ecom_quotations (quotation_number, enquiry_id, items, subtotal, tax_total, shipping_total, grand_total, valid_until, terms, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [number, id, JSON.stringify(input.items), totals.subtotal, totals.tax, totals.shipping, totals.total, input.validUntil, input.terms ?? null, input.status ?? "draft", request.ecomAdmin!.id],
        db,
      );
      if (input.status === "sent" && ["new", "contacted"].includes(enquiry.status)) await execute("UPDATE ecom_bulk_enquiries SET status = 'quotation_sent' WHERE id = ?", [id], db);
      await audit(request, "quotation.create", "enquiry", id, { number, total: totals.total }, db);
    });
    return this.adminGet(id);
  },

  async setQuotationStatus(request: FastifyRequest, quotationId: number, status: "draft" | "sent" | "accepted" | "rejected" | "expired") {
    const quote = await queryOne<{ enquiry_id: number }>("SELECT enquiry_id FROM ecom_quotations WHERE id = ?", [quotationId]);
    if (!quote) throw new NotFoundError("Quotation");
    await execute("UPDATE ecom_quotations SET status = ? WHERE id = ?", [status, quotationId]);
    if (status === "sent") await execute("UPDATE ecom_bulk_enquiries SET status = 'quotation_sent' WHERE id = ? AND status IN ('new', 'contacted')", [quote.enquiry_id]);
    await audit(request, "quotation.status", "quotation", quotationId, { status });
    return this.adminGet(Number(quote.enquiry_id));
  },

  /** Printable quotation (HTML → browser "Save as PDF"). */
  async renderQuotation(quotationId: number) {
    const quote = await queryOne("SELECT q.*, e.* , q.status AS quote_status FROM ecom_quotations q JOIN ecom_bulk_enquiries e ON e.id = q.enquiry_id WHERE q.id = ?", [quotationId]);
    if (!quote) throw new NotFoundError("Quotation");
    const { store } = await getSettings();
    const inr = (value: number) => `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const items = json<QuotationInput["items"]>(quote.items, []);
    const rows = items
      .map((item, index) => `<tr><td>${index + 1}</td><td>${e(item.name)}${item.sku ? `<div class="muted">SKU ${e(item.sku)}</div>` : ""}</td><td class="num">${item.quantity}</td>
        <td class="num">${inr(item.unitPrice)}</td><td class="num">${item.taxRate}%</td><td class="num">${inr(item.unitPrice * item.quantity * (1 + item.taxRate / 100))}</td></tr>`)
      .join("");
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Quotation ${e(quote.quotation_number)}</title>
<style>body{font:14px/1.5 system-ui,sans-serif;color:#1e293b;padding:32px;margin:0}.wrap{max-width:900px;margin:0 auto}.muted{color:#64748b;font-size:12px}
h1{font-size:22px;margin:0}.head{display:flex;justify-content:space-between;border-bottom:2px solid #f99f1e;padding-bottom:16px;margin-bottom:16px}
table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #e2e8f0;padding:8px;text-align:left}th{background:#f8fafc;font-size:12px;text-transform:uppercase}
.num{text-align:right}.totals{width:320px;margin-left:auto}.totals td{border:none;padding:4px 8px}.print{text-align:right;margin-bottom:16px}@media print{.print{display:none}}</style></head>
<body><div class="wrap"><div class="print"><button onclick="window.print()">Print / Save as PDF</button></div>
<div class="head"><div><h1>${e(store.legalName || store.name)}</h1><div class="muted">${e(store.address)}</div>${store.gstin ? `<div class="muted">GSTIN ${e(store.gstin)}</div>` : ""}</div>
<div style="text-align:right"><h1>Quotation</h1><div><strong>${e(quote.quotation_number)}</strong></div><div class="muted">Enquiry ${e(quote.enquiry_number)}</div>
<div class="muted">Valid until ${new Date(quote.valid_until).toLocaleDateString("en-IN", { dateStyle: "medium" })}</div></div></div>
<p><strong>For:</strong> ${e(quote.company_name ?? quote.contact_name)}<br>${e(quote.contact_name)} · ${e(quote.email)} · ${e(quote.phone)}<br>Delivery: ${e(quote.delivery_location)}${quote.gstin ? `<br>GSTIN ${e(quote.gstin)}` : ""}</p>
<table><thead><tr><th>#</th><th>Item</th><th class="num">Qty</th><th class="num">Unit price (excl. GST)</th><th class="num">GST</th><th class="num">Amount</th></tr></thead><tbody>${rows}</tbody></table>
<table class="totals"><tr><td>Subtotal</td><td class="num">${inr(quote.subtotal)}</td></tr><tr><td>GST</td><td class="num">${inr(quote.tax_total)}</td></tr>
<tr><td>Shipping</td><td class="num">${inr(quote.shipping_total)}</td></tr><tr><td><strong>Total</strong></td><td class="num"><strong>${inr(quote.grand_total)}</strong></td></tr></table>
${quote.terms ? `<h3>Terms</h3><p style="white-space:pre-line">${e(quote.terms)}</p>` : ""}</div></body></html>`;
  },
};
