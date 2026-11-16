import { getAuthHeaders } from "./auth";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api").replace(/\/$/, "");

export interface CustomerProfile {
  id: number;
  name: string;
  email: string;
  mobile: string;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  pincode?: string | null;
  role: string;
  status: string;
  is_email_verified?: boolean;
  created_at: string;
}

export interface CustomerWarranty {
  id: number;
  warranty_number: string;
  product_id?: number | null;
  product_model: string;
  serial_number: string;
  purchase_date: string;
  installation_date?: string | null;
  dealer_name: string;
  status: "pending" | "active" | "expired" | "rejected";
  start_date?: string | null;
  end_date?: string | null;
  submitted_at: string;
  product_name?: string | null;
  product_slug?: string | null;
  product_category?: string | null;
  image_url?: string | null;
}

export interface CustomerInquiry {
  id: number;
  kind: "service" | "career" | "partner" | "consultation";
  reference_no: string;
  name: string;
  email: string;
  mobile: string;
  city?: string | null;
  status: string;
  details: Record<string, any>;
  file_url?: string | null;
  admin_notes?: string | null;
  created_at: string;
}

export interface CustomerDashboardData {
  profile: CustomerProfile | null;
  registeredProducts: CustomerWarranty[];
  warranties: CustomerWarranty[];
  serviceRequests: CustomerInquiry[];
  otherSubmissions: CustomerInquiry[];
  careerApplications: CustomerInquiry[];
}

export async function getCustomerDashboard(): Promise<CustomerDashboardData> {
  const res = await fetch(`${API_BASE_URL}/customers/dashboard`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to load dashboard data");
  }
  return data.data;
}

export async function updateCustomerProfile(changes: {
  name?: string;
  mobile?: string;
  city?: string;
  state?: string;
  address?: string;
  pincode?: string;
}): Promise<CustomerProfile> {
  const res = await fetch(`${API_BASE_URL}/customers/me`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(changes),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to update profile");
  }
  return data.data;
}
