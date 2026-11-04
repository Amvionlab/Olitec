export type WarrantyStatus = "Pending" | "Active" | "Expired" | "Rejected";

export type SupportStatus = "Open" | "In Progress" | "Resolved";

export type ProductCategory =
  | "Water Purifier"
  | "Inverter"
  | "Battery"
  | "Air Cooler"
  | "Ceiling Fan"
  | "Kitchen Appliance";

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  model: string;
  category: ProductCategory;
  shortDescription: string;
  description: string;
  warrantyMonths: number;
  priceInr: number;
  features: string[];
  specs: ProductSpec[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  mobile: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  memberSince: string;
}

export interface Warranty {
  id: string;
  warrantyNumber: string;
  productId: string;
  serialNumber: string;
  purchaseDate: string;
  invoiceNumber: string;
  dealerName: string;
  /** Null until the warranty is approved. */
  startDate: string | null;
  endDate: string | null;
  status: WarrantyStatus;
  submittedAt: string;
  /** Remark added by an admin, e.g. the reason for a rejection. */
  remark?: string;
}

export interface SupportRequest {
  id: string;
  ticketNumber: string;
  subject: string;
  category: SupportCategory;
  message: string;
  warrantyNumber?: string;
  status: SupportStatus;
  createdAt: string;
  updatedAt: string;
}

export type SupportCategory = "Installation" | "Repair" | "Warranty Claim" | "General Enquiry";

/** Result shape returned by mock form submissions. Mirrors the planned API response format. */
export type SubmitResult<T = undefined> =
  | { ok: true; data: T; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };
