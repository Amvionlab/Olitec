import { getAuthHeaders } from "./auth";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api").replace(/\/$/, "");

export interface AnalyticsData {
  totalWarranties: number;
  activeWarranties: number;
  pendingWarranties: number;
  rejectedWarranties: number;
  expiredWarranties: number;
  totalUsers: number;
  totalCustomers: number;
  totalAdmins: number;
  totalProducts: number;
  activeProducts: number;
  monthlyTrends: { month: string; count: number }[];
  topProducts: { model: string; count: number }[];
  recentRegistrations: {
    id: string;
    warrantyNumber: string;
    customerName: string;
    productModel: string;
    serialNumber: string;
    status: string;
    submittedAt: string | null;
  }[];
}

export interface AdminUser {
  id: string;
  numericId: number;
  name: string;
  email: string;
  mobile: string;
  role: "customer" | "admin";
  status: "active" | "inactive";
  city: string;
  state: string;
  warrantyCount: number;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminProduct {
  id: string;
  numericId: number;
  slug: string;
  name: string;
  model: string;
  category: string;
  shortDescription: string;
  description: string;
  warrantyMonths: number;
  priceInr: number;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AdminWarranty {
  id: string;
  numericId: number;
  warrantyNumber: string;
  customerName: string;
  email: string;
  mobile: string;
  installationAddress: string;
  productModel: string;
  serialNumber: string;
  purchaseDate: string;
  installationDate: string | null;
  dealerName: string;
  dealerContact: string | null;
  invoiceFile: string | null;
  installationFile: string | null;
  status: "pending" | "active" | "rejected" | "expired";
  startDate: string | null;
  endDate: string | null;
  adminRemark: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  submittedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ------------------- Analytics -------------------
export async function getAdminAnalytics(): Promise<AnalyticsData> {
  const res = await fetch(`${API_BASE_URL}/admin/analytics`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to load admin analytics.");
  }
  return data.data;
}

// ------------------- Users -------------------
export async function getAdminUsers(params?: {
  q?: string;
  role?: string;
  status?: string;
  page?: number;
}): Promise<{ items: AdminUser[]; meta: PaginationMeta }> {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.role) query.set("role", params.role);
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));

  const res = await fetch(`${API_BASE_URL}/admin/users?${query.toString()}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to load users.");
  }
  return { items: data.data, meta: data.meta };
}

export async function updateUserStatus(
  userId: string | number,
  status: "active" | "inactive",
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to update user status.");
  }
}

// ------------------- Products (Product Master) -------------------
export async function getAdminProducts(params?: {
  q?: string;
  category?: string;
}): Promise<AdminProduct[]> {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.category) query.set("category", params.category);

  const res = await fetch(`${API_BASE_URL}/admin/products?${query.toString()}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to load products.");
  }
  return data.data;
}

export async function createAdminProduct(product: {
  name: string;
  modelNumber: string;
  category: string;
  warrantyMonths?: number;
  priceInr?: number;
  shortDescription?: string;
  description?: string;
  isActive?: boolean;
}): Promise<AdminProduct> {
  const res = await fetch(`${API_BASE_URL}/admin/products`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(product),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to create product.");
  }
  return data.data;
}

export async function updateAdminProduct(
  id: string | number,
  product: Partial<{
    name: string;
    modelNumber: string;
    category: string;
    warrantyMonths: number;
    priceInr: number;
    shortDescription: string;
    description: string;
    isActive: boolean;
  }>,
): Promise<AdminProduct> {
  const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(product),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to update product.");
  }
  return data.data;
}

export async function deleteAdminProduct(id: string | number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to deactivate product.");
  }
}

// ------------------- Warranties -------------------
export async function getAdminWarranties(params?: {
  q?: string;
  status?: string;
  page?: number;
}): Promise<{ items: AdminWarranty[]; meta: PaginationMeta }> {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.status && params.status !== "all") query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));

  const res = await fetch(`${API_BASE_URL}/admin/warranties?${query.toString()}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to load warranties.");
  }
  return { items: data.data, meta: data.meta };
}

export async function approveWarranty(
  id: string | number,
  remark?: string,
): Promise<AdminWarranty> {
  const res = await fetch(`${API_BASE_URL}/admin/warranties/${id}/approve`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ remark: remark || "Approved by Administrator" }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to approve warranty.");
  }
  return data.data;
}

export async function rejectWarranty(
  id: string | number,
  remark: string,
): Promise<AdminWarranty> {
  const res = await fetch(`${API_BASE_URL}/admin/warranties/${id}/reject`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ remark: remark || "Documents could not be verified." }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to reject warranty.");
  }
  return data.data;
}
