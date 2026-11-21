import { getAuthHeaders } from "./auth";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000/api"
).replace(/\/$/, "");
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
  capacity?: string;
  shortDescription: string;
  description: string;
  warrantyMonths: number;
  priceInr: number;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}
// ------------------- Serial Numbers -------------------

export interface AdminSerialNumber {
  id: number;
  serialNumber: string;
  productName: string;
  modelNumber: string;
  capacity?: string;
  mrp?: number;
  warrantyMonths?: number;
  batchNumber: string;
  productionMonth: string;
  qrCode: string | null;
  createdAt: string;
  createdBy: string;
}

export interface SerialNumberStats {
  totalSerialNumbers: number;
  totalProducts: number;
  generatedBatches: number;
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

  if (params?.q) {
    query.set("q", params.q);
  }

  if (params?.category) {
    query.set("category", params.category);
  }

  const url = `${API_BASE_URL}/admin/products?${query.toString()}`;

  console.log("Products API URL:", url);

  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  const data = await res.json();

  console.log("Products API Response:", data);

  if (!res.ok || !data.success) {
    throw new Error(
      data.error?.message ||
      data.message ||
      `Failed to load products. Status: ${res.status}`
    );
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
  image?: File | null;
}): Promise<AdminProduct> {
  const formData = new FormData();

  formData.append("name", product.name);
  formData.append("modelNumber", product.modelNumber);
  formData.append("category", product.category);
  formData.append("warrantyMonths", String(product.warrantyMonths ?? 12));
  formData.append("priceInr", String(product.priceInr ?? 0));
  formData.append("shortDescription", product.shortDescription ?? "");
  formData.append("description", product.description ?? "");
  formData.append("isActive", String(product.isActive ?? true));

  if (product.image) {
    formData.append("image", product.image);
  }

  // Remove JSON Content-Type header
  const headers = new Headers(getAuthHeaders() as HeadersInit);
  headers.delete("Content-Type");

  const res = await fetch(`${API_BASE_URL}/admin/products`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to create product.");
  }

  return data.data;
}
export async function updateAdminProduct(
  id: string | number,
  input: {
    name: string;
    modelNumber: string;
    category: string;
    warrantyMonths: number;
    priceInr: number;
    shortDescription?: string;
    description?: string;
    isActive: boolean;
    image?: File | null;
  },
): Promise<AdminProduct> {
  const headers = new Headers(getAuthHeaders() as HeadersInit);
  headers.delete("Content-Type");

  const formData = new FormData();
  formData.append("name", input.name);
  formData.append("modelNumber", input.modelNumber);
  formData.append("category", input.category);
  formData.append("warrantyMonths", String(input.warrantyMonths));
  formData.append("priceInr", String(input.priceInr));
  formData.append("shortDescription", input.shortDescription ?? "");
  formData.append("description", input.description ?? "");
  formData.append("isActive", String(input.isActive));

  if (input.image instanceof File) {
    formData.append("image", input.image);
  }

  const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
    method: "PUT",
    headers,
    body: formData,
  });
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to update product.");
  }

  return data.data;
}

export async function deleteAdminProduct(
  id: string | number,
): Promise<void> {
  const headers = { ...getAuthHeaders() };

  delete headers["Content-Type"];
  delete headers["content-type"];

  const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
    method: "DELETE",
    headers,
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to delete product.");
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

// ------------------- Serial Number Audit -------------------

export async function getAdminSerialNumbers(params?: {
  search?: string;
  model?: string;
  productionMonth?: string;
}): Promise<AdminSerialNumber[]> {
  const query = new URLSearchParams();

  if (params?.search) query.set("search", params.search);
  if (params?.model && params.model !== "all") {
    query.set("model", params.model);
  }
  if (params?.productionMonth && params.productionMonth !== "all") {
    query.set("productionMonth", params.productionMonth);
  }

  const res = await fetch(
    `${API_BASE_URL}/admin/serial-numbers?${query.toString()}`,
    {
      headers: getAuthHeaders(),
      cache: "no-store",
    }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(
      data.error?.message || "Failed to load serial numbers."
    );
  }

  return data.data;
}

export async function getSerialNumberStats(): Promise<SerialNumberStats> {
  const res = await fetch(
    `${API_BASE_URL}/admin/serial-numbers/stats`,
    {
      headers: getAuthHeaders(),
      cache: "no-store",
    }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(
      data.error?.message || "Failed to load serial number statistics."
    );
  }

  return data.data;
}
export async function createAdminSerialNumber(input: {
  productId: number;
  serialNumber: string;
  batchNumber: string;
  productionMonth: string;
  qrCode?: string;
}) {
  const res = await fetch(
    `${API_BASE_URL}/admin/serial-numbers`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(input),
    }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(
      data.error?.message || "Failed to create serial number."
    );
  }

  return data.data;
}

export interface BulkImportSerialResult {
  total: number;
  importedCount: number;
  skippedCount: number;
  imported: Array<{
    id: number;
    serialNumber: string;
    modelNumber: string;
    batchNumber: string;
  }>;
  skipped: Array<{
    row: number;
    serialNumber: string;
    reason: string;
  }>;
}

export async function bulkImportAdminSerialNumbers(items: Array<{
  productId?: number;
  productModel?: string;
  serialNumber: string;
  batchNumber: string;
  productionMonth: string;
  qrCode?: string;
}>): Promise<BulkImportSerialResult> {
  const res = await fetch(`${API_BASE_URL}/admin/serial-numbers/bulk`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ items }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to bulk import serial numbers.");
  }

  return data.data;
}