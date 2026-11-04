/**
 * Lightweight client-side validation. The backend will re-validate every request (see backend/src/schemas);
 * these checks exist only to give users fast feedback.
 */

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

export function validateRequired(value: string, label: string): string | undefined {
  return value.trim() ? undefined : `${label} is required.`;
}

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return "Email is required.";
  return EMAIL_PATTERN.test(value.trim()) ? undefined : "Enter a valid email address.";
}

export function validateMobile(value: string): string | undefined {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "Mobile number is required.";
  return INDIAN_MOBILE_PATTERN.test(digits) ? undefined : "Enter a 10-digit mobile number starting with 6–9.";
}

export function validateName(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Full name is required.";
  if (trimmed.length < 2) return "Name must be at least 2 characters.";
  return /^[\p{L} .'-]+$/u.test(trimmed) ? undefined : "Name can only contain letters, spaces, dots and hyphens.";
}

/** Password policy: 8+ characters with at least one letter and one number. */
export function validateNewPassword(value: string): string | undefined {
  if (!value) return "Password is required.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return "Password must include at least one letter and one number.";
  return undefined;
}

export function validateSerialNumber(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Serial number is required.";
  return /^[A-Za-z0-9-]{8,20}$/.test(trimmed)
    ? undefined
    : "Serial number must be 8–20 letters, numbers or hyphens. You can find it on the product label.";
}

export function validatePurchaseDate(value: string): string | undefined {
  if (!value) return "Purchase date is required.";
  const date = new Date(value);
  const today = new Date();
  if (date > today) return "Purchase date cannot be in the future.";
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(today.getFullYear() - 5);
  if (date < fiveYearsAgo) return "Products purchased more than 5 years ago cannot be registered.";
  return undefined;
}

export const INVOICE_MAX_BYTES = 5 * 1024 * 1024;
export const INVOICE_ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export function validateInvoiceFile(file: File | null): string | undefined {
  if (!file) return "Upload a copy of your invoice.";
  if (!INVOICE_ACCEPTED_TYPES.includes(file.type)) return "Invoice must be a PDF, JPG or PNG file.";
  if (file.size > INVOICE_MAX_BYTES) return "Invoice file must be 5 MB or smaller.";
  return undefined;
}

export function hasErrors<T>(errors: FieldErrors<T>): boolean {
  return Object.values(errors).some(Boolean);
}
