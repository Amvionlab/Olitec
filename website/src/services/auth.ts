/**
 * MOCK authentication — Phase 1 only. No session, token or cookie is created and no password is checked.
 * Phase 2: replace with POST /api/auth/login and POST /api/auth/register using secure, httpOnly sessions.
 */
import type { SubmitResult } from "@/lib/types";
import { mockRegisteredEmails } from "@/mock/data";
import { mockDelay } from "./mock-delay";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  mobile: string;
  password: string;
}

export async function login(input: LoginInput): Promise<SubmitResult> {
  await mockDelay();
  if (!mockRegisteredEmails.includes(input.email.trim().toLowerCase())) {
    return { ok: false, message: "We couldn't find an account with that email and password." };
  }
  return { ok: true, data: undefined, message: "Signed in." };
}

export async function register(input: RegisterInput): Promise<SubmitResult> {
  await mockDelay();
  if (mockRegisteredEmails.includes(input.email.trim().toLowerCase())) {
    return {
      ok: false,
      message: "An account with this email already exists.",
      fieldErrors: { email: "This email is already registered. Try signing in instead." },
    };
  }
  return { ok: true, data: undefined, message: "Account created. You can now sign in." };
}
