/**
 * MySQL repositories for the warranty platform (tables from migrations 001, 004 and 005).
 * Rows use BIGINT ids; the API keeps the prefixed string ids of the mock data ("prd_101", "war_7"), so the
 * services and the website do not change between data sources.
 */
import { execute, query, queryOne, withTransaction } from "../../db/pool.js";
import { nextSequenceNumber } from "../../db/sequences.js";
import { ConflictError } from "../../utils/errors.js";
import { removeUpload, storeUpload } from "../../utils/uploads.js";
import type {
  Customer,
  CustomerRepository,
  Product,
  ProductRepository,
  ServiceRequest,
  ServiceRequestRepository,
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

/** "war_42" → 42. Returns 0 (matches no row) for ids that are not ours. */
function rowId(id: string): number {
  const value = Number(id.split("_")[1]);
  return Number.isSafeInteger(value) ? value : 0;
}

const iso = (value: Date | null): string | null => (value ? value.toISOString() : null);
const isoDate = (value: Date | null): string | null => (value ? value.toISOString().slice(0, 10) : null);
const like = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

const warrantyStatuses: Record<string, WarrantyStatus> = { pending: "Pending", active: "Active", expired: "Expired", rejected: "Rejected" };
const supportStatuses: Record<string, SupportStatus> = { open: "Open", in_progress: "In Progress", resolved: "Resolved", closed: "Resolved" };
const supportCategories: Record<SupportCategory, string> = {
  Installation: "installation",
  Repair: "repair",
  "Warranty Claim": "warranty_claim",
  "General Enquiry": "general_enquiry",
};
const historyActions: Record<string, string> = {
  submitted: "Registration submitted",
  approved: "Approved",
  rejected: "Rejected",
  status_changed: "Status changed",
  auto_expired: "Expired automatically",
};

function toProduct(row: Row): Product {
  return {
    id: `prd_${row.id}`,
    slug: row.slug,
    name: row.name,
    model: row.model_number,
    category: row.category,
    warrantyMonths: row.warranty_months,
    priceInr: row.price_inr ?? 0,
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

function toWarranty(row: Row, history: WarrantyHistoryEntry[]): Warranty {
  return {
    id: `war_${row.id}`,
    warrantyNumber: row.warranty_number,
    customerId: `cus_${row.customer_id}`,
    productId: `prd_${row.product_id}`,
    serialNumber: row.serial_number,
    purchaseDate: isoDate(row.purchase_date)!,
    invoiceNumber: row.invoice_number,
    dealerName: row.dealer_name,
    startDate: isoDate(row.start_date),
    endDate: isoDate(row.end_date),
    status: warrantyStatuses[row.status],
    adminRemark: row.admin_remark,
    submittedAt: iso(row.submitted_at)!,
    history,
  };
}

function toSupportRequest(row: Row): SupportRequest {
  const category = (Object.keys(supportCategories) as SupportCategory[]).find((key) => supportCategories[key] === row.category)!;
  return {
    id: `sup_${row.id}`,
    ticketNumber: row.ticket_number,
    customerId: `cus_${row.customer_id}`,
    warrantyId: row.warranty_id ? `war_${row.warranty_id}` : null,
    category,
    subject: row.subject,
    message: row.message,
    status: supportStatuses[row.status],
    createdAt: iso(row.created_at)!,
    updatedAt: iso(row.updated_at)!,
  };
}

/** Loads warranties with their history; `where`/`params` filter the warranties table (alias w). */
async function loadWarranties(where: string, params: unknown[]): Promise<Warranty[]> {
  const rows = await query<Row>(`SELECT w.* FROM warranties w ${where} ORDER BY w.submitted_at DESC, w.id DESC`, params);
  if (rows.length === 0) return [];
  const history = await query<Row>(
    `SELECT h.warranty_id, h.action, h.remark, h.created_at, a.name AS admin_name, c.name AS customer_name
       FROM warranty_status_history h
       JOIN warranties w ON w.id = h.warranty_id
       JOIN customers c ON c.id = w.customer_id
       LEFT JOIN admins a ON a.id = h.admin_id
      WHERE h.warranty_id IN (?)
      ORDER BY h.created_at, h.id`,
    [rows.map((row) => row.id)],
  );
  return rows.map((row) =>
    toWarranty(
      row,
      history
        .filter((entry) => entry.warranty_id === row.id)
        .map((entry) => ({
          at: iso(entry.created_at)!,
          action: historyActions[entry.action] ?? entry.action,
          by: entry.admin_name ?? (entry.action === "submitted" ? entry.customer_name : "System"),
          ...(entry.remark ? { remark: entry.remark } : {}),
        })),
    ),
  );
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
    const conditions: string[] = [];
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
    return (await query<Row>(`SELECT * FROM customers ${where} ORDER BY created_at DESC`, params)).map(toCustomer);
  },
  async findById(id) {
    const row = await queryOne<Row>("SELECT * FROM customers WHERE id = ?", [rowId(id)]);
    return row && toCustomer(row);
  },
  async count() {
    return Number((await queryOne<Row>("SELECT COUNT(*) AS total FROM customers"))?.total ?? 0);
  },
};

export const mysqlWarrantyRepository: WarrantyRepository = {
  async findAll({ customerId, status, productId, q }) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (customerId) {
      conditions.push("w.customer_id = ?");
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
      conditions.push("(w.warranty_number LIKE ? OR w.serial_number LIKE ? OR w.invoice_number LIKE ?)");
      params.push(like(q.trim()), like(q.trim()), like(q.trim()));
    }
    return loadWarranties(conditions.length ? `WHERE ${conditions.join(" AND ")}` : "", params);
  },
  async findById(id) {
    return (await loadWarranties("WHERE w.id = ?", [rowId(id)]))[0];
  },
  async existsBySerial(productId, serialNumber) {
    const row = await queryOne<Row>("SELECT id FROM warranties WHERE product_id = ? AND serial_number = ?", [rowId(productId), serialNumber.toUpperCase()]);
    return Boolean(row);
  },
  async countByStatus() {
    const counts: Record<WarrantyStatus, number> = { Pending: 0, Active: 0, Expired: 0, Rejected: 0 };
    for (const row of await query<Row>("SELECT status, COUNT(*) AS total FROM warranties GROUP BY status")) {
      counts[warrantyStatuses[row.status]] = Number(row.total);
    }
    return counts;
  },
  async create(input) {
    const storageKey = await storeUpload("warranty-invoices", input.invoice);
    try {
      const id = await withTransaction(async (connection) => {
        const warrantyNumber = await nextSequenceNumber("warranty", "WR", 6, connection);
        const result = await execute(
          `INSERT INTO warranties (warranty_number, customer_id, product_id, serial_number, purchase_date, invoice_number, dealer_name)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [warrantyNumber, rowId(input.customerId), rowId(input.productId), input.serialNumber.toUpperCase(), input.purchaseDate, input.invoiceNumber, input.dealerName],
          connection,
        );
        await execute(
          `INSERT INTO warranty_documents (warranty_id, document_type, storage_key, original_file_name, mime_type, size_bytes, checksum_sha256, uploaded_by_customer_id)
           VALUES (?, 'invoice', ?, ?, ?, ?, ?, ?)`,
          [result.insertId, storageKey, input.invoice.originalFileName, input.invoice.mimeType, input.invoice.sizeBytes, input.invoice.checksumSha256, rowId(input.customerId)],
          connection,
        );
        await execute(
          "INSERT INTO warranty_status_history (warranty_id, from_status, to_status, action) VALUES (?, NULL, 'pending', 'submitted')",
          [result.insertId],
          connection,
        );
        return result.insertId;
      });
      return (await mysqlWarrantyRepository.findById(`war_${id}`))!;
    } catch (error) {
      await removeUpload(storageKey);
      // Two submissions of the same unit at once: the unique key catches what existsBySerial could not.
      if ((error as { code?: string }).code === "ER_DUP_ENTRY") throw new ConflictError("A warranty is already registered for this serial number.");
      throw error;
    }
  },
};

export const mysqlSupportRepository: SupportRepository = {
  async findByCustomer(customerId) {
    return (await query<Row>("SELECT * FROM support_requests WHERE customer_id = ? ORDER BY created_at DESC, id DESC", [rowId(customerId)])).map(
      toSupportRequest,
    );
  },
  async create(input) {
    const id = await withTransaction(async (connection) => {
      const ticketNumber = await nextSequenceNumber("service_ticket", "SR", 5, connection);
      const result = await execute(
        `INSERT INTO support_requests (ticket_number, customer_id, warranty_id, category, subject, message, contact_name, contact_email, contact_mobile)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ticketNumber,
          rowId(input.customerId),
          input.warrantyId ? rowId(input.warrantyId) : null,
          supportCategories[input.category],
          input.subject,
          input.message,
          input.contactName,
          input.contactEmail,
          input.contactMobile,
        ],
        connection,
      );
      return result.insertId;
    });
    return toSupportRequest((await queryOne<Row>("SELECT * FROM support_requests WHERE id = ?", [id]))!);
  },
};

export const mysqlServiceRequestRepository: ServiceRequestRepository = {
  async create({ photo, ...input }) {
    const storageKey = photo ? await storeUpload("service-request-photos", photo) : null;
    try {
      const id = await withTransaction(async (connection) => {
        const ticketNumber = await nextSequenceNumber("service_ticket", "SR", 5, connection);
        const result = await execute(
          `INSERT INTO service_requests (ticket_number, name, mobile, email, product_model, serial_number, issue_type, description,
             preferred_visit_date, pincode, photo_storage_key, photo_file_name, photo_mime_type, photo_size_bytes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ticketNumber,
            input.name,
            input.mobile,
            input.email,
            input.productModel,
            input.serialNumber,
            input.issueType,
            input.description,
            input.preferredVisitDate,
            input.pincode,
            storageKey,
            photo?.originalFileName ?? null,
            photo?.mimeType ?? null,
            photo?.sizeBytes ?? null,
          ],
          connection,
        );
        return result.insertId;
      });
      const row = (await queryOne<Row>("SELECT * FROM service_requests WHERE id = ?", [id]))!;
      return {
        id: `srv_${row.id}`,
        ticketNumber: row.ticket_number,
        name: row.name,
        mobile: row.mobile,
        email: row.email,
        productModel: row.product_model,
        serialNumber: row.serial_number,
        issueType: row.issue_type,
        description: row.description,
        preferredVisitDate: isoDate(row.preferred_visit_date),
        pincode: row.pincode,
        photoFileName: row.photo_file_name,
        status: supportStatuses[row.status],
        createdAt: iso(row.created_at)!,
      } satisfies ServiceRequest;
    } catch (error) {
      if (storageKey) await removeUpload(storageKey);
      throw error;
    }
  },
};

export const mysqlWarrantyRegistrationRepository: WarrantyRegistrationRepository = {
  async existsBySerial(serialNumber) {
    return Boolean(await queryOne<Row>("SELECT id FROM warranty_registrations WHERE serial_number = ?", [serialNumber.toUpperCase()]));
  },
  async findStatus(serialNumber, mobile) {
    const serial = serialNumber.toUpperCase();
    const row =
      (await queryOne<Row>(
        `SELECT product_model AS model, serial_number, created_at AS registered_on, NULL AS valid_until, status
           FROM warranty_registrations WHERE serial_number = ? AND mobile = ?`,
        [serial, mobile],
      )) ??
      (await queryOne<Row>(
        `SELECT p.model_number AS model, w.serial_number, w.submitted_at AS registered_on, w.end_date AS valid_until, w.status
           FROM warranties w
           JOIN customers c ON c.id = w.customer_id
           JOIN products p ON p.id = w.product_id
          WHERE w.serial_number = ? AND c.mobile = ?
          ORDER BY w.submitted_at DESC LIMIT 1`,
        [serial, mobile],
      ));
    return (
      row && {
        model: row.model,
        serialNumber: row.serial_number,
        registeredOn: iso(row.registered_on)!,
        validUntil: isoDate(row.valid_until),
        status: warrantyStatuses[row.status],
      }
    );
  },
  async create({ invoice, installationDocument, ...input }) {
    const documents = [
      { type: "invoice", file: invoice, key: await storeUpload("warranty-registrations", invoice) },
      { type: "installation", file: installationDocument, key: await storeUpload("warranty-registrations", installationDocument) },
    ];
    try {
      const id = await withTransaction(async (connection) => {
        const registrationNumber = await nextSequenceNumber("warranty", "WR", 6, connection);
        const result = await execute(
          `INSERT INTO warranty_registrations (registration_number, customer_name, email, mobile, installation_address, product_model,
             serial_number, purchase_date, installation_date, dealer_name, dealer_contact)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            registrationNumber,
            input.customerName,
            input.email,
            input.mobile,
            input.installationAddress,
            input.productModel,
            input.serialNumber.toUpperCase(),
            input.purchaseDate,
            input.installationDate,
            input.dealerName,
            input.dealerContact,
          ],
          connection,
        );
        for (const document of documents) {
          await execute(
            `INSERT INTO warranty_registration_documents (registration_id, document_type, storage_key, original_file_name, mime_type, size_bytes, checksum_sha256)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [result.insertId, document.type, document.key, document.file.originalFileName, document.file.mimeType, document.file.sizeBytes, document.file.checksumSha256],
            connection,
          );
        }
        return result.insertId;
      });
      const row = (await queryOne<Row>("SELECT * FROM warranty_registrations WHERE id = ?", [id]))!;
      return {
        id: `wrg_${row.id}`,
        registrationNumber: row.registration_number,
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
        invoiceFileName: invoice.originalFileName,
        installationDocumentFileName: installationDocument.originalFileName,
        status: warrantyStatuses[row.status],
        createdAt: iso(row.created_at)!,
      } satisfies WarrantyRegistration;
    } catch (error) {
      await Promise.all(documents.map((document) => removeUpload(document.key)));
      // Two submissions of the same unit at once: the unique key catches what existsBySerial could not.
      if ((error as { code?: string }).code === "ER_DUP_ENTRY") throw new ConflictError("A warranty is already registered for this serial number.");
      throw error;
    }
  },
};
