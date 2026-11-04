import type { FastifyReply, FastifyRequest } from "fastify";
import { ok, type ResponseMeta } from "../../../utils/api-response.js";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../../../utils/pagination.js";
import { ecomConfig } from "./config.js";

/** Success envelope for e-commerce responses — same shape as the rest of the API, but backed by MySQL. */
export function dbOk<T>(data: T, meta: Partial<ResponseMeta> = {}) {
  return ok(data, { source: "database", ...meta });
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
}

/** SQL LIMIT/OFFSET for a page query, plus a function that builds the response meta once the total is known. */
export function pageWindow(query: PageQuery) {
  const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const page = Math.max(1, query.page ?? 1);
  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    meta: (total: number): Partial<ResponseMeta> => ({ page, pageSize, total, pageCount: Math.max(1, Math.ceil(total / pageSize)) }),
  };
}

export function readCookie(request: FastifyRequest, name: string): string | undefined {
  const header = request.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      try {
        return decodeURIComponent(part.slice(index + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

/** Sets an httpOnly cookie. SameSite=Lax + the CSRF header check in index.ts protect state-changing requests. */
export function setCookie(reply: FastifyReply, name: string, value: string, maxAgeSeconds: number): void {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAgeSeconds}`];
  if (ecomConfig.cookieSecure) parts.push("Secure");
  if (ecomConfig.cookieDomain) parts.push(`Domain=${ecomConfig.cookieDomain}`);
  const existing = reply.getHeader("set-cookie");
  const list = Array.isArray(existing) ? existing : existing ? [String(existing)] : [];
  reply.header("set-cookie", [...list, parts.join("; ")]);
}

export function clearCookie(reply: FastifyReply, name: string): void {
  setCookie(reply, name, "", 0);
}

export function clientIp(request: FastifyRequest): string {
  return request.ip;
}

/** Sends a CSV file. Values are quoted and formula-leading characters are escaped (CSV injection). */
export function sendCsv(reply: FastifyReply, fileName: string, header: string[], rows: unknown[][]) {
  const escape = (value: unknown) => {
    if (value === null || value === undefined) return "";
    let text = value instanceof Date ? value.toISOString() : String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const body = [header, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
  return reply
    .header("content-type", "text/csv; charset=utf-8")
    .header("content-disposition", `attachment; filename="${fileName.replace(/[^a-z0-9._-]/gi, "_")}"`)
    .header("cache-control", "no-store")
    .send(`﻿${body}`);
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Parses a JSON column that mysql2 may return as a string or an object. */
export function json<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
