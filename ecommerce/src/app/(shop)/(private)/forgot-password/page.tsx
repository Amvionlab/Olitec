"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Button, TextField } from "@/components/ui";
import { AuthCard } from "@/components/auth/AuthCard";
import { api, errorMessage } from "@/services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await api.post<{ message: string }>("/auth/forgot-password", { email: email.trim() });
      setResult({ kind: "success", text: data.message });
    } catch (reason) {
      setResult({ kind: "error", text: errorMessage(reason) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Reset your password" subtitle="Enter the email you registered with and we will send you a reset link." footer={<Link href="/login" className="font-semibold text-brand-700 hover:underline">Back to sign in</Link>}>
      <form onSubmit={submit} className="space-y-4">
        {result && <Alert kind={result.kind}>{result.text}</Alert>}
        <TextField label="Email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Send reset link
        </Button>
      </form>
    </AuthCard>
  );
}
