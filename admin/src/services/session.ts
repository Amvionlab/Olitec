/**
 * MOCK admin session — Phase 1 only. There is no real authentication: every visitor is treated as the demo admin.
 * Phase 2: replace with POST /api/admin/auth/login and a server-verified, httpOnly session cookie,
 * and protect every panel route.
 */
import type { AdminUser } from "@/lib/types";
import { mockAdmin } from "@/mock/data";

export async function getCurrentAdmin(): Promise<AdminUser> {
  return mockAdmin;
}

export async function mockAdminLogin(email: string): Promise<{ ok: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  if (email.trim().toLowerCase() !== mockAdmin.email) {
    return { ok: false, message: "Invalid email or password." };
  }
  return { ok: true, message: "Signed in." };
}
