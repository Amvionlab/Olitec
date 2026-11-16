import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <>
      <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors group"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Back to Website</span>
        </Link>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
          <Globe className="size-3" />
          Our Legacy
        </span>
      </div>
      <h1 className="text-xl font-bold text-slate-900">Sign in to your account</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">Access your warranties, customer support, or administrator portal.</p>
      <LoginForm />
    </>
  );
}
