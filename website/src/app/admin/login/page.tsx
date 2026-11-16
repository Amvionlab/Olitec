"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldAlert, ArrowRight } from "lucide-react";
import { loginAdmin } from "@/services/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@olitec.in");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);

    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setLoading(true);
    const result = await loginAdmin({ email, password });
    setLoading(false);

    if (!result.ok) {
      setError(result.message || "Invalid admin credentials.");
      return;
    }

    router.replace("/admin/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 text-slate-100 sm:px-6">
      {/* Brand */}
      <div className="mb-8 flex flex-col items-center">
        <Link href="/" className="mb-4 flex items-center gap-3">
          <Image
            src="/images/home/olitec-logo.png"
            alt="Olitec Energy"
            width={180}
            height={55}
            priority
            className="h-11 w-auto brightness-0 invert"
          />
        </Link>
        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
          Administrator Control Portal
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="text-xl font-bold tracking-tight text-white">Sign in as Administrator</h1>
        <p className="mt-1 text-xs text-slate-400">
          Access Product Master, User Management, and Warranty Registrations.
        </p>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
            <ShieldAlert size={16} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
              Admin Email
            </label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3.5 top-3 text-slate-500" size={17} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@olitec.in"
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">
              Admin Password
            </label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3.5 top-3 text-slate-500" size={17} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-300/80">
            <p className="font-semibold text-amber-400">Seeded Credentials:</p>
            <p className="mt-0.5">
              Email: <code className="text-white">admin@olitec.in</code> &nbsp;|&nbsp; Password: <code className="text-white">admin123</code>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? (
              <span>Verifying credentials…</span>
            ) : (
              <>
                <span>Sign in to Dashboard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-white/10 pt-4 text-center">
          <Link href="/" className="text-xs text-slate-400 transition hover:text-white">
            ← Return to Olitec Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
