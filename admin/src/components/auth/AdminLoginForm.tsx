"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PasswordField, TextField } from "@/components/ui/FormField";
import { mockAdminLogin } from "@/services/session";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string>();
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) ? undefined : "Enter a valid work email.",
      password: password ? undefined : "Password is required.",
    };
    setErrors(nextErrors);
    setFormError(undefined);
    if (nextErrors.email || nextErrors.password) return;

    setStatus("submitting");
    const result = await mockAdminLogin(email);
    if (!result.ok) {
      setStatus("idle");
      setFormError(result.message);
      return;
    }
    setStatus("success");
    router.push("/");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <Alert tone="error">{formError}</Alert>}
      <TextField
        label="Work email"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setErrors((v) => ({ ...v, email: undefined }));
        }}
        error={errors.email}
        required
      />
      <PasswordField
        label="Password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setErrors((v) => ({ ...v, password: undefined }));
        }}
        error={errors.password}
        required
      />
      <Button type="submit" className="w-full" size="lg" loading={status !== "idle"}>
        {status === "idle" ? "Sign in" : "Signing in…"}
      </Button>
      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Demo only — authentication is not implemented. Use <span className="font-medium text-slate-700">anita.rao@olitech.example</span> with any password.
      </p>
    </form>
  );
}
