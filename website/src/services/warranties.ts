import type { Product, SubmitResult, Warranty, WarrantyStatus } from "@/lib/types";
import { apiPost } from "@/lib/api";
import { getAuthHeaders } from "./auth";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api").replace(/\/$/, "");

export interface WarrantyWithProduct extends Warranty {
  product: Product;
}

export async function getMyWarranties(status?: WarrantyStatus): Promise<WarrantyWithProduct[]> {
  try {
    const query = new URLSearchParams();
    if (status) query.set("status", status);

    const res = await fetch(`${API_BASE_URL}/warranties?${query.toString()}`, {
      headers: getAuthHeaders(),
      ...(typeof window === "undefined" ? {} : { cache: "no-store" as RequestCache }),
    });

    const result = await res.json();
    if (res.ok && result.success && Array.isArray(result.data)) {
      return result.data;
    }
  } catch (e: any) {
    if (e?.digest === "DYNAMIC_SERVER_USAGE") throw e;
    // Fallback in case backend is offline
  }
  return [];
}

export async function getWarrantyById(id: string): Promise<WarrantyWithProduct | undefined> {
  try {
    const res = await fetch(`${API_BASE_URL}id}`, {
      headers: getAuthHeaders(),
      ...(typeof window === "undefined" ? {} : { cache: "no-store" as RequestCache }),
    });
    const result = await res.json();
    if (res.ok && result.success && result.data) {
      return result.data;
    }
  } catch (e: any) {
    if (e?.digest === "DYNAMIC_SERVER_USAGE") throw e;
    // Fallback in case backend is offline
  }
  return undefined;
}

export interface WarrantyStatusResult {
  model: string;
  productName?: string;
  capacity?: string;
  mrp?: number;
  warrantyMonths?: number;
  serialNumber: string;
  warrantyNumber?: string;
  customerName?: string;
  mobile?: string;
  installationAddress?: string;
  dealerName?: string;
  purchaseDate?: string | null;
  installationDate?: string | null;
  registeredOn: string;
  validUntil: string | null;
  status: WarrantyStatus;
}

/** Public lookup by serial number (and optional registered mobile number) (used by /warranty-status). */
export async function lookupWarrantyStatus(
  serialNumber: string,
  mobile?: string,
): Promise<SubmitResult<WarrantyStatusResult>> {
  const payload: Record<string, string> = {
    serialNumber: serialNumber.trim(),
  };
  if (mobile?.trim()) {
    payload.mobile = mobile.replace(/\D/g, "");
  }

  const result = await apiPost<WarrantyStatusResult>("/warranty-registrations/status", payload);
  if (!result.ok) {
    return {
      ok: false,
      message:
        result.status === 404 || result.status === 400
          ? "No warranty found for this serial number. Please check the serial number and try again."
          : result.message,
    };
  }
  return { ok: true, message: "Warranty found", data: result.data };
}
