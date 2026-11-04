/**
 * AUTHENTICATION PLACEHOLDER — NOT SECURE, Phase 1 only.
 *
 * Outside production these hooks attach a fixed demo principal so the mock routes can be exercised.
 * In production they reject every request with 501, so this skeleton cannot be deployed with open routes by mistake.
 *
 * Phase 2: verify a signed, httpOnly session cookie (or bearer token), load the user from the database,
 * and enforce role permissions server-side.
 */
import type { preHandlerAsyncHookHandler } from "fastify";
import { env } from "../config/env.js";
import { ForbiddenError, NotImplementedError } from "../utils/errors.js";

export type AdminRole = "Super Admin" | "Warranty Reviewer";
export type AdminPermission = "reviewWarranties" | "updateWarrantyStatus" | "viewCustomers";

export type Principal =
  | { kind: "customer"; id: string; name: string }
  | { kind: "admin"; id: string; name: string; role: AdminRole };

declare module "fastify" {
  interface FastifyRequest {
    principal?: Principal;
  }
}

const rolePermissions: Record<AdminRole, AdminPermission[]> = {
  "Super Admin": ["reviewWarranties", "updateWarrantyStatus", "viewCustomers"],
  "Warranty Reviewer": ["reviewWarranties", "viewCustomers"],
};

const DEMO_CUSTOMER: Principal = { kind: "customer", id: "cus_2041", name: "Priya Sharma" };
const DEMO_ADMIN: Extract<Principal, { kind: "admin" }> = { kind: "admin", id: "adm_01", name: "Anita Rao", role: "Super Admin" };

function guardProduction(): void {
  if (env.isProduction) throw new NotImplementedError("Authentication");
}

export const requireCustomer: preHandlerAsyncHookHandler = async (request) => {
  guardProduction();
  request.principal = DEMO_CUSTOMER;
};

export function requireAdmin(permission?: AdminPermission): preHandlerAsyncHookHandler {
  return async (request) => {
    guardProduction();
    request.principal = DEMO_ADMIN;
    if (permission && !rolePermissions[DEMO_ADMIN.role].includes(permission)) {
      throw new ForbiddenError();
    }
  };
}

export function getCustomerId(principal: Principal | undefined): string {
  if (principal?.kind !== "customer") throw new ForbiddenError("Customer account required.");
  return principal.id;
}

export function getAdminName(principal: Principal | undefined): string {
  if (principal?.kind !== "admin") throw new ForbiddenError("Admin account required.");
  return principal.name;
}
