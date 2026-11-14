"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PasswordField, TextField } from "@/components/ui/FormField";
import { login, type LoginInput } from "@/services/auth";
import { hasErrors, validateEmail, type FieldErrors } from "@/lib/validation";

export function LoginForm() {
  const router = useRouter();
  const [values, setValues] = useState<LoginInput>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors<LoginInput>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [formError, setFormError] = useState<string>();

  const update = (field: keyof LoginInput, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: FieldErrors<LoginInput> = {
      email: validateEmail(values.email),
      password: values.password ? undefined : "Password is required.",
    };
    setErrors(nextErrors);
    setFormError(undefined);
    if (hasErrors(nextErrors)) return;

    setStatus("submitting");
    const result = await login(values);
    if (!result.ok) {
      setStatus("idle");
      setFormError(result.message);
      return;
    }
    setStatus("success");
    setTimeout(() => router.push("/warranties"), 600);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError && <Alert tone="error">{formError}</Alert>}
      {status === "success" && <Alert tone="success">Signed in. Taking you to your warranties…</Alert>}

      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={(e) => update("email", e.target.value)}
        error={errors.email}
        required
      />
      <PasswordField
        label="Password"
        autoComplete="current-password"
        value={values.password}
        onChange={(e) => update("password", e.target.value)}
        error={errors.password}
        required
      />

      <Button type="submit" className="w-full" size="lg" loading={status === "submitting"} disabled={status === "success"}>
        {status === "submitting" ? "Signing in…" : "Sign in"}
      </Button>

     

      <p className="text-center text-sm text-slate-500">
        New here?{" "}
        <Link href="/register" className="font-medium text-brand-700 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
