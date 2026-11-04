"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, TextField } from "@/components/ui";
import { AuthCard, safeNext } from "@/components/auth/AuthCard";
import { api, errorMessage } from "@/services/api";
import { useStore } from "@/store/StoreProvider";
import type { Customer } from "@/types";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setCustomer, refreshCart } = useStore();
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "", confirm: "" });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const next = safeNext(params.get("next"));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (form.name.trim().length < 2) nextErrors.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Enter a valid email address.";
    if (!/^[6-9][0-9]{9}$/.test(form.mobile)) nextErrors.mobile = "Enter a 10-digit mobile number.";
    if (form.password.length < 8) nextErrors.password = "Use at least 8 characters.";
    if (form.confirm !== form.password) nextErrors.confirm = "Passwords do not match.";
    if (!agree) nextErrors.agree = "Please accept the terms to continue.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setError(null);
    setBusy(true);
    try {
      setCustomer(await api.post<Customer>("/auth/register", { name: form.name.trim(), email: form.email.trim(), mobile: form.mobile, password: form.password }));
      await refreshCart();
      router.replace(next);
    } catch (reason) {
      setError(errorMessage(reason));
      setBusy(false);
    }
  };

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: key === "mobile" ? event.target.value.replace(/\D/g, "") : event.target.value });

  return (
    <AuthCard
      title="Create your account"
      footer={
        <>
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert>{error}</Alert>}
        <TextField label="Full name" autoComplete="name" required value={form.name} onChange={set("name")} error={errors.name} maxLength={100} />
        <TextField label="Email" type="email" autoComplete="email" required value={form.email} onChange={set("email")} error={errors.email} />
        <TextField label="Mobile number" inputMode="numeric" autoComplete="tel-national" maxLength={10} required value={form.mobile} onChange={set("mobile")} error={errors.mobile} />
        <TextField label="Password" type="password" autoComplete="new-password" required value={form.password} onChange={set("password")} error={errors.password} hint="At least 8 characters" />
        <TextField label="Confirm password" type="password" autoComplete="new-password" required value={form.confirm} onChange={set("confirm")} error={errors.confirm} />
        <div>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" className="mt-0.5 size-4 accent-brand-500" checked={agree} onChange={(event) => setAgree(event.target.checked)} />
            <span>
              I agree to the{" "}
              <Link href="/policies/terms-and-conditions" className="font-medium text-brand-700 underline">
                terms and conditions
              </Link>{" "}
              and{" "}
              <Link href="/policies/privacy-policy" className="font-medium text-brand-700 underline">
                privacy policy
              </Link>
              .
            </span>
          </label>
          {errors.agree && <p className="mt-1 text-xs text-red-600">{errors.agree}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
