// The request list reads mock data (Phase 2: GET /api/support). createSupportRequest is saved through the API.
import type { SubmitResult, SupportCategory, SupportRequest } from "@/lib/types";
import { apiPost } from "@/lib/api";
import { mockSupportRequests } from "@/mock/data";

export const supportCategories: SupportCategory[] = ["Installation", "Repair", "Warranty Claim", "General Enquiry"];

export async function getMySupportRequests(): Promise<SupportRequest[]> {
  return [...mockSupportRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface SupportRequestInput {
  name: string;
  email: string;
  mobile: string;
  category: SupportCategory;
  warrantyNumber: string;
  subject: string;
  message: string;
}

/** Saves the ticket (POST /api/support). */
export async function createSupportRequest(input: SupportRequestInput): Promise<SubmitResult<SupportRequest>> {
  const warrantyNumber = input.warrantyNumber.trim() || undefined;
  const result = await apiPost<Omit<SupportRequest, "warrantyNumber">>("/support", {
    name: input.name.trim(),
    email: input.email.trim(),
    mobile: input.mobile.replace(/\D/g, ""),
    category: input.category,
    warrantyNumber,
    subject: input.subject.trim(),
    message: input.message.trim(),
  });
  if (!result.ok) return { ok: false, message: result.message, fieldErrors: result.fields };
  return {
    ok: true,
    message: "Support request submitted. We usually respond within one working day.",
    data: { ...result.data, warrantyNumber },
  };
}
