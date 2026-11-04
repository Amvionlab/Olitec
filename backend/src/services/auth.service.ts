/**
 * Authentication is intentionally NOT implemented in Phase 1. These methods exist so the routes,
 * validation and response contract are in place. Each one throws 501 rather than pretending to succeed.
 *
 * Phase 2 checklist:
 *  - hash passwords with argon2id (or bcrypt cost >= 12); never store or log plain text
 *  - issue a signed, httpOnly, Secure, SameSite session cookie
 *  - rate-limit login attempts and use a generic error for wrong email or password
 */
import type { LoginBody, RegisterBody } from "../schemas/auth.schema.js";
import { NotImplementedError } from "../utils/errors.js";

export interface AuthService {
  registerCustomer(input: RegisterBody): Promise<never>;
  loginCustomer(input: LoginBody): Promise<never>;
  loginAdmin(input: LoginBody): Promise<never>;
  logout(): Promise<never>;
}

export const authService: AuthService = {
  async registerCustomer() {
    throw new NotImplementedError("Customer registration");
  },
  async loginCustomer() {
    throw new NotImplementedError("Customer login");
  },
  async loginAdmin() {
    throw new NotImplementedError("Admin login");
  },
  async logout() {
    throw new NotImplementedError("Logout");
  },
};
