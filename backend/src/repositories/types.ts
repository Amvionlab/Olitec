/**
 * Domain types and repository contracts. Services depend only on these interfaces, so the
 * mock implementations in ./mock can be swapped for MySQL implementations in Phase 2 without touching services.
 */

import type { UploadFile } from "../utils/uploads.js";

export type WarrantyStatus ="Pending" | "Active" | "Expired" | "Rejected";
export type CustomerStatus = "Active" | "Inactive";
export type SupportStatus = "Open" | "In Progress" | "Resolved";
export type SupportCategory = "Installation" | "Repair" | "Warranty Claim" | "General Enquiry";

export interface Product {
  id: string;
  slug: string;
  name: string;
  model: string;
  category: string;
  warrantyMonths: number;
  priceInr: number;
  description: string;
}

/** Public customer shape — never includes the password hash. */
export interface Customer {
  id: string;
  name: string;
  email: string;
  mobile: string;
  city: string;
  state: string;
  status: CustomerStatus;
  createdAt: string;
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
  dealerName: string;
  startDate: string | null;
  endDate: string | null;
  status: WarrantyStatus;
  adminRemark: string | null;
  submittedAt: string;
  history: WarrantyHistoryEntry[];
}

export interface SupportRequest {
  id: string;
  ticketNumber: string;
  customerId: string;
  warrantyId: string | null;
  category: SupportCategory;
  subject: string;
  message: string;
  status: SupportStatus;
  createdAt: string;
  updatedAt: string;
}

/** Service request from the public website form (no account required). */
export interface ServiceRequest {
  id: string;
  ticketNumber: string;
  name: string;
  mobile: string;
  email: string;
  productModel: string;
  serialNumber: string;
  issueType: string;
  description: string;
  preferredVisitDate: string | null;
  pincode: string;
  photoFileName: string | null;
  status: SupportStatus;
  createdAt: string;
}

/** Warranty registration from the public website form (no account required). */
export interface WarrantyRegistration {
  id: string;
  registrationNumber: string;
  customerName: string;
  email: string;
  mobile: string;
  installationAddress: string;
  productModel: string;
  serialNumber: string;
  purchaseDate: string;
  installationDate: string;
  dealerName: string;
  dealerContact: string | null;
  invoiceFileName: string;
  installationDocumentFileName: string;
  status: WarrantyStatus;
  createdAt: string;
}

export type NewWarrantyRegistration = Omit<
  WarrantyRegistration,
  "id" | "registrationNumber" | "invoiceFileName" | "installationDocumentFileName" | "status" | "createdAt"
> & {
  invoice: UploadFile;
  installationDocument: UploadFile;
};

export interface NewWarranty {
  customerId: string;
  productId: string;
  serialNumber: string;
  purchaseDate: string;
  invoiceNumber: string;
  dealerName: string;
  invoice: UploadFile;
}

export interface NewSupportRequest {
  customerId: string;
  warrantyId: string | null;
  category: SupportCategory;
  subject: string;
  message: string;
  contactName: string;
  contactEmail: string;
  contactMobile: string;
}

export type NewServiceRequest = Omit<ServiceRequest, "id" | "ticketNumber" | "photoFileName" | "status" | "createdAt"> & {
  photo: UploadFile | null;
};

export interface ProductFilter {
  category?: string;
  q?: string;
}

export interface CustomerFilter {
  q?: string;
  status?: CustomerStatus;
}

export interface WarrantyFilter {
  customerId?: string;
  status?: WarrantyStatus;
  productId?: string;
  q?: string;
}

export interface ProductRepository {
  findAll(filter: ProductFilter): Promise<Product[]>;
  findById(id: string): Promise<Product | undefined>;
  findBySlug(slug: string): Promise<Product | undefined>;
}

export interface CustomerRepository {
  findAll(filter: CustomerFilter): Promise<Customer[]>;
  findById(id: string): Promise<Customer | undefined>;
  count(): Promise<number>;
}

export interface WarrantyRepository {
  findAll(filter: WarrantyFilter): Promise<Warranty[]>;
  findById(id: string): Promise<Warranty | undefined>;
  existsBySerial(productId: string, serialNumber: string): Promise<boolean>;
  countByStatus(): Promise<Record<WarrantyStatus, number>>;
  /** Saves a Pending registration with its invoice and the first history entry. */
  create(input: NewWarranty): Promise<Warranty>;
}

export interface SupportRepository {
  findByCustomer(customerId: string): Promise<SupportRequest[]>;
  create(input: NewSupportRequest): Promise<SupportRequest>;
}

export interface ServiceRequestRepository {
  create(input: NewServiceRequest): Promise<ServiceRequest>;
}

/** Public warranty status (/warranty-status): only what the customer needs, never contact details. */
export interface WarrantyStatusLookup {
  model: string;
  serialNumber: string;
  registeredOn: string;
  validUntil: string | null;
  status: WarrantyStatus;
}

export interface WarrantyRegistrationRepository {
  existsBySerial(serialNumber: string): Promise<boolean>;
  /** Matches website registrations and account warranties by serial number AND registered mobile number. */
  findStatus(serialNumber: string, mobile: string): Promise<WarrantyStatusLookup | undefined>;
  /** Saves a Pending registration with its invoice and installation document. */
  create(input: NewWarrantyRegistration): Promise<WarrantyRegistration>;
}
