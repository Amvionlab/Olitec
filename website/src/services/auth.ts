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
  try {
    const API_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://localhost:4000/api";

    const response = await fetch(
      `${API_URL}/ecommerce/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-olitec-client": "website",
        },
        credentials: "include",
        body: JSON.stringify({
          email: input.email.trim().toLowerCase(),
          password: input.password,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        message:
          result.error?.message ||
          result.message ||
          "Invalid email or password.",
      };
    }

    return {
      ok: true,
      data: undefined,
      message: "Login successful.",
    };
  } catch (error) {
    console.error("Login API error:", error);

    return {
      ok: false,
      message: "Unable to connect to backend.",
    };
  }
}


export async function register(
  input: RegisterInput
): Promise<SubmitResult> {
  try {
    const API_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://localhost:4000/api";

    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(input),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        message: result.error?.message || "Registration failed.",
      };
    }

    return {
      ok: true,
      data: undefined,
      message: "Account created successfully.",
    };
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      message: "Unable to connect to backend.",
    };
  }
}