import type { SubmitResult, SupportCategory, SupportRequest } from "@/lib/types";
import { apiPost } from "@/lib/api";
import { getAuthHeaders } from "./auth";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api").replace(/\/$/, "");

export const supportCategories: SupportCategory[] = ["Installation", "Repair", "Warranty Claim", "General Enquiry"];

export async function getMySupportRequests(): Promise<SupportRequest[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/support`, {
      headers: getAuthHeaders(),
      ...(typeof window === "undefined" ? {} : { cache: "no-store" as RequestCache }),
    });
    const result = await res.json();
    if (res.ok && result.success && Array.isArray(result.data)) {
      return result.data.sort((a: SupportRequest, b: SupportRequest) => b.createdAt.localeCompare(a.createdAt));
    }
  } catch {
    // fallback empty
  }
  return [];
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
