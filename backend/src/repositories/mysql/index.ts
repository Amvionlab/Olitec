/**
 * MySQL repositories for the warranty platform (Clean schema: products, users, warranties, support_requests).
 * Rows use numeric ids; prefixed string ids ("prd_101", "war_7", "cus_1") are used for API consistency.
 */
import { execute, query, queryOne } from "../../db/pool.js";
import { ConflictError } from "../../utils/errors.js";
import type {
  Customer,
  CustomerRepository,
  Product,
  ProductRepository,
  ServiceRequest,
  ServiceRequestRepository,
  SerialNumberRepository,
  SupportCategory,
  SupportRepository,
  SupportRequest,
  SupportStatus,
  Warranty,
  WarrantyHistoryEntry,
  WarrantyRegistration,
  WarrantyRegistrationRepository,
  WarrantyRepository,
  WarrantyStatus,
} from "../types.js";

type Row = Record<string, any>;

/** "war_42" → 42. Returns 0 for invalid inputs. */
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

const like = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

const warrantyStatuses: Record<string, WarrantyStatus> = {
  pending: "Pending",
  active: "Active",
  expired: "Expired",
  rejected: "Rejected",
  Pending: "Pending",
  Active: "Active",
  Expired: "Expired",
  Rejected: "Rejected",
};

const supportStatuses: Record<string, SupportStatus> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Resolved",
};

const supportCategories: Record<SupportCategory, string> = {
  Installation: "Installation",
  Repair: "Repair",
  "Warranty Claim": "Warranty Claim",
  "General Enquiry": "General Enquiry",
};

function toProduct(row: Row): Product {
  return {
    id: `prd_${row.id}`,
    slug: row.slug,
    name: row.name,
    model: row.model_number,
    category: row.category,
    warrantyMonths: row.warranty_months,
    priceInr: Number(row.price_inr ?? 0),
    description: row.short_description ?? row.description ?? "",
  };
}

function toCustomer(row: Row): Customer {
  return {
    id: `cus_${row.id}`,
    name: row.name,
    email: row.email,
    mobile: row.mobile,
    city: row.city ?? "",
    state: row.state ?? "",
    status: row.status === "active" ? "Active" : "Inactive",
    createdAt: iso(row.created_at)!,
  };
}

function toWarranty(row: Row): Warranty {
  const history: WarrantyHistoryEntry[] = [
    {
      at: iso(row.submitted_at ?? row.created_at)!,
      action: "Registration submitted",
      by: row.customer_name ?? "Customer",
    },
  ];

  if (row.reviewed_at) {
    history.push({
      at: iso(row.reviewed_at)!,
      action: row.status === "active" ? "Approved" : row.status === "rejected" ? "Rejected" : "Status changed",
      by: row.reviewer_name ?? "Admin",
      ...(row.admin_remark ? { remark: row.admin_remark } : {}),
    });
  }

  return {
    id: `war_${row.id}`,
    warrantyNumber: row.warranty_number,
    customerId: row.user_id ? `cus_${row.user_id}` : `cus_0`,
    productId: row.product_id ? `prd_${row.product_id}` : `prd_0`,
    serialNumber: row.serial_number,
    purchaseDate: isoDate(row.purchase_date)!,
    invoiceNumber: row.warranty_number,
    dealerName: row.dealer_name,
    startDate: isoDate(row.start_date),
    endDate: isoDate(row.end_date),
    status: warrantyStatuses[row.status] || "Pending",
    adminRemark: row.admin_remark,
    submittedAt: iso(row.submitted_at ?? row.created_at)!,
    history,
  };
}

function toSupportRequest(row: Row): SupportRequest {
  const category = (Object.keys(supportCategories) as SupportCategory[]).find(
    (key) => supportCategories[key].toLowerCase() === (row.category ?? "").toLowerCase(),
  ) ?? "General Enquiry";

  return {
    id: `sup_${row.id}`,
    ticketNumber: row.ticket_number,
    customerId: row.user_id ? `cus_${row.user_id}` : "cus_0",
    warrantyId: null,
    category,
    subject: row.subject,
    message: row.message,
    status: supportStatuses[row.status] || "Open",
    createdAt: iso(row.created_at)!,
    updatedAt: iso(row.updated_at)!,
  };
}

