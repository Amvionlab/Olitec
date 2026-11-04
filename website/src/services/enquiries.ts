// Service requests are saved through POST /api/service-requests.
// Partner, consultation and careers forms are still simulated (Phase 2: POST /api/enquiries/:kind).
import type { SubmitResult } from "@/lib/types";
import type { EnquiryKind } from "@/content/forms";
import { apiPost, fileToUpload } from "@/lib/api";
import { mockDelay } from "./mock-delay";

export type EnquiryValues = Record<string, string>;

/** Enquiry kinds that are actually sent and saved; the form says so when a submission is only simulated. */
export const savedEnquiryKinds: readonly EnquiryKind[] = ["service"];

export async function submitEnquiry(
  kind: EnquiryKind,
  values: EnquiryValues,
  files: Record<string, File> = {},
): Promise<SubmitResult<{ reference?: string }>> {
  if (kind === "service") {
    const result = await apiPost<{ ticketNumber: string }>("/service-requests", {
      name: values.name.trim(),
      mobile: values.mobile.replace(/\D/g, ""),
      email: values.email.trim(),
      model: values.model,
      serial: values.serial.trim(),
      issue: values.issue,
      description: values.description.trim(),
      visitDate: values.visitDate || undefined,
      pincode: values.pincode.trim(),
      photo: files.photos ? await fileToUpload(files.photos) : undefined,
    });
    if (!result.ok) {
      // The form names the photo input "photos"; the API calls it "photo".
      const { photo, ...fieldErrors } = result.fields;
      return { ok: false, message: result.message, fieldErrors: photo ? { ...fieldErrors, photos: photo } : fieldErrors };
    }
    return { ok: true, data: { reference: result.data.ticketNumber }, message: "Service request registered." };
  }

  // MOCK for the partner, consultation and careers forms: nothing is sent, saved or uploaded.
  await mockDelay();
  void values;
  return { ok: true, data: {}, message: "Submitted." };
}
