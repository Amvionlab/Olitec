import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Sign in to your account</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">Access your warranties, customer support, or administrator portal.</p>
      <LoginForm />
    </>
  );
}
