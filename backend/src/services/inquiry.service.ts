import { query, execute } from "../db/pool.js";
import { sendInquiryNotification, sendServiceStatusChangeEmail } from "./mail.service.js";

export type InquiryKind = "service" | "career" | "partner" | "consultation";
export type InquiryStatus =
  | "new"
  | "contacted"
  | "in_progress"
  | "assigned"
  | "technician_visit"
  | "under_service"
  | "resolved"
  | "closed";
export interface CreateInquiryInput {
  kind: InquiryKind;
  name: string;
  email: string;
  mobile: string;
  city?: string;
  details: Record<string, any>;
  fileUrl?: string;
}

export interface InquiryRecord {
  id: number;
  kind: InquiryKind;
  reference_no: string;
  name: string;
  email: string;
  mobile: string;
  city: string | null;
  status: InquiryStatus;
  details: Record<string, any>;
  file_url: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  engineer_name: string | null;
  engineer_contact: string | null;
}

const KIND_PREFIXES: Record<InquiryKind, string> = {
  service: "SRV",
  career: "CAR",
  partner: "PRT",
  consultation: "CNS",
};

export async function createInquiry(input: CreateInquiryInput): Promise<{
  id: number;
  referenceNo: string;
  kind: InquiryKind;
  message: string;
}> {
  const prefix = KIND_PREFIXES[input.kind] || "INQ";
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const referenceNo = `${prefix}-${year}-${randomSuffix}`;

  const detailsJson = JSON.stringify(input.details || {});

  const result = await execute(
    `INSERT INTO inquiries (kind, reference_no, name, email, mobile, city, status, details, file_url)
     VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
    [
      input.kind,
      referenceNo,
      input.name.trim(),
      input.email.trim().toLowerCase(),
      input.mobile.replace(/\D/g, ""),
      input.city?.trim() || null,
      detailsJson,
      input.fileUrl || null,
    ]
  );

  const inquiryId = result.insertId;

  // Trigger email notification asynchronously (fail-safe)
  sendInquiryNotification({
    kind: input.kind,
    reference_no: referenceNo,
    name: input.name,
    email: input.email,
    mobile: input.mobile,
    city: input.city,
    details: input.details,
  }).catch((err) => {
    console.error("Email notification failed:", err);
  });

  return {
    id: inquiryId,
    referenceNo,
    kind: input.kind,
    message: "Your submission has been received successfully.",
  };
}

export async function listInquiries(filters: {
  kind?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  inquiries: InquiryRecord[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.max(1, Math.min(100, filters.limit || 20));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.kind && filters.kind !== "all") {
    conditions.push("kind = ?");
    params.push(filters.kind);
  }

  if (filters.status && filters.status !== "all") {
    conditions.push("status = ?");
    params.push(filters.status);
  }

  if (filters.search && filters.search.trim()) {
    const s = `%${filters.search.trim()}%`;
    conditions.push("(reference_no LIKE ? OR name LIKE ? OR email LIKE ? OR mobile LIKE ? OR city LIKE ?)");
    params.push(s, s, s, s, s);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Count total
  const countRows = await query<any>(`SELECT COUNT(*) as total FROM inquiries ${whereClause}`, params);
  const total = Number(countRows[0]?.total || 0);

  // Fetch paginated
  const rows = await query<any>(
    `SELECT id, kind, reference_no, name, email, mobile, city, status, details, file_url, admin_notes,engineer_name, engineer_contact, created_at, updated_at
     FROM inquiries
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const inquiries: InquiryRecord[] = rows.map((r: any) => ({
    id: r.id,
    kind: r.kind,
    reference_no: r.reference_no,
    name: r.name,
    email: r.email,
    mobile: r.mobile,
    city: r.city,
    status: r.status,
    details: typeof r.details === "string" ? JSON.parse(r.details) : r.details || {},
    file_url: r.file_url,
    admin_notes: r.admin_notes,
    engineer_name: r.engineer_name,
    engineer_contact: r.engineer_contact,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

  return {
    inquiries,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getInquiryById(id: number): Promise<InquiryRecord | null> {
  const rows = await query<any>(
    `SELECT id, kind, reference_no, name, email, mobile, city, status, details, file_url, admin_notes, engineer_name, engineer_contact, created_at, updated_at
     FROM inquiries WHERE id = ? LIMIT 1`,
    [id]
  );

  if (!rows || rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    kind: r.kind,
    reference_no: r.reference_no,
    name: r.name,
    email: r.email,
    mobile: r.mobile,
    city: r.city,
    status: r.status,
    details: typeof r.details === "string" ? JSON.parse(r.details) : r.details || {},
    file_url: r.file_url,
    admin_notes: r.admin_notes,
    engineer_name: r.engineer_name,
    engineer_contact: r.engineer_contact,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export async function updateInquiry(
  id: number,
  updates: { status?: InquiryStatus; adminNotes?: string }
): Promise<InquiryRecord | null> {
  const current = await getInquiryById(id);
  if (!current) return null;

  const fields: string[] = [];
  const params: any[] = [];

  if (updates.status) {
    fields.push("status = ?");
    params.push(updates.status);
  }

  if (updates.adminNotes !== undefined) {
    fields.push("admin_notes = ?");
    params.push(updates.adminNotes);
  }

  if (fields.length === 0) return current;

  params.push(id);
  await execute(`UPDATE inquiries SET ${fields.join(", ")} WHERE id = ?`, params);
  const updated = await getInquiryById(id);

  // Send status update email to the client
  if (updated && updates.status && updates.status !== current.status) {
    sendServiceStatusChangeEmail({
      inquiry: updated,
      oldStatus: current.status,
      newStatus: updates.status,
      adminNotes: updates.adminNotes ?? updated.admin_notes ?? undefined,
      engineerName: updated.engineer_name ?? undefined,
      engineerContact: updated.engineer_contact ?? undefined,
    }).catch((err) => {
      console.error("[Service Status Email] Failed to send email on update:", err);
    });
  }

  return updated;
}

export async function deleteInquiry(id: number): Promise<boolean> {
  const result = await execute("DELETE FROM inquiries WHERE id = ?", [id]);
  return result.affectedRows > 0;
}


export async function getInquiryStats(): Promise<{
  total: number;
  newCount: number;
  serviceCount: number;
  careerCount: number;
  partnerCount: number;
  consultationCount: number;
  receivedCount: number;
  assignedCount: number;
  technicianVisitCount: number;
  underServiceCount: number;
  resolvedCount: number;
  closedCount: number;
}> {
  const rows = await query<any>(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as newCount,
      SUM(CASE WHEN kind = 'service' THEN 1 ELSE 0 END) as serviceCount,
      SUM(CASE WHEN kind = 'career' THEN 1 ELSE 0 END) as careerCount,
      SUM(CASE WHEN kind = 'partner' THEN 1 ELSE 0 END) as partnerCount,
      SUM(CASE WHEN kind = 'consultation' THEN 1 ELSE 0 END) as consultationCount,

      SUM(CASE WHEN kind = 'service' AND status = 'new' THEN 1 ELSE 0 END) as receivedCount,
      SUM(CASE WHEN kind = 'service' AND status = 'assigned' THEN 1 ELSE 0 END) as assignedCount,
      SUM(CASE WHEN kind = 'service' AND status = 'technician_visit' THEN 1 ELSE 0 END) as technicianVisitCount,
      SUM(CASE WHEN kind = 'service' AND status = 'under_service' THEN 1 ELSE 0 END) as underServiceCount,
      SUM(CASE WHEN kind = 'service' AND status = 'resolved' THEN 1 ELSE 0 END) as resolvedCount,
      SUM(CASE WHEN kind = 'service' AND status = 'closed' THEN 1 ELSE 0 END) as closedCount
    FROM inquiries
  `);

  const r = rows[0] || {};

  return {
    total: Number(r.total || 0),
    newCount: Number(r.newCount || 0),
    serviceCount: Number(r.serviceCount || 0),
    careerCount: Number(r.careerCount || 0),
    partnerCount: Number(r.partnerCount || 0),
    consultationCount: Number(r.consultationCount || 0),
    receivedCount: Number(r.receivedCount || 0),
    assignedCount: Number(r.assignedCount || 0),
    technicianVisitCount: Number(r.technicianVisitCount || 0),
    underServiceCount: Number(r.underServiceCount || 0),
    resolvedCount: Number(r.resolvedCount || 0),
    closedCount: Number(r.closedCount || 0),
  };
}
export async function assignEngineer(
  id: number,
  engineerName: string,
  engineerContact: string
): Promise<InquiryRecord | null> {
  const current = await getInquiryById(id);
  const cleanContact = engineerContact.replace(/\D/g, "");

  await execute(
    `UPDATE inquiries
     SET engineer_name = ?,
         engineer_contact = ?,
         status = 'assigned'
     WHERE id = ? AND kind = 'service'`,
    [
      engineerName.trim(),
      cleanContact,
      id,
    ]
  );

  const updated = await getInquiryById(id);

  if (updated) {
    sendServiceStatusChangeEmail({
      inquiry: updated,
      oldStatus: current?.status,
      newStatus: "assigned",
      adminNotes: updated.admin_notes ?? undefined,
      engineerName: engineerName.trim(),
      engineerContact: cleanContact,
    }).catch((err) => {
      console.error("[Service Status Email] Failed to send email on engineer assign:", err);
    });
  }

  return updated;
}
