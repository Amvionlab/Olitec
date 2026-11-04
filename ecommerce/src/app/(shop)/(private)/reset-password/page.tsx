"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert, Button, ButtonLink, TextField } from "@/components/ui";
import { AuthCard } from "@/components/auth/AuthCard";
import { api, errorMessage } from "@/services/api";

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) return setResult({ kind: "error", text: "Use at least 8 characters." });
    if (password !== confirm) return setResult({ kind: "error", text: "Passwords do not match." });
    setBusy(true);
    try {
      const data = await api.post<{ message: string }>("/auth/reset-password", { token, password });
      setResult({ kind: "success", text: data.message });
    } catch (reason) {
      setResult({ kind: "error", text: errorMessage(reason) });
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <AuthCard title="Invalid link">
        <Alert>This reset link is incomplete. Please request a new one.</Alert>
        <ButtonLink href="/forgot-password">Request a new link</ButtonLink>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password" footer={<Link href="/login" className="font-semibold text-brand-700 hover:underline">Back to sign in</Link>}>
      {result?.kind === "success" ? (
        <>
          <Alert kind="success">{result.text}</Alert>
          <ButtonLink href="/login" className="w-full">
            Sign in
          </ButtonLink>
        </>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {result && <Alert>{result.text}</Alert>}
          <TextField label="New password" type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} hint="At least 8 characters" />
          <TextField label="Confirm new password" type="password" autoComplete="new-password" required value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          <Button type="submit" size="lg" className="w-full" loading={busy}>
            Reset password
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
