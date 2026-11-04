import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-xl font-semibold text-slate-900">Sign in to your account</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">Track warranties and support requests for your products.</p>
      <LoginForm />
    </>
  );
}
