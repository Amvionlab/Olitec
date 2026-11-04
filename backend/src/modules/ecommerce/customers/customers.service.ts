import type { FastifyRequest } from "fastify";
import { execute, query, queryOne, withTransaction } from "../../../db/pool.js";
import { BusinessRuleError, NotFoundError } from "../../../utils/errors.js";
import { audit } from "../shared/audit.js";
import { destroyAllSessions } from "../shared/auth.js";
import { pageWindow, type PageQuery } from "../shared/http.js";
import type { AddressInput } from "../shared/schemas.js";
import { nextNumber } from "../shared/sequences.js";
import { toSummary, type ProductRow } from "../products/products.service.js";

interface AddressRow {
  id: number;
  label: string | null;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default_shipping: number;
  is_default_billing: number;
}

const toAddress = (row: AddressRow) => ({
  id: Number(row.id),
  label: row.label,
  fullName: row.full_name,
  phone: row.phone,
  line1: row.line1,
  line2: row.line2,
  city: row.city,
  state: row.state,
  pincode: row.pincode,
  isDefaultShipping: Boolean(row.is_default_shipping),
  isDefaultBilling: Boolean(row.is_default_billing),
});

export type AddressBody = AddressInput & { label?: string; isDefaultShipping?: boolean; isDefaultBilling?: boolean };

const MAX_ADDRESSES = 20;

