import type { FastifyRequest, preHandlerAsyncHookHandler } from "fastify";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";
import { verifyToken, type TokenPayload } from "../utils/crypto.js";

export type AdminRole = "Super Admin" | "Warranty Reviewer";
export type AdminPermission = "reviewWarranties" | "updateWarrantyStatus" | "viewCustomers";

export type Principal =
  | { kind: "customer"; id: string; name: string; email?: string }
  | { kind: "admin"; id: string; name: string; role: AdminRole; email?: string };

declare module "fastify" {
  interface FastifyRequest {
    principal?: Principal;
    user?: TokenPayload;
  }
}

const DEMO_ADMIN: Extract<Principal, { kind: "admin" }> = {
  kind: "admin",
  id: "1",
  name: "Olitec Administrator",
  role: "Super Admin",
  email: "admin@olitec.in",
};

export function extractBearerToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = request.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/olitec_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

export const requireCustomer: preHandlerAsyncHookHandler = async (request) => {
  const token = extractBearerToken(request);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      request.user = payload;
      request.principal = {
        kind: "customer",
        id: String(payload.id),
        name: payload.name,
        email: payload.email,
      };
      return;
    }
  }

  // Fallback demo in development only if no authorization provided
  if (process.env.NODE_ENV !== "production") {
    request.principal = { kind: "customer", id: "2", name: "Priya Sharma", email: "priya@example.com" };
    return;
  }

  throw new UnauthorizedError("Authentication required.");
};

export function requireAdmin(_permission?: AdminPermission): preHandlerAsyncHookHandler {
  return async (request) => {
    const token = extractBearerToken(request);
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        if (payload.role !== "admin") {
          throw new ForbiddenError("Admin access required.");
        }
        request.user = payload;
        request.principal = {
          kind: "admin",
          id: String(payload.id),
          name: payload.name,
          role: "Super Admin",
          email: payload.email,
        };
        return;
      }
      throw new UnauthorizedError("Invalid or expired session token.");
    }

    // Fallback demo admin in development if no token provided
    if (process.env.NODE_ENV !== "production") {
      request.principal = DEMO_ADMIN;
      return;
    }

    throw new UnauthorizedError("Admin authentication required.");
  };
}

export function getCustomerId(principal: Principal | undefined): string {
  if (!principal) throw new ForbiddenError("Authentication required.");
  return principal.id;
}

export function getAdminName(principal: Principal | undefined): string {
  if (principal?.kind !== "admin") throw new ForbiddenError("Admin account required.");
  return principal.name;
}
