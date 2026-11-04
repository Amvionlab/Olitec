import type { FastifyReply, FastifyRequest } from "fastify";
import { execute, queryOne, withTransaction } from "../../../db/pool.js";
import { BusinessRuleError, ConflictError, UnauthorizedError } from "../../../utils/errors.js";
import { cartService } from "../cart/cart.service.js";
import { audit } from "../shared/audit.js";
import {
  createSession,
  destroyAllSessions,
  destroySession,
  getDummyHash,
  hashPassword,
  newToken,
  resolveEcomRole,
  sha256,
  verifyPassword,
} from "../shared/auth.js";
import { ecomConfig } from "../shared/config.js";
import { ROLE_LABELS, ROLE_PERMISSIONS, type EcomRole } from "../shared/permissions.js";

const RESET_MINUTES = 30;
const GENERIC_RESET_MESSAGE = "If an account exists for this email, a password reset link has been sent.";

/**
 * Password-reset delivery. No email/SMS provider is configured in this project yet, so outside production the
 * link is written to the server log for testing. In production the token is created but NOT logged — connect an
 * email provider here before enabling self-service resets (see README).
 */
function deliverResetLink(request: FastifyRequest, email: string, url: string) {
  if (process.env.NODE_ENV !== "production") request.log.info({ email, url }, "Password reset link (development only — no email provider configured)");
}

