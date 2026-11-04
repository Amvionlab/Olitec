import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";

export const metadata: Metadata = { title: "Admin sign in" };

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center text-white">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-600">
            <ShieldCheck className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-xl font-semibold">Olitech Admin</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to manage customers and warranties</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
