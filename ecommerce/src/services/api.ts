/**
 * API client for the shared backend (/api/ecommerce). Works in the browser (cookies sent with credentials)
 * and on the Next.js server (public catalogue pages, cached with `revalidate`).
 */
import type { PageMeta } from "@/types";

const PUBLIC_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api").replace(/\/$/, "");
const SERVER_BASE = (process.env.API_INTERNAL_BASE_URL || PUBLIC_BASE).replace(/\/$/, "");

export const API_BASE = `${PUBLIC_BASE}/ecommerce`;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface Envelope<T> {
  success: boolean;
  data: T;
  meta?: PageMeta;
  error?: { code: string; message: string; details?: unknown };
}

type Options = Omit<RequestInit, "body"> & { body?: unknown; revalidate?: number | false };

async function request<T>(path: string, options: Options = {}): Promise<{ data: T; meta: PageMeta }> {
  const onServer = typeof window === "undefined";
  const base = `${onServer ? SERVER_BASE : PUBLIC_BASE}/ecommerce`;
  const { body, revalidate, headers, ...init } = options;
  const method = (init.method ?? "GET").toUpperCase();

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...init,
      method,
      credentials: "include",
      headers: {
        accept: "application/json",
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        // Required by the backend on every state-changing request (CSRF protection).
        ...(method !== "GET" ? { "x-olitec-client": "storefront" } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      ...(onServer && method === "GET" ? { next: { revalidate: revalidate ?? 60 } } : { cache: "no-store" as const }),
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "We could not reach the store. Check your connection and try again.");
  }

  const payload = (await response.json().catch(() => null)) as Envelope<T> | null;
  if (!response.ok || !payload?.success) {
    throw new ApiError(
      response.status,
      payload?.error?.code ?? "UNKNOWN",
      payload?.error?.message ?? "Something went wrong. Please try again.",
      payload?.error?.details,
    );
  }
  return { data: payload.data, meta: payload.meta ?? {} };
}

export const api = {
  get: <T>(path: string, options?: Options) => request<T>(path, options).then((result) => result.data),
  page: <T>(path: string, options?: Options) => request<T>(path, options),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body ?? {} }).then((result) => result.data),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body }).then((result) => result.data),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }).then((result) => result.data),
};

export function toQuery(params: Record<string, string | number | boolean | string[] | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) value.forEach((item) => search.append(key, item));
    else search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}