export const authService = {
  // ------------------------------------------------------------------ customers (shared `customers` table)

  async register(request: FastifyRequest, reply: FastifyReply, input: { name: string; email: string; mobile: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    const passwordHash = await hashPassword(input.password);
    let id: number;
    try {
      id = (await execute("INSERT INTO customers (name, email, mobile, password_hash) VALUES (?, ?, ?, ?)", [input.name.trim(), email, input.mobile, passwordHash])).insertId;
    } catch (error) {
      if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
        throw new ConflictError(String((error as Error).message).includes("mobile") ? "An account with this mobile number already exists." : "An account with this email already exists. Please sign in.");
      }
      throw error;
    }
    await createSession(request, reply, "customer", id);
    await cartService.mergeGuestCart(request, reply, id);
    // Earlier guest orders are deliberately NOT attached by email: emails are not verified yet, so that would let
    // anyone see another person's orders by registering with their address. Guests keep their order links/tracking.
    return { id, name: input.name.trim(), email, mobile: input.mobile };
  },

  async login(request: FastifyRequest, reply: FastifyReply, input: { email: string; password: string }) {
    const row = await queryOne<{ id: number; name: string; email: string; mobile: string; password_hash: string; status: string }>(
      "SELECT id, name, email, mobile, password_hash, status FROM customers WHERE email = ?",
      [input.email.trim().toLowerCase()],
    );
    const valid = await verifyPassword(input.password, row?.password_hash ?? (await getDummyHash()));
    if (!row || !valid) throw new UnauthorizedError("Incorrect email or password.");
    if (row.status !== "active") throw new UnauthorizedError("This account has been suspended. Please contact support.");
    await createSession(request, reply, "customer", Number(row.id));
    await execute("UPDATE customers SET last_login_at = UTC_TIMESTAMP() WHERE id = ?", [row.id]);
    await cartService.mergeGuestCart(request, reply, Number(row.id));
    return { id: Number(row.id), name: row.name, email: row.email, mobile: row.mobile };
  },

  logout: (request: FastifyRequest, reply: FastifyReply) => destroySession(request, reply, "customer"),

  async updateProfile(customerId: number, input: { name?: string; mobile?: string }) {
    try {
      await execute("UPDATE customers SET name = COALESCE(?, name), mobile = COALESCE(?, mobile) WHERE id = ?", [input.name?.trim() ?? null, input.mobile ?? null, customerId]);
    } catch (error) {
      if ((error as { code?: string }).code === "ER_DUP_ENTRY") throw new ConflictError("This mobile number is already used by another account.");
      throw error;
    }
    return queryOne("SELECT id, name, email, mobile FROM customers WHERE id = ?", [customerId]);
  },

  async changePassword(request: FastifyRequest, reply: FastifyReply, subject: "customer" | "admin", id: number, current: string, next: string) {
    const table = subject === "customer" ? "customers" : "admins";
    const row = await queryOne<{ password_hash: string }>(`SELECT password_hash FROM ${table} WHERE id = ?`, [id]);
    if (!row || !(await verifyPassword(current, row.password_hash))) throw new BusinessRuleError("Your current password is incorrect.");
    await execute(`UPDATE ${table} SET password_hash = ? WHERE id = ?`, [await hashPassword(next), id]);
    // Sign out other devices, then issue a fresh session here.
    await destroyAllSessions(subject, id);
    await createSession(request, reply, subject, id);
    if (subject === "admin") await audit(request, "admin.password_change", "admin", id);
  },

  async forgotPassword(request: FastifyRequest, subject: "customer" | "admin", emailInput: string) {
    const email = emailInput.trim().toLowerCase();
    const table = subject === "customer" ? "customers" : "admins";
    const active = subject === "customer" ? "status = 'active'" : "is_active = TRUE";
    const row = await queryOne<{ id: number }>(`SELECT id FROM ${table} WHERE email = ? AND ${active}`, [email]);
    if (row) {
      const token = newToken();
      await execute(
        "INSERT INTO ecom_password_resets (token_hash, subject_type, subject_id, expires_at) VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE))",
        [sha256(token), subject, row.id, RESET_MINUTES],
      );
      const base = subject === "customer" ? ecomConfig.siteUrl : (process.env.ECOM_ADMIN_URL ?? "http://localhost:3001");
      const path = subject === "customer" ? "/reset-password" : "/ecommerce/reset-password";
      deliverResetLink(request, email, `${base}${path}?token=${encodeURIComponent(token)}`);
    }
    // Same response whether or not the account exists (no account enumeration).
    return { message: GENERIC_RESET_MESSAGE };
  },

  async resetPassword(subject: "customer" | "admin", token: string, password: string) {
    const passwordHash = await hashPassword(password);
    await withTransaction(async (db) => {
      const reset = await queryOne<{ id: number; subject_id: number }>(
        "SELECT id, subject_id FROM ecom_password_resets WHERE token_hash = ? AND subject_type = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP() FOR UPDATE",
        [sha256(token), subject],
        db,
      );
      if (!reset) throw new BusinessRuleError("This reset link is invalid or has expired. Please request a new one.");
      await execute(`UPDATE ${subject === "customer" ? "customers" : "admins"} SET password_hash = ? WHERE id = ?`, [passwordHash, reset.subject_id], db);
      await execute("UPDATE ecom_password_resets SET used_at = UTC_TIMESTAMP() WHERE id = ?", [reset.id], db);
      await execute("DELETE FROM ecom_sessions WHERE subject_type = ? AND subject_id = ?", [subject, reset.subject_id], db);
    });
    return { message: "Your password has been reset. Please sign in." };
  },

  // ------------------------------------------------------------------ admins (shared `admins` table)

  async adminLogin(request: FastifyRequest, reply: FastifyReply, input: { email: string; password: string }) {
    const row = await queryOne<{ id: number; name: string; email: string; password_hash: string; role: string; is_active: number; ecom_role: EcomRole | null }>(
      "SELECT a.id, a.name, a.email, a.password_hash, a.role, a.is_active, r.role AS ecom_role FROM admins a LEFT JOIN ecom_admin_roles r ON r.admin_id = a.id WHERE a.email = ?",
      [input.email.trim().toLowerCase()],
    );
    const valid = await verifyPassword(input.password, row?.password_hash ?? (await getDummyHash()));
    const role = row ? resolveEcomRole(row.role, row.ecom_role) : undefined;
    if (!row || !valid || !row.is_active) {
      request.log.warn({ email: input.email }, "Failed admin sign-in");
      throw new UnauthorizedError("Incorrect email or password.");
    }
    if (!role) throw new UnauthorizedError("Your account does not have access to the e-commerce admin.");
    await createSession(request, reply, "admin", Number(row.id));
    await execute("UPDATE admins SET last_login_at = UTC_TIMESTAMP() WHERE id = ?", [row.id]);
    request.ecomAdmin = { id: Number(row.id), name: row.name, email: row.email, role, permissions: ROLE_PERMISSIONS[role] };
    await audit(request, "admin.login", "admin", row.id);
    return this.adminView(request.ecomAdmin);
  },

  adminView(admin: { id: number; name: string; email: string; role: EcomRole; permissions: readonly string[] }) {
    return { id: admin.id, name: admin.name, email: admin.email, role: admin.role, roleLabel: ROLE_LABELS[admin.role], permissions: admin.permissions };
  },
};
