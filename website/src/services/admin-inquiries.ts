import { getAuthHeaders } from "./auth";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api").replace(/\/$/, "");

export interface InquiryItem {
  id: number;
  kind: "service" | "career" | "partner" | "consultation";
  reference_no: string;
  name: string;
  email: string;
  mobile: string;
  city: string | null;
  status: "new" | "contacted" | "in_progress" | "resolved" | "closed";
  details: Record<string, any>;
  file_url: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InquiryStats {
  total: number;
  newCount: number;
  serviceCount: number;
  careerCount: number;
  partnerCount: number;
  consultationCount: number;
}

export interface SmtpConfigData {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password?: string;
  hasPassword?: boolean;
  from_email: string;
  from_name: string;
  admin_email: string;
  is_enabled: boolean;
}

export async function getInquiries(params: {
  kind?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ inquiries: InquiryItem[]; total: number; page: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params.kind && params.kind !== "all") query.set("kind", params.kind);
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const res = await fetch(`${API_BASE_URL}/admin/inquiries?${query.toString()}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to load inquiries");
  }
  return data.data;
}

export async function getInquiryStats(): Promise<InquiryStats> {
  const res = await fetch(`${API_BASE_URL}/admin/inquiries/stats`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to load stats");
  }
  return data.data;
}

export async function getInquiryById(id: number): Promise<InquiryItem> {
  const res = await fetch(`${API_BASE_URL}/admin/inquiries/${id}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Inquiry not found");
  }
  return data.data;
}

export async function updateInquiryStatus(
  id: number,
  status: string,
  adminNotes?: string
): Promise<InquiryItem> {
  const res = await fetch(`${API_BASE_URL}/admin/inquiries/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, adminNotes }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to update inquiry");
  }
  return data.data;
}

export async function deleteInquiryRecord(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/inquiries/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to delete inquiry");
  }
}

export async function getSmtpSettings(): Promise<SmtpConfigData> {
  const res = await fetch(`${API_BASE_URL}/admin/smtp`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to load SMTP settings");
  }
  return data.data;
}

export async function saveSmtpSettings(config: Partial<SmtpConfigData>): Promise<SmtpConfigData> {
  const res = await fetch(`${API_BASE_URL}/admin/smtp`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(config),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to save SMTP settings");
  }
  return data.data;
}

export async function sendTestEmail(targetEmail?: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/smtp/test`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ targetEmail }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to send test email");
  }
  return data.data;
}
