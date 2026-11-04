/**
 * Client for the e-commerce admin API (/api/ecommerce/admin). Unlike the warranty screens (mock data in
 * src/services), these screens talk to the real backend with an httpOnly admin session cookie.
 */
const BASE = `${(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api").replace(/\/$/, "")}/ecommerce`;

export const ECOM_API_BASE = BASE;

export class EcomApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export interface PageMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  pageCount?: number;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<{ data: T; meta: PageMeta }> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: {
        accept: "application/json",
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        // Required by the backend on state-changing requests (CSRF protection).
        ...(method !== "GET" ? { "x-olitec-client": "admin" } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new EcomApiError(0, "NETWORK_ERROR", "Cannot reach the API. Is the backend running?");
  }
  const payload = (await response.json().catch(() => null)) as { success: boolean; data: T; meta?: PageMeta; error?: { code: string; message: string; details?: unknown } } | null;
  if (!response.ok || !payload?.success) {
    const details = payload?.error?.details;
    const fieldText = Array.isArray(details) && details.length && (details[0] as { field?: string }).field ? ` (${details.map((item: { field?: string; message?: string }) => `${item.field}: ${item.message}`).join("; ")})` : "";
    throw new EcomApiError(response.status, payload?.error?.code ?? "UNKNOWN", `${payload?.error?.message ?? "Request failed."}${fieldText}`, details);
  }
  return { data: payload.data, meta: payload.meta ?? {} };
}

export const ecomApi = {
  get: <T>(path: string) => request<T>("GET", path).then((result) => result.data),
  page: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown = {}) => request<T>("POST", path, body).then((result) => result.data),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body).then((result) => result.data),
  delete: <T>(path: string) => request<T>("DELETE", path).then((result) => result.data),
};

export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  const text = search.toString();
  return text ? `?${text}` : "";
}

export function messageOf(error: unknown): string {
  return error instanceof EcomApiError ? error.message : "Something went wrong.";
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
export const money = (value: number) => inr.format(value);

export const label = (value: string | null | undefined) => (value ? value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "—");
