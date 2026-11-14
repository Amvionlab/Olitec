// Account lists read mock data (Phase 2: /api/warranties for the signed-in customer).
// The public status lookup goes to the API.
// Registration is saved by components/warranties/WarrantyRegistrationForm via POST /api/warranty-registrations.
import type { Product, SubmitResult, Warranty, WarrantyStatus } from "@/lib/types";
import { apiPost } from "@/lib/api";

export interface WarrantyWithProduct extends Warranty {
  product: Product;
}

export async function getMyWarranties(
  status?: WarrantyStatus
): Promise<WarrantyWithProduct[]> {
  return [];
}

export async function getWarrantyById(
  id: string
): Promise<WarrantyWithProduct | undefined> {
  return undefined;
}



export interface WarrantyStatusResult {
  model: string;
  serialNumber: string;
  registeredOn: string;
  validUntil: string | null;
  status: WarrantyStatus;
}

/** Public lookup by serial number and registered mobile number (used by /warranty-status). */
export async function lookupWarrantyStatus(serialNumber: string, mobile: string): Promise<SubmitResult<WarrantyStatusResult>> {
  const result = await apiPost<WarrantyStatusResult>("/warranty-registrations/status", {
    serialNumber: serialNumber.trim(),
    mobile: mobile.replace(/\D/g, ""),
  });
  if (!result.ok) {
    return {
      ok: false,
      message:
        result.status === 404 || result.status === 400
          ? "We could not find a warranty for this serial number and mobile number. Check both and try again."
          : result.message,
    };
  }
  return { ok: true, message: "Warranty found", data: result.data };
}