export const mysqlProductRepository: ProductRepository = {
  async findAll({ category, q }) {
    const conditions = ["is_active = TRUE"];
    const params: unknown[] = [];
    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }
    if (q?.trim()) {
      conditions.push("(name LIKE ? OR model_number LIKE ?)");
      params.push(like(q.trim()), like(q.trim()));
    }
    return (await query<Row>(`SELECT * FROM products WHERE ${conditions.join(" AND ")} ORDER BY name`, params)).map(toProduct);
  },

  async findById(id) {
    const row = await queryOne<Row>("SELECT * FROM products WHERE id = ? AND is_active = TRUE", [rowId(id)]);
    return row && toProduct(row);
  },

  async findBySlug(slug) {
    const row = await queryOne<Row>("SELECT * FROM products WHERE slug = ? AND is_active = TRUE", [slug]);
    return row && toProduct(row);
  },
};

export const mysqlCustomerRepository: CustomerRepository = {
  async findAll({ q, status }) {
    const conditions = ["role = 'customer'"];
    const params: unknown[] = [];
    if (status) {
      conditions.push("status = ?");
      params.push(status.toLowerCase());
    }
    if (q?.trim()) {
      conditions.push("(name LIKE ? OR email LIKE ? OR mobile LIKE ?)");
      params.push(like(q.trim()), like(q.trim()), like(q.trim()));
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    return (await query<Row>(`SELECT * FROM users ${where} ORDER BY created_at DESC`, params)).map(toCustomer);
  },

  async findById(id) {
    const row = await queryOne<Row>("SELECT * FROM users WHERE id = ?", [rowId(id)]);
    return row && toCustomer(row);
  },

  async count() {
    return Number((await queryOne<Row>("SELECT COUNT(*) AS total FROM users WHERE role = 'customer'"))?.total ?? 0);
  },
};

export const mysqlWarrantyRepository: WarrantyRepository = {
  async findAll({ customerId, status, productId, q }) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (customerId) {
      conditions.push("w.user_id = ?");
      params.push(rowId(customerId));
    }
    if (status) {
      conditions.push("w.status = ?");
      params.push(status.toLowerCase());
    }
    if (productId) {
      conditions.push("w.product_id = ?");
      params.push(rowId(productId));
    }
    if (q?.trim()) {
      conditions.push("(w.warranty_number LIKE ? OR w.serial_number LIKE ? OR w.customer_name LIKE ?)");
      params.push(like(q.trim()), like(q.trim()), like(q.trim()));
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const rows = await query<Row>(
      `SELECT w.*, u.name AS reviewer_name
       FROM warranties w
       LEFT JOIN users u ON u.id = w.reviewed_by
       ${where}
       ORDER BY w.submitted_at DESC, w.id DESC`,
      params,
    );
    return rows.map(toWarranty);
  },

  async findById(id) {
    const row = await queryOne<Row>(
      `SELECT w.*, u.name AS reviewer_name
       FROM warranties w
       LEFT JOIN users u ON u.id = w.reviewed_by
       WHERE w.id = ?`,
      [rowId(id)],
    );
    return row && toWarranty(row);
  },

  async existsBySerial(productId, serialNumber) {
    const row = await queryOne<Row>("SELECT id FROM warranties WHERE product_id = ? AND serial_number = ?", [
      rowId(productId),
      serialNumber.toUpperCase(),
    ]);
    return Boolean(row);
  },

  async countByStatus() {
    const counts: Record<WarrantyStatus, number> = { Pending: 0, Active: 0, Expired: 0, Rejected: 0 };
    for (const row of await query<Row>("SELECT status, COUNT(*) AS total FROM warranties GROUP BY status")) {
      const mapped = warrantyStatuses[row.status];
      if (mapped) counts[mapped] = Number(row.total);
    }
    return counts;
  },

  async create(input) {
    const warrantyNumber = `WR-${Math.floor(100000 + Math.random() * 900000)}`;
    const result = await execute(
      `INSERT INTO warranties (warranty_number, user_id, customer_name, email, mobile, installation_address, product_id, product_model, serial_number, purchase_date, dealer_name, status)
       VALUES (?, ?, 'Customer', '', '', '', ?, 'Default', ?, ?, ?, 'pending')`,
      [warrantyNumber, rowId(input.customerId), rowId(input.productId), input.serialNumber.toUpperCase(), input.purchaseDate, input.dealerName],
    );
    return (await mysqlWarrantyRepository.findById(`war_${result.insertId}`))!;
  },
};

export const mysqlSupportRepository: SupportRepository = {
  async findByCustomer(customerId) {
    return (await query<Row>("SELECT * FROM support_requests WHERE user_id = ? ORDER BY created_at DESC", [rowId(customerId)])).map(
      toSupportRequest,
    );
  },

  async create(input) {
    const ticketNumber = `SR-${Math.floor(10000 + Math.random() * 90000)}`;
    const result = await execute(
      `INSERT INTO support_requests (ticket_number, user_id, category, subject, message, contact_name, contact_email, contact_mobile, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
      [
        ticketNumber,
        rowId(input.customerId),
        input.category,
        input.subject,
        input.message,
        input.contactName,
        input.contactEmail,
        input.contactMobile,
      ],
    );
    const row = (await queryOne<Row>("SELECT * FROM support_requests WHERE id = ?", [result.insertId]))!;
    return toSupportRequest(row);
  },
};

export const mysqlServiceRequestRepository: ServiceRequestRepository = {
  async create(input) {
    const ticketNumber = `SR-${Math.floor(10000 + Math.random() * 90000)}`;
    const result = await execute(
      `INSERT INTO support_requests (ticket_number, category, subject, message, contact_name, contact_email, contact_mobile, status)
       VALUES (?, 'Repair', ?, ?, ?, ?, ?, 'open')`,
      [ticketNumber, `${input.productModel} - ${input.issueType}`, input.description, input.name, input.email, input.mobile],
    );
    return {
      id: `srv_${result.insertId}`,
      ticketNumber,
      name: input.name,
      mobile: input.mobile,
      email: input.email,
      productModel: input.productModel,
      serialNumber: input.serialNumber,
      issueType: input.issueType,
      description: input.description,
      preferredVisitDate: input.preferredVisitDate,
      pincode: input.pincode,
      photoFileName: input.photo?.originalFileName ?? null,
      status: "Open",
      createdAt: new Date().toISOString(),
    };
  },
};

export const mysqlWarrantyRegistrationRepository: WarrantyRegistrationRepository = {
  async existsBySerial(serialNumber: string) {
    const row = await queryOne<Row>("SELECT id FROM warranties WHERE serial_number = ?", [serialNumber.toUpperCase()]);
    return Boolean(row);
  },

  async findStatus(serialNumber: string, mobile?: string) {
    const serial = serialNumber.trim().toUpperCase();
    let sql = `
      SELECT w.*, p.name AS product_name, p.capacity, p.price_inr AS mrp, p.warranty_months
      FROM warranties w
      LEFT JOIN products p ON (p.id = w.product_id OR p.model_number = w.product_model)
      WHERE UPPER(w.serial_number) = ?
    `;
    const params: unknown[] = [serial];

    if (mobile?.trim()) {
      const cleanMobile = mobile.replace(/\D/g, "");
      if (cleanMobile) {
        sql += " AND REPLACE(REPLACE(w.mobile, '-', ''), ' ', '') = ?";
        params.push(cleanMobile);
      }
    }

    sql += " ORDER BY w.id DESC LIMIT 1";

    const row = await queryOne<Row>(sql, params);
    if (!row) return undefined;

    return {
      warrantyNumber: row.warranty_number,
      model: row.product_model,
      productName: row.product_name || row.product_model,
      capacity: row.capacity || "",
      mrp: Number(row.mrp) || 0,
      warrantyMonths: Number(row.warranty_months) || 60,
      serialNumber: row.serial_number,
      customerName: row.customer_name,
      mobile: row.mobile,
      installationAddress: row.installation_address,
      dealerName: row.dealer_name,
      purchaseDate: isoDate(row.purchase_date),
      installationDate: isoDate(row.installation_date),
      registeredOn: iso(row.submitted_at ?? row.created_at)!,
      validUntil: isoDate(row.end_date),
      status: warrantyStatuses[row.status] || "Active",
    };
  },

  async create({ invoice, installationDocument, ...input }) {
    const serial = input.serialNumber.trim().toUpperCase();

    // Check duplicate
    const exists = await mysqlWarrantyRegistrationRepository.existsBySerial(serial);
    if (exists) {
      throw new ConflictError("A warranty is already registered for this serial number.");
    }

    // Try finding product_id and warranty_months from products table
    const product = await queryOne<Row>(
      "SELECT id, warranty_months FROM products WHERE model_number = ? OR name = ? LIMIT 1",
      [input.productModel, input.productModel],
    );

    const warrantyMonths = Number(product?.warranty_months) || 60; // Standard 5-year coverage default
    const startDate = input.purchaseDate;
    const endDateObj = new Date(`${startDate}T00:00:00Z`);
    endDateObj.setUTCMonth(endDateObj.getUTCMonth() + warrantyMonths);
    endDateObj.setUTCDate(endDateObj.getUTCDate() - 1);
    const endDate = endDateObj.toISOString().slice(0, 10);

    // Try finding user_id from users table
    const user = await queryOne<Row>(
      "SELECT id FROM users WHERE email = ? OR mobile = ? LIMIT 1",
      [input.email.toLowerCase(), input.mobile],
    );

    const warrantyNumber = `WR-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const result = await execute(
        `INSERT INTO warranties (
           warranty_number, user_id, customer_name, email, mobile,
           installation_address, product_id, product_model, serial_number,
           purchase_date, installation_date, dealer_name, dealer_contact,
           invoice_file, installation_file, status, start_date, end_date,
           admin_remark, reviewed_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, NOW())`,
        [
          warrantyNumber,
          user?.id ?? null,
          input.customerName,
          input.email,
          input.mobile,
          input.installationAddress,
          product?.id ?? null,
          input.productModel,
          serial,
          input.purchaseDate,
          input.installationDate,
          input.dealerName,
          input.dealerContact ?? null,
          invoice?.originalFileName ?? "invoice.pdf",
          installationDocument?.originalFileName ?? "installation.pdf",
          startDate,
          endDate,
          "Auto-approved: Hardware serial number verified against production master",
        ],
      );

      const row = (await queryOne<Row>("SELECT * FROM warranties WHERE id = ?", [result.insertId]))!;

      return {
        id: `war_${row.id}`,
        registrationNumber: row.warranty_number,
        customerName: row.customer_name,
        email: row.email,
        mobile: row.mobile,
        installationAddress: row.installation_address,
        productModel: row.product_model,
        serialNumber: row.serial_number,
        purchaseDate: isoDate(row.purchase_date)!,
        installationDate: isoDate(row.installation_date)!,
        dealerName: row.dealer_name,
        dealerContact: row.dealer_contact,
        invoiceFileName: invoice?.originalFileName ?? "invoice.pdf",
        installationDocumentFileName: installationDocument?.originalFileName ?? "installation.pdf",
        status: "Active",
        createdAt: iso(row.submitted_at ?? row.created_at)!,
      } satisfies WarrantyRegistration;
    } catch (error) {
      if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
        throw new ConflictError("A warranty is already registered for this serial number.");
      }
      throw error;
    }
  },
};
export const mysqlSerialNumberRepository: SerialNumberRepository = {
  async findBySerial(serialNumber) {
    const row = await queryOne<Row>(
      `SELECT
         sn.serial_number,
         sn.product_id,
         p.name AS product_name,
         p.model_number
       FROM serial_numbers sn
       INNER JOIN products p ON p.id = sn.product_id
       WHERE UPPER(sn.serial_number) = ?
       LIMIT 1`,
      [serialNumber.trim().toUpperCase()],
    );

    if (!row) return undefined;

    return {
      serialNumber: row.serial_number,
      productId: Number(row.product_id),
      productName: row.product_name,
      modelNumber: row.model_number,
    };
  },
};