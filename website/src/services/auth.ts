import type { SubmitResult } from "@/lib/types";

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  mobile: string;
  role: "customer" | "admin";
  status: "active" | "inactive";
  city?: string;
  state?: string;
}

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

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api").replace(/\/$/, "");

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("olitec_token");
}

export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("olitec_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredSession(token: string, user: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("olitec_token", token);
  localStorage.setItem("olitec_user", JSON.stringify(user));
  // Also set cookie so SSR requests can see it
  document.cookie = `olitec_token=${token}; path=/; max-age=${7 * 86400}; SameSite=Lax`;
}

export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("olitec_token");
  localStorage.removeItem("olitec_user");
  document.cookie = "olitec_token=; path=/; max-age=0";
}

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function login(input: LoginInput): Promise<SubmitResult<UserProfile>> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        password: input.password,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        ok: false,
        message: result.error?.message || result.message || "Invalid email or password.",
      };
    }

    const { user, token } = result.data;
    setStoredSession(token, user);

    return {
      ok: true,
      data: user,
      message: "Login successful.",
    };
  } catch (error) {
    console.error("Login API error:", error);
    return {
      ok: false,
      message: "Unable to connect to backend server. Please verify backend is running on port 4000.",
    };
  }
}

export async function loginAdmin(input: LoginInput): Promise<SubmitResult<UserProfile>> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        password: input.password,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        ok: false,
        message: result.error?.message || result.message || "Invalid admin credentials.",
      };
    }

    const { user, token } = result.data;
    setStoredSession(token, user);

    return {
      ok: true,
      data: user,
      message: "Admin login successful.",
    };
  } catch (error) {
    console.error("Admin login API error:", error);
    return {
      ok: false,
      message: "Unable to connect to backend server.",
    };
  }
}

export async function register(input: RegisterInput): Promise<SubmitResult<UserProfile>> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        ok: false,
        message: result.error?.message || result.message || "Registration failed.",
      };
    }

    const { user, token } = result.data;
    setStoredSession(token, user);

    return {
      ok: true,
      data: user,
      message: "Account created successfully.",
    };
  } catch (error) {
    console.error("Register API error:", error);
    return {
      ok: false,
      message: "Unable to connect to backend server.",
    };
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
    });
  } catch {
    // Ignore error on network fail during logout
  } finally {
    clearStoredSession();
  }
}
