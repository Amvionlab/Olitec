/**
 * Minimal client for the backend API (NEXT_PUBLIC_API_BASE_URL). Unwraps the { success, data | error } envelope.
 * Used by form submissions that are saved to the database; read-only pages still use src/mock.
 */
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api").replace(/\/$/, "");

export type ApiResult<T> =
  /** persisted is false when the backend runs on mock data and only simulated the write. */
  | { ok: true; data: T; persisted?: boolean }
  | { ok: false; status: number; code: string; message: string; fields: Record<string, string> };

interface Envelope<T> {
  success: boolean;
  data?: T;
  meta?: { source?: string; persisted?: boolean };
  error?: { code: string; message: string; details?: unknown };
}

export async function apiPost<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
headers: {
  "content-type": "application/json",
  "x-olitec-client": "storefront",
},      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 0, code: "NETWORK_ERROR", message: "We could not reach the server. Check your connection and try again.", fields: {} };
  }

  const envelope = (await response.json().catch(() => ({}))) as Envelope<T>;
  if (response.ok && envelope.success) return { ok: true, data: envelope.data as T, persisted: envelope.meta?.persisted };

  const fields: Record<string, string> = {};
  if (Array.isArray(envelope.error?.details)) {
    for (const issue of envelope.error.details as { field?: string; message?: string }[]) {
      if (issue.field) fields[issue.field.split(".")[0]] = issue.message ?? "Invalid value.";
    }
  }
  return {
    ok: false,
    status: response.status,
    code: envelope.error?.code ?? "UNKNOWN_ERROR",
    message:
      response.status === 413
        ? "The file is too large to upload."
        : (envelope.error?.message ?? "Something went wrong. Please try again later."),
    fields,
  };
}

export async function apiGet<T>(path: string): Promise<ApiResult<T>> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      status: 0,
      code: "NETWORK_ERROR",
      message: "Unable to reach the server.",
      fields: {},
    };
  }

  const envelope = (await response.json().catch(() => ({}))) as Envelope<T>;

  if (response.ok && envelope.success) {
    return {
      ok: true,
      data: envelope.data as T,
      persisted: envelope.meta?.persisted,
    };
  }

  return {
    ok: false,
    status: response.status,
    code: envelope.error?.code ?? "UNKNOWN_ERROR",
    message: envelope.error?.message ?? "Unable to load data.",
    fields: {},
  };
}

export async function apiPatch<T>(
  path: string,
  body: unknown
): Promise<ApiResult<T>> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "PATCH",
      credentials: "include",
headers: {
  "content-type": "application/json",
  "x-olitec-client": "storefront",
},      body: JSON.stringify(body),
    });
  } catch {
    return {
      ok: false,
      status: 0,
      code: "NETWORK_ERROR",
      message: "Unable to reach the server.",
      fields: {},
    };
  }

  const envelope = (await response.json().catch(() => ({}))) as Envelope<T>;

  if (response.ok && envelope.success) {
    return {
      ok: true,
      data: envelope.data as T,
      persisted: envelope.meta?.persisted,
    };
  }

  return {
    ok: false,
    status: response.status,
    code: envelope.error?.code ?? "UNKNOWN_ERROR",
    message: envelope.error?.message ?? "Unable to update profile.",
    fields: {},
  };
}

export interface UploadPayload {
  fileName: string;
  contentType: string;
  dataBase64: string;
}

/** Reads a file into the { fileName, contentType, dataBase64 } shape the API accepts for uploads. */
export function fileToUpload(file: File): Promise<UploadPayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      resolve({ fileName: file.name, contentType: file.type, dataBase64: dataUrl.slice(dataUrl.indexOf(",") + 1) });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
