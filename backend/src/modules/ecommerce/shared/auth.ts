/**
 * E-commerce authentication: password hashing, cookie sessions and route guards.
 *
 * - Identities are the shared `customers` and `admins` tables (migration 001).
 * - Passwords: scrypt (N=2^15, r=8, p=1, 16-byte salt), stored as `scrypt$N$r$p$salt$hash`. Never plain text.
 * - Sessions: 32 random bytes in an httpOnly cookie; only the SHA-256 of the token is stored (ecom_sessions).
 * - Customer and admin sessions use different cookies so one browser can hold both without mixing them.
 */
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from "node:crypto";
import type { FastifyReply, FastifyRequest, preHandlerAsyncHookHandler } from "fastify";
import { execute, queryOne } from "../../../db/pool.js";
import { ForbiddenError, UnauthorizedError } from "../../../utils/errors.js";
import { COOKIE, ecomConfig } from "./config.js";
import { clearCookie, clientIp, readCookie, setCookie } from "./http.js";
import { hasPermission, ROLE_PERMISSIONS, type EcomPermission, type EcomRole } from "./permissions.js";

export interface EcomCustomer {
  id: number;
  name: string;
  email: string;
  mobile: string;
}

export interface EcomAdmin {
  id: number;
  name: string;
  email: string;
  role: EcomRole;
  permissions: readonly EcomPermission[];
}

declare module "fastify" {
  interface FastifyRequest {
    ecomCustomer?: EcomCustomer;
    ecomAdmin?: EcomAdmin;
  }
}

// ---------------------------------------------------------------- passwords

const SCRYPT = { N: 32768, r: 8, p: 1, keyLength: 64 };

function scrypt(password: string, salt: Buffer, keyLength: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCallback(password, salt, keyLength, options, (error, key) => (error ? reject(error) : resolve(key))),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, SCRYPT.keyLength, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, maxmem: 128 * SCRYPT.N * SCRYPT.r * 2 });
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64"), hash.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const N = Number(n);
  const R = Number(r);
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length, { N, r: R, p: Number(p), maxmem: 128 * N * R * 2 });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** A valid hash of a random password, used to keep login timing equal when the account does not exist. */
let dummyHash: Promise<string> | undefined;
export function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  return dummyHash;
}

// ---------------------------------------------------------------- tokens and sessions

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

type Subject = "customer" | "admin";

export async function createSession(request: FastifyRequest, reply: FastifyReply, subject: Subject, subjectId: number): Promise<void> {
  const token = newToken();
  const maxAge = subject === "customer" ? ecomConfig.customerSessionDays * 86400 : ecomConfig.adminSessionHours * 3600;
  await execute(
    "INSERT INTO ecom_sessions (token_hash, subject_type, subject_id, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND))",
    [sha256(token), subject, subjectId, clientIp(request), (request.headers["user-agent"] ?? "").slice(0, 255), maxAge],
  );
  setCookie(reply, subject === "customer" ? COOKIE.customer : COOKIE.admin, token, maxAge);
}

export async function destroySession(request: FastifyRequest, reply: FastifyReply, subject: Subject): Promise<void> {
  const name = subject === "customer" ? COOKIE.customer : COOKIE.admin;
  const token = readCookie(request, name);
  if (token) await execute("DELETE FROM ecom_sessions WHERE token_hash = ? AND subject_type = ?", [sha256(token), subject]);
  clearCookie(reply, name);
}

/** Logs out every session of a subject (password reset, suspension). */
export async function destroyAllSessions(subject: Subject, subjectId: number): Promise<void> {
  await execute("DELETE FROM ecom_sessions WHERE subject_type = ? AND subject_id = ?", [subject, subjectId]);
}

async function loadCustomer(request: FastifyRequest): Promise<EcomCustomer | undefined> {
  const token = readCookie(request, COOKIE.customer);
  if (!token) return undefined;
  const row = await queryOne<{ id: number; name: string; email: string; mobile: string }>(
    `SELECT c.id, c.name, c.email, c.mobile
       FROM ecom_sessions s JOIN customers c ON c.id = s.subject_id
      WHERE s.token_hash = ? AND s.subject_type = 'customer' AND s.expires_at > UTC_TIMESTAMP() AND c.status = 'active'`,
    [sha256(token)],
  );
  return row ? { id: Number(row.id), name: row.name, email: row.email, mobile: row.mobile } : undefined;
}

async function loadAdmin(request: FastifyRequest): Promise<EcomAdmin | undefined> {
  const token = readCookie(request, COOKIE.admin);
  if (!token) return undefined;
  const row = await queryOne<{ id: number; name: string; email: string; role: string; ecom_role: EcomRole | null }>(
    `SELECT a.id, a.name, a.email, a.role, r.role AS ecom_role
       FROM ecom_sessions s
       JOIN admins a ON a.id = s.subject_id
       LEFT JOIN ecom_admin_roles r ON r.admin_id = a.id
      WHERE s.token_hash = ? AND s.subject_type = 'admin' AND s.expires_at > UTC_TIMESTAMP() AND a.is_active = TRUE`,
    [sha256(token)],
  );
  if (!row) return undefined;
  const role = resolveEcomRole(row.role, row.ecom_role);
  if (!role) return undefined;
  return { id: Number(row.id), name: row.name, email: row.email, role, permissions: ROLE_PERMISSIONS[role] };
}

/** Super admins always have full shop access; everyone else needs an ecom_admin_roles row. */
export function resolveEcomRole(adminRole: string, ecomRole: EcomRole | null): EcomRole | undefined {
  if (adminRole === "super_admin") return "super_admin";
  return ecomRole ?? undefined;
}

// ---------------------------------------------------------------- route guards

export const optionalCustomer: preHandlerAsyncHookHandler = async (request) => {
  request.ecomCustomer = await loadCustomer(request);
};

export const requireCustomer: preHandlerAsyncHookHandler = async (request) => {
  request.ecomCustomer = await loadCustomer(request);
  if (!request.ecomCustomer) throw new UnauthorizedError("Please sign in to continue.");
};

export function requireAdmin(permission?: EcomPermission): preHandlerAsyncHookHandler {
  return async (request) => {
    // Already loaded by the admin-wide preValidation hook (index.ts) — reuse it instead of a second query.
    request.ecomAdmin ??= await loadAdmin(request);
    if (!request.ecomAdmin) throw new UnauthorizedError("Admin sign-in required.");
    if (permission && !hasPermission(request.ecomAdmin.role, permission)) throw new ForbiddenError();
  };
}

export function customerOf(request: FastifyRequest): EcomCustomer {
  if (!request.ecomCustomer) throw new UnauthorizedError("Please sign in to continue.");
  return request.ecomCustomer;
}

export function adminOf(request: FastifyRequest): EcomAdmin {
  if (!request.ecomAdmin) throw new UnauthorizedError("Admin sign-in required.");
  return request.ecomAdmin;
}
