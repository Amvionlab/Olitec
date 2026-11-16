"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Eye, EyeOff, CheckCircle2, ArrowRight } from "lucide-react";
import { login, register, type LoginInput, type RegisterInput, type UserProfile } from "@/services/auth";
import { Alert } from "@/components/ui/Alert";
import { validateEmail, validateMobile, validateName, validateNewPassword, hasErrors, type FieldErrors } from "@/lib/validation";

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialMode?: "login" | "register";
  redirectTo?: string;
  onSuccess?: (user: UserProfile) => void;
  embedded?: boolean;
}

export function AuthModal({
  isOpen = true,
  onClose = () => {},
  initialMode = "login",
  redirectTo,
  onSuccess,
  embedded = false,
}: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  // Sync mode when initialMode changes or modal opens
  useEffect(() => {
    if (isOpen || embedded) {
      setMode(initialMode);
      setFormError(undefined);
      setSuccessMsg(undefined);
    }
  }, [isOpen, initialMode, embedded]);

  // Close on Escape key (only if popup modal)
  useEffect(() => {
    if (embedded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, embedded]);

  // Prevent body scroll when popup modal is open
  useEffect(() => {
    if (embedded) return;
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, embedded]);

  // Login form state
  const [loginValues, setLoginValues] = useState<LoginInput>({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState<FieldErrors<LoginInput>>({});
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regValues, setRegValues] = useState<RegisterInput & { confirmPassword: string; acceptTerms: boolean }>({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    acceptTerms: true,
  });
  const [regErrors, setRegErrors] = useState<Record<string, string | undefined>>({});
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [successMsg, setSuccessMsg] = useState<string>();

  if (!isOpen && !embedded) return null;

  // Handle Login
  async function handleLoginSubmit(e: FormEvent) {
    e.preventDefault();
    const errors: FieldErrors<LoginInput> = {
      email: validateEmail(loginValues.email),
      password: loginValues.password ? undefined : "Password is required.",
    };
    setLoginErrors(errors);
    setFormError(undefined);
    if (hasErrors(errors)) return;

    setLoading(true);
    const result = await login(loginValues);
    setLoading(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    const user = result.data;
    setSuccessMsg(user.role === "admin" ? "Welcome Admin! Redirecting..." : "Signed in successfully!");

    setTimeout(() => {
      onSuccess?.(user);
      onClose();
      if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    }, 500);
  }

  // Handle Register
  async function handleRegisterSubmit(e: FormEvent) {
    e.preventDefault();
    const errors: Record<string, string | undefined> = {
      name: validateName(regValues.name),
      email: validateEmail(regValues.email),
      mobile: validateMobile(regValues.mobile),
      password: validateNewPassword(regValues.password),
      confirmPassword: regValues.confirmPassword === regValues.password ? undefined : "Passwords do not match.",
      acceptTerms: regValues.acceptTerms ? undefined : "Please accept the terms.",
    };
    setRegErrors(errors);
    setFormError(undefined);
    if (Object.values(errors).some(Boolean)) return;

    setLoading(true);
    const result = await register({
      name: regValues.name.trim(),
      email: regValues.email.trim(),
      mobile: regValues.mobile.replace(/\D/g, ""),
      password: regValues.password,
    });
    setLoading(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    const user = result.data;
    setSuccessMsg("Account created successfully!");

    setTimeout(() => {
      onSuccess?.(user);
      onClose();
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push("/warranties");
      }
    }, 600);
  }

  const card = (
    <div className="relative w-full max-w-[460px] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
      {/* Top Header */}
      <div className="relative flex items-center justify-between border-b border-slate-100 px-6 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <Image
              src="/images/home/olitec-logo.png"
              alt="Olitec"
              width={110}
              height={32}
              priority
              className="h-7 w-auto"
            />
          </div>

          {/* Close Button or Back to Website */}
          {!embedded ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X size={18} />
            </button>
          ) : (
            <a
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-brand-600 transition"
            >
              ← Return to Website
            </a>
          )}
        </div>

        {/* Tab Toggle: Sign in vs Create account */}
        <div className="flex border-b border-slate-100 bg-slate-50/60 p-1.5 mx-6 mt-4 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setFormError(undefined);
              setSuccessMsg(undefined);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === "login"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setFormError(undefined);
              setSuccessMsg(undefined);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === "register"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Create account
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-4">
          {formError && (
            <div className="mb-3">
              <Alert tone="error">{formError}</Alert>
            </div>
          )}

          {successMsg && (
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-semibold text-emerald-800">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === "login" ? (
            /* ================= LOGIN FORM ================= */
            <form onSubmit={handleLoginSubmit} noValidate className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={loginValues.email}
                  onChange={(e) => {
                    setLoginValues((v) => ({ ...v, email: e.target.value }));
                    if (loginErrors.email) setLoginErrors((e2) => ({ ...e2, email: undefined }));
                  }}
                  className={`w-full h-10 rounded-xl border px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                    loginErrors.email
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
                  }`}
                />
                {loginErrors.email && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">{loginErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={loginValues.password}
                    onChange={(e) => {
                      setLoginValues((v) => ({ ...v, password: e.target.value }));
                      if (loginErrors.password) setLoginErrors((e2) => ({ ...e2, password: undefined }));
                    }}
                    className={`w-full h-10 rounded-xl border px-3 pr-10 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                      loginErrors.password
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-700"
                  >
                    {showLoginPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {loginErrors.password && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">{loginErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="brand-gradient mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold text-black transition-all hover:brightness-105 active:scale-95 disabled:opacity-60"
              >
                <span>{loading ? "Signing in…" : "Sign In"}</span>
                <ArrowRight size={14} />
              </button>

              <div className="pt-2 text-center">
                <p className="text-xs text-slate-500">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setFormError(undefined);
                    }}
                    className="font-bold text-brand-600 hover:underline"
                  >
                    Create one now
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* ================= REGISTER FORM (Compact 2-col, NO SCROLL) ================= */
            <form onSubmit={handleRegisterSubmit} noValidate className="space-y-2.5">
              {/* Row 1: Name & Mobile (2 columns) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-0.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={regValues.name}
                    onChange={(e) => {
                      setRegValues((v) => ({ ...v, name: e.target.value }));
                      if (regErrors.name) setRegErrors((e2) => ({ ...e2, name: undefined }));
                    }}
                    className={`w-full h-9 rounded-xl border px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                      regErrors.name
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
                    }`}
                  />
                  {regErrors.name && (
                    <p className="mt-0.5 text-[10px] text-red-600 font-medium">{regErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-0.5">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    placeholder="9876543210"
                    value={regValues.mobile}
                    onChange={(e) => {
                      setRegValues((v) => ({ ...v, mobile: e.target.value.replace(/\D/g, "") }));
                      if (regErrors.mobile) setRegErrors((e2) => ({ ...e2, mobile: undefined }));
                    }}
                    className={`w-full h-9 rounded-xl border px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                      regErrors.mobile
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
                    }`}
                  />
                  {regErrors.mobile && (
                    <p className="mt-0.5 text-[10px] text-red-600 font-medium">{regErrors.mobile}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Email (Full width) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-0.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={regValues.email}
                  onChange={(e) => {
                    setRegValues((v) => ({ ...v, email: e.target.value }));
                    if (regErrors.email) setRegErrors((e2) => ({ ...e2, email: undefined }));
                  }}
                  className={`w-full h-9 rounded-xl border px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                    regErrors.email
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
                  }`}
                />
                {regErrors.email && (
                  <p className="mt-0.5 text-[10px] text-red-600 font-medium">{regErrors.email}</p>
                )}
              </div>

              {/* Row 3: Password & Confirm Password (2 columns) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-0.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      placeholder="Min 8 chars"
                      value={regValues.password}
                      onChange={(e) => {
                        setRegValues((v) => ({ ...v, password: e.target.value }));
                        if (regErrors.password) setRegErrors((e2) => ({ ...e2, password: undefined }));
                      }}
                      className={`w-full h-9 rounded-xl border px-3 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                        regErrors.password
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-slate-400 hover:text-slate-700"
                    >
                      {showRegPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {regErrors.password && (
                    <p className="mt-0.5 text-[10px] text-red-600 font-medium">{regErrors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-0.5">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    placeholder="Re-enter password"
                    value={regValues.confirmPassword}
                    onChange={(e) => {
                      setRegValues((v) => ({ ...v, confirmPassword: e.target.value }));
                      if (regErrors.confirmPassword) setRegErrors((e2) => ({ ...e2, confirmPassword: undefined }));
                    }}
                    className={`w-full h-9 rounded-xl border px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                      regErrors.confirmPassword
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
                    }`}
                  />
                  {regErrors.confirmPassword && (
                    <p className="mt-0.5 text-[10px] text-red-600 font-medium">{regErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Row 4: Compact Terms */}
              <div className="pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={regValues.acceptTerms}
                    onChange={(e) => {
                      setRegValues((v) => ({ ...v, acceptTerms: e.target.checked }));
                      if (regErrors.acceptTerms) setRegErrors((e2) => ({ ...e2, acceptTerms: undefined }));
                    }}
                    className="size-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 accent-[#f99f1e]"
                  />
                  <span className="text-[11px] text-slate-600">
                    I agree to warranty updates &amp; terms.
                  </span>
                </label>
                {regErrors.acceptTerms && (
                  <p className="mt-0.5 text-[10px] text-red-600 font-medium">{regErrors.acceptTerms}</p>
                )}
              </div>

              {/* Row 5: Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="brand-gradient mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold text-black transition-all hover:brightness-105 active:scale-95 disabled:opacity-60"
              >
                <span>{loading ? "Creating account…" : "Create Account"}</span>
                <ArrowRight size={14} />
              </button>

              <div className="pt-1 text-center">
                <p className="text-xs text-slate-500">
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setFormError(undefined);
                    }}
                    className="font-bold text-brand-600 hover:underline"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
    </div>
  );

  if (embedded) {
    return card;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {card}
    </div>
  );
}
