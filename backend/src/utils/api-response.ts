/**
 * Every endpoint responds with one of these two shapes.
 *
 *   { "success": true,  "data": ..., "meta": { "source": "mock", ... } }
 *   { "success": false, "error": { "code": "NOT_FOUND", "message": "...", "details": ... } }
 */
import { env } from "../config/env.js";

export interface ResponseMeta {
  /** Where the data came from. "mock" means sample data from src/repositories/mock, "database" means MySQL. */
  source: "mock" | "database";
  /** False when a write was simulated and nothing was stored. */
  persisted?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  pageCount?: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

export interface ApiFailure {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

export function ok<T>(data: T, meta: Partial<ResponseMeta> = {}): ApiSuccess<T> {
  return { success: true, data, meta: { source: env.dataSource, ...meta } };
}

/** For writes that go through the repositories: stored in MySQL, simulated with the mock data. */
export function okWritten<T>(data: T): ApiSuccess<T> {
  return ok(data, { persisted: env.dataSource === "database" });
}

/** For simulated writes: the response looks like the real one, but meta.persisted is false. */
export function okNotPersisted<T>(data: T): ApiSuccess<T> {
  return ok(data, { persisted: false });
}

export function fail(code: string, message: string, details?: unknown): ApiFailure {
  return { success: false, error: { code, message, ...(details === undefined ? {} : { details }) } };
}
