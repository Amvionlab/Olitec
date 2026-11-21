import { execute, query, queryOne } from "../db/pool.js";
import { repositories } from "../repositories/index.js";
import type { ListCustomersQuery, ListWarrantiesQuery } from "../schemas/admin.schema.js";
import { BusinessRuleError, NotFoundError } from "../utils/errors.js";

type Row = Record<string, any>;

function rowId(id: string | number): number {
  if (typeof id === "number") return id;
  const value = Number(id.replace(/^[a-z]+_/, ""));
  return Number.isSafeInteger(value) ? value : 0;
}

const iso = (value: Date | string | null): string | null => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

const isoDate = (value: Date | string | null): string | null => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

export const adminService = {
  async getDashboard() {
    return adminService.getAnalytics();
  },

  async getAnalytics() {
    // Total & status counts from warranties
    const statusRows = await query<Row>(
      "SELECT status, COUNT(*) AS total FROM warranties GROUP BY status",
    );
    const byStatus: Record<string, number> = {
      pending: 0,
      active: 0,
      expired: 0,
      rejected: 0,
    };
    let totalWarranties = 0;
    for (const row of statusRows) {
      const s = String(row.status).toLowerCase();
      const count = Number(row.total);
      byStatus[s] = count;
      totalWarranties += count;
    }

    // Total Users
    const userRow = await queryOne<Row>(
      "SELECT COUNT(*) AS total_users, SUM(role = 'customer') AS customers, SUM(role = 'admin') AS admins FROM users",
    );

    // Total Products
    const productRow = await queryOne<Row>(
      "SELECT COUNT(*) AS total_products, SUM(is_active = TRUE) AS active_products FROM products",
    );

    // Monthly Trends (last 6-12 months)
    const monthlyRows = await query<Row>(
      `SELECT DATE_FORMAT(submitted_at, '%b %Y') AS month_label,
              DATE_FORMAT(submitted_at, '%Y-%m') AS month_key,
              COUNT(*) AS count
       FROM warranties
       GROUP BY month_key, month_label
       ORDER BY month_key ASC
       LIMIT 12`,
    );

    // Top Products in Warranty
    const topProducts = await query<Row>(
      `SELECT product_model, COUNT(*) AS count
       FROM warranties
       GROUP BY product_model
       ORDER BY count DESC
       LIMIT 5`,
    );

    // Recent Registrations
    const recentRegistrations = await query<Row>(
      `SELECT id, warranty_number, customer_name, product_model, serial_number, status, submitted_at
       FROM warranties
       ORDER BY submitted_at DESC, id DESC
       LIMIT 5`,
    );

    return {
      totalWarranties,
      activeWarranties: byStatus.active || 0,
      pendingWarranties: byStatus.pending || 0,
      rejectedWarranties: byStatus.rejected || 0,
      expiredWarranties: byStatus.expired || 0,
      totalUsers: Number(userRow?.total_users ?? 0),
      totalCustomers: Number(userRow?.customers ?? 0),
      totalAdmins: Number(userRow?.admins ?? 0),
      totalProducts: Number(productRow?.total_products ?? 0),
      activeProducts: Number(productRow?.active_products ?? 0),
      monthlyTrends: monthlyRows.map((r) => ({
        month: r.month_label,
        count: Number(r.count),
      })),
      topProducts: topProducts.map((r) => ({
        model: r.product_model,
        count: Number(r.count),
      })),
      recentRegistrations: recentRegistrations.map((r) => ({
        id: `war_${r.id}`,
        warrantyNumber: r.warranty_number,
        customerName: r.customer_name,
        productModel: r.product_model,
        serialNumber: r.serial_number,
        status: r.status,
        submittedAt: iso(r.submitted_at),
      })),
    };
  },

  async listUsers(queryInput: { q?: string; role?: string; status?: string; page?: number; limit?: number; pageSize?: number }) {
    const page = Math.max(1, Number(queryInput.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(queryInput.pageSize ?? queryInput.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (queryInput.role) {
      conditions.push("u.role = ?");
      params.push(queryInput.role);
    }
    if (queryInput.status) {
      conditions.push("u.status = ?");
      params.push(queryInput.status.toLowerCase());
    }
    if (queryInput.q?.trim()) {
      const q = `%${queryInput.q.trim()}%`;
      conditions.push("(u.name LIKE ? OR u.email LIKE ? OR u.mobile LIKE ?)");
      params.push(q, q, q);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRow = await queryOne<Row>(
      `SELECT COUNT(*) AS total FROM users u ${where}`,
      params,
    );
    const total = Number(countRow?.total ?? 0);

    const rows = await query<Row>(
      `SELECT u.id, u.name, u.email, u.mobile, u.role, u.status,
              u.city, u.state, u.last_login_at, u.created_at,
              (SELECT COUNT(*) FROM warranties w WHERE w.user_id = u.id OR w.email = u.email OR w.mobile = u.mobile) AS warranty_count
       FROM users u
       ${where}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return {
      items: rows.map((r) => ({
        id: `usr_${r.id}`,
        numericId: r.id,
        name: r.name,
        email: r.email,
        mobile: r.mobile,
        role: r.role,
        status: r.status,
        city: r.city ?? "",
        state: r.state ?? "",
        warrantyCount: Number(r.warranty_count ?? 0),
        lastLoginAt: iso(r.last_login_at),
        createdAt: iso(r.created_at)!,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async updateUserStatus(id: string | number, status: "active" | "inactive") {
    const numericId = rowId(id);
    const result = await execute("UPDATE users SET status = ? WHERE id = ?", [status, numericId]);
    if (result.affectedRows === 0) throw new NotFoundError("User");
    return { success: true, message: `User status updated to ${status}` };
  },

  async listCustomers(queryInput: ListCustomersQuery) {
    return repositories.customers.findAll({ q: queryInput.q, status: queryInput.status });
  },

  async getCustomer(id: string) {
    const customer = await repositories.customers.findById(id);
    if (!customer) throw new NotFoundError("Customer");
    const warranties = await repositories.warranties.findAll({ customerId: id });
    return { ...customer, warranties };
  },

  async listWarranties(queryInput: ListWarrantiesQuery) {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (queryInput.status) {
      conditions.push("w.status = ?");
      params.push(queryInput.status.toLowerCase());
    }
    if (queryInput.q?.trim()) {
      const q = `%${queryInput.q.trim()}%`;
      conditions.push("(w.warranty_number LIKE ? OR w.serial_number LIKE ? OR w.customer_name LIKE ? OR w.email LIKE ? OR w.mobile LIKE ?)");
      params.push(q, q, q, q, q);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const page = Math.max(1, Number(queryInput.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(queryInput.pageSize) || 20));
    const offset = (page - 1) * limit;

    const countRow = await queryOne<Row>(`SELECT COUNT(*) AS total FROM warranties w ${where}`, params);
    const total = Number(countRow?.total ?? 0);

    const rows = await query<Row>(
      `SELECT w.*, u.name AS reviewer_name, p.name AS matched_product_name, p.capacity AS matched_capacity, p.price_inr AS matched_mrp, p.warranty_months AS matched_warranty_months
       FROM warranties w
       LEFT JOIN users u ON u.id = w.reviewed_by
       LEFT JOIN products p ON p.id = w.product_id
       ${where}
       ORDER BY w.submitted_at DESC, w.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return {
      items: rows.map((r) => ({
        id: `war_${r.id}`,
        numericId: r.id,
        warrantyNumber: r.warranty_number,
        customerName: r.customer_name,
        email: r.email,
        mobile: r.mobile,
        installationAddress: r.installation_address,
        productModel: r.product_model,
        productName: r.matched_product_name || r.product_model,
        capacity: r.matched_capacity || "",
        mrp: Number(r.matched_mrp || 0),
        warrantyMonths: Number(r.matched_warranty_months || 60),
        serialNumber: r.serial_number,
        purchaseDate: isoDate(r.purchase_date)!,
        installationDate: isoDate(r.installation_date),
        dealerName: r.dealer_name,
        dealerContact: r.dealer_contact,
        invoiceFile: r.invoice_file,
        installationFile: r.installation_file,
        status: r.status,
        startDate: isoDate(r.start_date),
        endDate: isoDate(r.end_date),
        adminRemark: r.admin_remark,
        reviewedBy: r.reviewer_name ?? null,
        reviewedAt: iso(r.reviewed_at),
        submittedAt: iso(r.submitted_at ?? r.created_at)!,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async getWarranty(id: string | number) {
    const numericId = rowId(id);
    const row = await queryOne<Row>(
      `SELECT w.*, u.name AS reviewer_name, p.name AS matched_product_name, p.warranty_months AS matched_warranty_months
       FROM warranties w
       LEFT JOIN users u ON u.id = w.reviewed_by
       LEFT JOIN products p ON p.id = w.product_id
       WHERE w.id = ?`,
      [numericId],
    );
    if (!row) throw new NotFoundError("Warranty");

    return {
      id: `war_${row.id}`,
      numericId: row.id,
      warrantyNumber: row.warranty_number,
      customerName: row.customer_name,
      email: row.email,
      mobile: row.mobile,
      installationAddress: row.installation_address,
      productModel: row.product_model,
      serialNumber: row.serial_number,
      purchaseDate: isoDate(row.purchase_date)!,
      installationDate: isoDate(row.installation_date),
      dealerName: row.dealer_name,
      dealerContact: row.dealer_contact,
      invoiceFile: row.invoice_file,
      installationFile: row.installation_file,
      status: row.status,
      startDate: isoDate(row.start_date),
      endDate: isoDate(row.end_date),
      adminRemark: row.admin_remark,
      reviewedBy: row.reviewer_name ?? null,
      reviewedAt: iso(row.reviewed_at),
      submittedAt: iso(row.submitted_at ?? row.created_at)!,
    };
  },

  async approveWarranty(id: string | number, adminId: number | string, remark?: string) {
    const numericId = rowId(id);
    const numericAdminId = rowId(adminId) || 1;

    const warranty = await queryOne<Row>("SELECT * FROM warranties WHERE id = ?", [numericId]);
    if (!warranty) throw new NotFoundError("Warranty");

    // Fetch product warranty months or default 12
    let months = 12;
    if (warranty.product_id) {
      const prod = await queryOne<Row>("SELECT warranty_months FROM products WHERE id = ?", [warranty.product_id]);
      if (prod?.warranty_months) months = Number(prod.warranty_months);
    }

    const startDate = warranty.purchase_date ? isoDate(warranty.purchase_date) : isoDate(new Date());

    await execute(
      `UPDATE warranties SET
         status = 'active',
         start_date = ?,
         end_date = DATE_ADD(?, INTERVAL ? MONTH),
         admin_remark = ?,
         reviewed_by = ?,
         reviewed_at = NOW()
       WHERE id = ?`,
      [startDate, startDate, months, remark ?? "Approved", numericAdminId, numericId],
    );

    return adminService.getWarranty(numericId);
  },

  async rejectWarranty(id: string | number, adminId: number | string, remark: string) {
    const numericId = rowId(id);
    const numericAdminId = rowId(adminId) || 1;

    const warranty = await queryOne<Row>("SELECT * FROM warranties WHERE id = ?", [numericId]);
    if (!warranty) throw new NotFoundError("Warranty");

    await execute(
      `UPDATE warranties SET
         status = 'rejected',
         admin_remark = ?,
         reviewed_by = ?,
         reviewed_at = NOW()
       WHERE id = ?`,
      [remark, numericAdminId, numericId],
    );

    return adminService.getWarranty(numericId);
  },

  async updateWarrantyStatus(id: string | number, adminId: number | string, status: string, remark?: string) {
    const numericId = rowId(id);
    const numericAdminId = rowId(adminId) || 1;
    const lower = status.toLowerCase();

    if (!["pending", "active", "expired", "rejected"].includes(lower)) {
      throw new BusinessRuleError("Invalid warranty status.");
    }

    if (lower === "active") {
      return adminService.approveWarranty(numericId, numericAdminId, remark);
    }
    if (lower === "rejected") {
      return adminService.rejectWarranty(numericId, numericAdminId, remark || "Rejected");
    }

    await execute(
      `UPDATE warranties SET
         status = ?,
         admin_remark = ?,
         reviewed_by = ?,
         reviewed_at = NOW()
       WHERE id = ?`,
      [lower, remark ?? null, numericAdminId, numericId],
    );

    return adminService.getWarranty(numericId);
  },
};
