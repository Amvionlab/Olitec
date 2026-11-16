import type { SubmitResult } from "@/lib/types";
import type { EnquiryKind } from "@/content/forms";
import { apiPost, fileToUpload } from "@/lib/api";

export type EnquiryValues = Record<string, string>;

/** All inquiry kinds are live and stored in MySQL database */
export const savedEnquiryKinds: readonly EnquiryKind[] = [
  "service",
  "career",
  "partner",
  "consultation",
];

export async function submitEnquiry(
  kind: EnquiryKind,
  values: EnquiryValues,
  files: Record<string, File> = {},
): Promise<SubmitResult<{ reference?: string }>> {
  const name = (values.name || values.fullName || "Customer").trim();
  const email = (values.email || "").trim().toLowerCase();
  const mobile = (values.mobile || "").replace(/\D/g, "");
  const city = values.city || values.location || values.pincode || undefined;

  let fileUrl: string | undefined;
  if (files.photos) {
    fileUrl = files.photos.name;
  } else if (files.resume) {
    fileUrl = files.resume.name;
  }

  const result = await apiPost<{ referenceNo: string }>("/inquiries", {
    kind,
    name,
    email,
    mobile,
    city,
    details: values,
    fileUrl,
  });

  if (!result.ok) {
    return {
      ok: false,
      message: result.message || "Failed to submit request.",
      fieldErrors: result.fields,
    };
  }

  return {
    ok: true,
    data: { reference: result.data.referenceNo },
    message: "Your submission has been received successfully.",
  };
}
