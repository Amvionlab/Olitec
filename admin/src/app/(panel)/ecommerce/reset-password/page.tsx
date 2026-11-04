"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/FormField";
import { ecomApi, messageOf } from "@/services/ecommerce/api";

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [result, setResult] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) return setResult({ tone: "error", text: "Use at least 8 characters." });
    if (password !== confirm) return setResult({ tone: "error", text: "Passwords do not match." });
    setBusy(true);
    try {
      setResult({ tone: "success", text: (await ecomApi.post<{ message: string }>("/admin/auth/reset-password", { token, password })).message });
    } catch (error) {
      setResult({ tone: "error", text: messageOf(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">Reset e-commerce admin password</h1>
      {!token ? (
        <Alert tone="error">This reset link is incomplete. Request a new one from the sign-in form.</Alert>
      ) : result?.tone === "success" ? (
        <>
          <Alert tone="success">{result.text}</Alert>
          <Link href="/ecommerce" className="text-sm font-medium text-brand-700 hover:underline">Go to sign in</Link>
        </>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {result && <Alert tone="error">{result.text}</Alert>}
          <PasswordField label="New password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          <PasswordField label="Confirm new password" autoComplete="new-password" required value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          <Button type="submit" className="w-full" loading={busy}>Reset password</Button>
        </form>
      )}
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
