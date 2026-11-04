"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LogOut, ShoppingBag } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PasswordField, TextField } from "@/components/ui/FormField";
import { ecomApi, messageOf } from "@/services/ecommerce/api";

export interface EcomAdmin {
  id: number;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  permissions: string[];
}

type Toast = { id: number; tone: "success" | "error"; text: string };

interface SessionContext {
  admin: EcomAdmin;
  /** UI hint only — the backend enforces every permission again. */
  can: (permission: string) => boolean;
  notify: (text: string, tone?: Toast["tone"]) => void;
}

const Context = createContext<SessionContext | null>(null);

export function useEcom(): SessionContext {
  const value = useContext(Context);
  if (!value) throw new Error("useEcom must be used inside the e-commerce section");
  return value;
}

function SignIn({ onSignedIn }: { onSignedIn: (admin: EcomAdmin) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onSignedIn(await ecomApi.post<EcomAdmin>("/admin/auth/login", { email: email.trim(), password }));
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setBusy(false);
    }
  };

  const requestReset = async () => {
    if (!email) return setError("Enter your email first.");
    try {
      setForgot((await ecomApi.post<{ message: string }>("/admin/auth/forgot-password", { email: email.trim() })).message);
    } catch (reason) {
      setError(messageOf(reason));
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-600 text-white">
          <ShoppingBag className="size-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">E-Commerce admin</h1>
          <p className="text-sm text-slate-500">Sign in with your shop staff account.</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        {forgot && <Alert tone="success">{forgot}</Alert>}
        <TextField label="Email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <PasswordField label="Password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        <Button type="submit" className="w-full" loading={busy}>
          Sign in
        </Button>
        <button type="button" onClick={() => void requestReset()} className="w-full text-center text-sm text-brand-700 hover:underline">
          Forgot password?
        </button>
      </form>
    </div>
  );
}

/**
 * Gate for every /ecommerce page: verifies the e-commerce admin session with the backend (GET /admin/auth/me)
 * and shows a sign-in form when there is none. Session expiry on any later request also returns here.
 */
export function EcomSession({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [admin, setAdmin] = useState<EcomAdmin | null | undefined>(undefined);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  useEffect(() => {
    ecomApi.get<EcomAdmin>("/admin/auth/me").then(setAdmin).catch(() => setAdmin(null));
  }, []);

  const notify = useCallback((text: string, tone: Toast["tone"] = "success") => {
    const id = nextId.current++;
    setToasts((list) => [...list, { id, tone, text }]);
    setTimeout(() => setToasts((list) => list.filter((toast) => toast.id !== id)), 5000);
  }, []);

  if (pathname === "/ecommerce/reset-password") return <>{children}</>;
  if (admin === undefined) return <p className="py-16 text-center text-sm text-slate-500">Checking e-commerce session…</p>;
  if (admin === null) return <SignIn onSignedIn={setAdmin} />;

  const signOut = async () => {
    await ecomApi.post("/admin/auth/logout").catch(() => undefined);
    setAdmin(null);
  };

  return (
    <Context.Provider value={{ admin, can: (permission) => admin.permissions.includes(permission), notify }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">
        <span className="flex items-center gap-2 text-slate-600">
          <ShoppingBag className="size-4 text-brand-600" aria-hidden />
          Shop session: <span className="font-medium text-slate-900">{admin.name}</span>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{admin.roleLabel}</span>
        </span>
        <button onClick={() => void signOut()} className="flex items-center gap-1 text-slate-500 hover:text-slate-900">
          <LogOut className="size-4" aria-hidden /> Sign out of shop
        </button>
      </div>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`pointer-events-auto max-w-sm rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.tone === "error" ? "bg-red-600" : "bg-slate-900"}`}>
            {toast.text}
          </div>
        ))}
      </div>
    </Context.Provider>
  );
}