export const customerService = {
  // ------------------------------------------------------------------ addresses

  async listAddresses(customerId: number) {
    const rows = await query<AddressRow>("SELECT * FROM ecom_addresses WHERE customer_id = ? ORDER BY is_default_shipping DESC, id DESC", [customerId]);
    return rows.map(toAddress);
  },

  async saveAddress(customerId: number, id: number | null, input: AddressBody) {
    await withTransaction(async (db) => {
      if (id && !(await queryOne("SELECT 1 FROM ecom_addresses WHERE id = ? AND customer_id = ?", [id, customerId], db))) throw new NotFoundError("Address");
      if (!id) {
        const count = await queryOne<{ count: number }>("SELECT COUNT(*) AS count FROM ecom_addresses WHERE customer_id = ?", [customerId], db);
        if (Number(count?.count) >= MAX_ADDRESSES) throw new BusinessRuleError(`You can save up to ${MAX_ADDRESSES} addresses.`);
      }
      if (input.isDefaultShipping) await execute("UPDATE ecom_addresses SET is_default_shipping = FALSE WHERE customer_id = ?", [customerId], db);
      if (input.isDefaultBilling) await execute("UPDATE ecom_addresses SET is_default_billing = FALSE WHERE customer_id = ?", [customerId], db);
      const values = [input.label ?? null, input.fullName, input.phone, input.line1, input.line2 ?? null, input.city, input.state, input.pincode, input.isDefaultShipping ?? false, input.isDefaultBilling ?? false];
      if (id) {
        await execute(
          "UPDATE ecom_addresses SET label = ?, full_name = ?, phone = ?, line1 = ?, line2 = ?, city = ?, state = ?, pincode = ?, is_default_shipping = ?, is_default_billing = ? WHERE id = ? AND customer_id = ?",
          [...values, id, customerId],
          db,
        );
      } else {
        await execute(
          "INSERT INTO ecom_addresses (label, full_name, phone, line1, line2, city, state, pincode, is_default_shipping, is_default_billing, customer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [...values, customerId],
          db,
        );
      }
    });
    return this.listAddresses(customerId);
  },

  async deleteAddress(customerId: number, id: number) {
    await execute("DELETE FROM ecom_addresses WHERE id = ? AND customer_id = ?", [id, customerId]);
    return this.listAddresses(customerId);
  },

  // ------------------------------------------------------------------ wishlist

  async wishlist(customerId: number) {
    const rows = await query<ProductRow>(
      `SELECT p.*, (p.stock_qty - p.reserved_qty) AS available, c.name AS category_name, c.slug AS category_slug, b.name AS brand_name, b.slug AS brand_slug,
              (SELECT url FROM ecom_product_images i WHERE i.product_id = p.id ORDER BY i.sort_order, i.id LIMIT 1) AS primary_image
         FROM ecom_wishlist_items w JOIN ecom_products p ON p.id = w.product_id JOIN ecom_categories c ON c.id = p.category_id LEFT JOIN ecom_brands b ON b.id = p.brand_id
        WHERE w.customer_id = ? AND p.status = 'active' ORDER BY w.created_at DESC`,
      [customerId],
    );
    return rows.map(toSummary);
  },

  async wishlistIds(customerId: number) {
    return (await query<{ product_id: number }>("SELECT product_id FROM ecom_wishlist_items WHERE customer_id = ?", [customerId])).map((row) => Number(row.product_id));
  },

  async addToWishlist(customerId: number, productId: number) {
    if (!(await queryOne("SELECT 1 FROM ecom_products WHERE id = ? AND status = 'active'", [productId]))) throw new NotFoundError("Product");
    await execute("INSERT IGNORE INTO ecom_wishlist_items (customer_id, product_id) VALUES (?, ?)", [customerId, productId]);
    return this.wishlistIds(customerId);
  },

  async removeFromWishlist(customerId: number, productId: number) {
    await execute("DELETE FROM ecom_wishlist_items WHERE customer_id = ? AND product_id = ?", [customerId, productId]);
    return this.wishlistIds(customerId);
  },

  // ------------------------------------------------------------------ support tickets

  async createTicket(request: FastifyRequest, input: { name: string; email: string; phone?: string; subject: string; message: string; orderNumber?: string }) {
    const customer = request.ecomCustomer;
    let orderId: number | null = null;
    if (input.orderNumber) {
      const order = await queryOne<{ id: number; customer_id: number | null; contact_email: string }>("SELECT id, customer_id, contact_email FROM ecom_orders WHERE order_number = ?", [input.orderNumber]);
      // Link only orders the requester can prove are theirs (owner, or same email for guests).
      if (order && (customer ? Number(order.customer_id) === customer.id : order.contact_email === input.email.toLowerCase())) orderId = Number(order.id);
    }
    const ticketNumber = await nextNumber("ticket");
    await execute(
      "INSERT INTO ecom_support_tickets (ticket_number, customer_id, order_id, contact_name, contact_email, contact_phone, subject, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [ticketNumber, customer?.id ?? null, orderId, input.name, input.email.toLowerCase(), input.phone ?? null, input.subject, input.message],
    );
    return { ticketNumber };
  },

  async listTickets(customerId: number) {
    const rows = await query(
      `SELECT t.ticket_number, t.subject, t.message, t.status, t.admin_response, t.created_at, t.updated_at, o.order_number
         FROM ecom_support_tickets t LEFT JOIN ecom_orders o ON o.id = t.order_id WHERE t.customer_id = ? ORDER BY t.id DESC`,
      [customerId],
    );
    return rows.map((row) => ({
      ticketNumber: row.ticket_number,
      subject: row.subject,
      message: row.message,
      status: row.status,
      response: row.admin_response,
      orderNumber: row.order_number,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  // ------------------------------------------------------------------ admin

  async adminList(filters: { q?: string; status?: "active" | "inactive" } & PageQuery) {
    const where = ["TRUE"];
    const params: unknown[] = [];
    if (filters.q) {
      const q = filters.q.trim();
      const like = `%${q.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
      where.push("(c.name LIKE ? OR c.email LIKE ? OR c.mobile LIKE ? OR c.id = ?)");
      params.push(like, like, like, /^\d+$/.test(q) ? Number(q) : 0);
    }
    if (filters.status) {
      where.push("c.status = ?");
      params.push(filters.status);
    }
    const window = pageWindow(filters);
    const [rows, count] = await Promise.all([
      query(
        `SELECT c.id, c.name, c.email, c.mobile, c.status, c.created_at, c.last_login_at,
                COUNT(o.id) AS orders, COALESCE(SUM(CASE WHEN o.payment_status IN ('paid', 'partially_refunded') THEN o.grand_total END), 0) AS spent,
                MAX(o.placed_at) AS last_order_at
           FROM customers c LEFT JOIN ecom_orders o ON o.customer_id = c.id
          WHERE ${where.join(" AND ")} GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
        [...params, window.limit, window.offset],
      ),
      queryOne<{ total: number }>(`SELECT COUNT(*) AS total FROM customers c WHERE ${where.join(" AND ")}`, params),
    ]);
    return {
      items: rows.map((row) => ({
        id: Number(row.id),
        name: row.name,
        email: row.email,
        mobile: row.mobile,
        status: row.status,
        createdAt: row.created_at,
        lastLoginAt: row.last_login_at,
        orderCount: Number(row.orders),
        totalSpent: Number(row.spent),
        lastOrderAt: row.last_order_at,
      })),
      meta: window.meta(Number(count?.total ?? 0)),
    };
  },

  async adminGet(id: number) {
    const customer = await queryOne("SELECT id, name, email, mobile, status, created_at, last_login_at FROM customers WHERE id = ?", [id]);
    if (!customer) throw new NotFoundError("Customer");
    const [addresses, orders, summary, tickets, shippedTo] = await Promise.all([
      this.listAddresses(id),
      query("SELECT id, order_number, placed_at, status, payment_status, grand_total FROM ecom_orders WHERE customer_id = ? ORDER BY placed_at DESC LIMIT 50", [id]),
      queryOne<{ orders: number; spent: number; avg: number; first: Date | null; last: Date | null }>(
        `SELECT COUNT(*) AS orders, COALESCE(SUM(CASE WHEN payment_status IN ('paid', 'partially_refunded') THEN grand_total END), 0) AS spent,
                COALESCE(AVG(CASE WHEN payment_status IN ('paid', 'partially_refunded') THEN grand_total END), 0) AS avg, MIN(placed_at) AS first, MAX(placed_at) AS last
           FROM ecom_orders WHERE customer_id = ?`,
        [id],
      ),
      query("SELECT id, ticket_number, subject, status, created_at FROM ecom_support_tickets WHERE customer_id = ? ORDER BY id DESC LIMIT 50", [id]),
      query("SELECT DISTINCT JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.city')) AS city, JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.pincode')) AS pincode FROM ecom_orders WHERE customer_id = ? LIMIT 20", [id]),
    ]);
    return {
      id: Number(customer.id),
      name: customer.name,
      email: customer.email,
      mobile: customer.mobile,
      status: customer.status,
      createdAt: customer.created_at,
      lastLoginAt: customer.last_login_at,
      addresses,
      shippingHistory: shippedTo,
      orders: orders.map((row) => ({ id: Number(row.id), orderNumber: row.order_number, placedAt: row.placed_at, status: row.status, paymentStatus: row.payment_status, total: Number(row.grand_total) })),
      summary: {
        orderCount: Number(summary?.orders ?? 0),
        totalSpent: Number(summary?.spent ?? 0),
        averageOrderValue: Math.round(Number(summary?.avg ?? 0) * 100) / 100,
        firstOrderAt: summary?.first ?? null,
        lastOrderAt: summary?.last ?? null,
      },
      tickets: tickets.map((row) => ({ id: Number(row.id), ticketNumber: row.ticket_number, subject: row.subject, status: row.status, createdAt: row.created_at })),
    };
  },

  async adminSetStatus(request: FastifyRequest, id: number, status: "active" | "inactive", reason: string) {
    const result = await execute("UPDATE customers SET status = ? WHERE id = ?", [status, id]);
    if (!result.affectedRows) throw new NotFoundError("Customer");
    if (status === "inactive") await destroyAllSessions("customer", id);
    await audit(request, status === "inactive" ? "customer.suspend" : "customer.activate", "customer", id, { reason });
    return this.adminGet(id);
  },

  async adminTickets(filters: { status?: string; q?: string } & PageQuery) {
    const where = ["TRUE"];
    const params: unknown[] = [];
    if (filters.status) {
      where.push("t.status = ?");
      params.push(filters.status);
    }
    if (filters.q) {
      where.push("(t.ticket_number LIKE ? OR t.contact_email LIKE ? OR t.subject LIKE ?)");
      params.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`);
    }
    const window = pageWindow(filters);
    const [rows, count] = await Promise.all([
      query(
        `SELECT t.*, o.order_number, a.name AS assigned_name FROM ecom_support_tickets t LEFT JOIN ecom_orders o ON o.id = t.order_id LEFT JOIN admins a ON a.id = t.assigned_admin_id
          WHERE ${where.join(" AND ")} ORDER BY FIELD(t.status, 'open', 'in_progress', 'resolved', 'closed'), t.id DESC LIMIT ? OFFSET ?`,
        [...params, window.limit, window.offset],
      ),
      queryOne<{ total: number }>(`SELECT COUNT(*) AS total FROM ecom_support_tickets t WHERE ${where.join(" AND ")}`, params),
    ]);
    return {
      items: rows.map((row) => ({
        id: Number(row.id),
        ticketNumber: row.ticket_number,
        customerId: row.customer_id ? Number(row.customer_id) : null,
        orderId: row.order_id ? Number(row.order_id) : null,
        orderNumber: row.order_number,
        name: row.contact_name,
        email: row.contact_email,
        phone: row.contact_phone,
        subject: row.subject,
        message: row.message,
        status: row.status,
        response: row.admin_response,
        assignedTo: row.assigned_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      meta: window.meta(Number(count?.total ?? 0)),
    };
  },

  async adminUpdateTicket(request: FastifyRequest, id: number, input: { status?: string; response?: string; assignToMe?: boolean }) {
    const result = await execute(
      "UPDATE ecom_support_tickets SET status = COALESCE(?, status), admin_response = COALESCE(?, admin_response), assigned_admin_id = IF(?, ?, assigned_admin_id) WHERE id = ?",
      [input.status ?? null, input.response ?? null, input.assignToMe ?? false, request.ecomAdmin!.id, id],
    );
    if (!result.affectedRows) throw new NotFoundError("Ticket");
    await audit(request, "support.update", "ticket", id, { status: input.status });
    return { id, updated: true };
  },
};
