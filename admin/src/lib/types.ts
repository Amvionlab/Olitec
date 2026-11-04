export type WarrantyStatus = "Pending" | "Active" | "Expired" | "Rejected";
export type CustomerStatus = "Active" | "Inactive";

export interface Product {
  id: string;
  name: string;
  model: string;
  category: string;
  warrantyMonths: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  mobile: string;
  city: string;
  state: string;
  status: CustomerStatus;
  registeredAt: string;
}

export interface WarrantyHistoryEntry {
  at: string;
  action: string;
  by: string;
  remark?: string;
}

export interface Warranty {
  id: string;
  warrantyNumber: string;
  customerId: string;
  productId: string;
  serialNumber: string;
  purchaseDate: string;
  invoiceNumber: string;
  invoiceFileName: string;
  dealerName: string;
  startDate: string | null;
  endDate: string | null;
  status: WarrantyStatus;
  submittedAt: string;
  remark?: string;
  history: WarrantyHistoryEntry[];
}

export interface WarrantyWithRelations extends Warranty {
  customer: Customer;
  product: Product;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export type AdminRole = "Super Admin" | "Warranty Reviewer";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}
