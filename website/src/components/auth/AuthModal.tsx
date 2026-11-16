"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft, KeyRound, Mail, RefreshCw } from "lucide-react";
import {
  login,
  register,
  sendRegistrationOtp,
  sendForgotPasswordOtp,
  resetPasswordWithOtp,
  type LoginInput,
  type RegisterInput,
  type UserProfile,
} from "@/services/auth";
import { Alert } from "@/components/ui/Alert";
import { validateEmail, validateMobile, validateName, validateNewPassword, hasErrors, type FieldErrors } from "@/lib/validation";

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialMode?: "login" | "register" | "forgot-password";
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
  const [mode, setMode] = useState<"login" | "register" | "forgot-password">(initialMode);

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
    otp: "",
    acceptTerms: true,
  });
  const [regErrors, setRegErrors] = useState<Record<string, string | undefined>>({});
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regOtpLoading, setRegOtpLoading] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotStep, setForgotStep] = useState<"enter-email" | "enter-otp">("enter-email");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [successMsg, setSuccessMsg] = useState<string>();

  // Full reset of all form data on submission or authentication change
  const resetForm = () => {
    setLoginValues({ email: "", password: "" });
    setLoginErrors({});
    setShowLoginPassword(false);

    setRegValues({
      name: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
      otp: "",
      acceptTerms: true,
    });
    setRegErrors({});
    setShowRegPassword(false);
    setRegOtpSent(false);
    setRegOtpLoading(false);

    setForgotEmail("");
    setForgotOtp("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotStep("enter-email");
    setShowForgotNewPassword(false);
    setForgotLoading(false);

    setFormError(undefined);
    setSuccessMsg(undefined);
  };

  // Reset form inputs whenever authentication state changes (login, logout, token clear)
  useEffect(() => {
    const handleAuthChange = () => {
      resetForm();
    };
    window.addEventListener("olitec_auth_change", handleAuthChange);
    return () => window.removeEventListener("olitec_auth_change", handleAuthChange);
  }, []);

  // Forgot password handlers
  async function handleSendForgotOtp(e?: FormEvent) {
    if (e) e.preventDefault();
    const emailErr = validateEmail(forgotEmail);
    if (emailErr) {
      setFormError(emailErr);
      return;
    }
    setFormError(undefined);
    setForgotLoading(true);
    const res = await sendForgotPasswordOtp(forgotEmail);
    setForgotLoading(false);
    if (!res.ok) {
      setFormError(res.message);
      return;
    }
    setSuccessMsg(res.message);
    setForgotStep("enter-otp");
  }

  async function handleResetPasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (!forgotOtp.trim()) {
      setFormError("Please enter the 6-digit verification code.");
      return;
    }
    const passErr = validateNewPassword(forgotNewPassword);
    if (passErr) {
      setFormError(passErr);
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setFormError(undefined);
    setForgotLoading(true);
    const res = await resetPasswordWithOtp(forgotEmail, forgotOtp, forgotNewPassword);
    setForgotLoading(false);

    if (!res.ok) {
      setFormError(res.message);
      return;
    }

    setSuccessMsg("Password reset successfully! Redirecting to sign in...");
    const targetEmail = forgotEmail;
    setTimeout(() => {
      resetForm();
      setLoginValues({ email: targetEmail, password: "" });
      setMode("login");
      setSuccessMsg("Your password has been updated. Please sign in.");
    }, 1200);
  }

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
      resetForm();
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

  // Send OTP for new account registration
  async function handleSendRegisterOtp() {
    const emailErr = validateEmail(regValues.email);
    if (emailErr) {
      setRegErrors((e) => ({ ...e, email: emailErr }));
      setFormError(emailErr);
      return;
    }
    setFormError(undefined);
    setRegOtpLoading(true);
    const res = await sendRegistrationOtp(regValues.email.trim(), regValues.name.trim());
    setRegOtpLoading(false);
    if (!res.ok) {
      setFormError(res.message);
      return;
    }
    setRegOtpSent(true);
    setSuccessMsg("Verification code sent to " + regValues.email.trim() + "! Enter the 6-digit OTP below.");
  }

  // Handle Register - ONLY VERIFIED USERS CAN CREATE ACCOUNT
  async function handleRegisterSubmit(e: FormEvent) {
    e.preventDefault();
    const errors: Record<string, string | undefined> = {
      name: validateName(regValues.name),
      email: validateEmail(regValues.email),
      mobile: validateMobile(regValues.mobile),
      password: validateNewPassword(regValues.password),
      confirmPassword: regValues.confirmPassword === regValues.password ? undefined : "Passwords do not match.",
      acceptTerms: regValues.acceptTerms ? undefined : "Please accept the terms.",
      otp: regOtpSent && (!regValues.otp || regValues.otp.trim().length !== 6) ? "Enter 6-digit verification code." : undefined,
    };
    setRegErrors(errors);
    setFormError(undefined);
    if (Object.values(errors).some(Boolean)) return;

    // If OTP has not been requested yet, request it automatically
    if (!regOtpSent) {
      await handleSendRegisterOtp();
      return;
    }

    setLoading(true);
    const result = await register({
      name: regValues.name.trim(),
      email: regValues.email.trim(),
      mobile: regValues.mobile.replace(/\D/g, ""),
      password: regValues.password,
      otp: regValues.otp.trim(),
    });
    setLoading(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    const user = result.data;
    setSuccessMsg("Account verified & created successfully!");

    setTimeout(() => {
      resetForm();
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
    <div className="font-sans antialiased text-slate-800 relative w-full max-w-[480px] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
      {/* Top Header */}
      <div className="relative flex items-center justify-between border-b border-slate-100 px-6 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <Image
            src="/images/home/olitec-logo.png"
            alt="Olitec"
            width={124}
            height={36}
            priority
            className="h-8 w-auto"
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
            className="text-sm font-semibold text-slate-500 hover:text-brand-600 transition"
          >
            ← Return to Website
          </a>
        )}
      </div>

      {/* Tab Toggle: Sign in vs Create account (hidden in forgot-password mode) */}
      {mode === "forgot-password" ? (
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 mx-6 mt-4 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setFormError(undefined);
              setSuccessMsg(undefined);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Sign in</span>
          </button>
          <span className="text-xs font-bold text-brand-600">Password Recovery</span>
        </div>
      ) : (
        <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5 mx-6 mt-4 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setFormError(undefined);
              setSuccessMsg(undefined);
            }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
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
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              mode === "register"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Create account
          </button>
        </div>
      )}

      {/* Content Body */}
      <div className="px-6 py-4">
        {formError && (
          <div className="mb-3">
            <Alert tone="error">{formError}</Alert>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-sm font-semibold text-emerald-800">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {mode === "forgot-password" ? (
          /* ================= FORGOT PASSWORD FORM (WITH EMAIL OTP) ================= */
          <div className="space-y-4">
            {forgotStep === "enter-email" ? (
              <form onSubmit={handleSendForgotOtp} noValidate className="space-y-4">
                <div className="rounded-2xl bg-amber-50/70 border border-amber-200/60 p-3.5">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider mb-1">
                    <KeyRound size={14} className="text-amber-600" />
                    <span>Reset Olitec Account Password</span>
                  </div>
                  <p className="text-xs text-amber-900/80 leading-relaxed">
                    Enter the registered email associated with your account. We will dispatch a 6-digit verification code to reset your login.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Account Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="name@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full h-10.5 rounded-xl border border-slate-300 px-3.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
                    />
                    <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="brand-gradient mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-black transition-all hover:brightness-105 active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  {forgotLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Sending OTP Code…</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} noValidate className="space-y-3.5">
                <div className="rounded-2xl bg-brand-50 border border-brand-200 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-900">Code sent to:</span>
                    <button
                      type="button"
                      onClick={() => setForgotStep("enter-email")}
                      className="text-xs font-semibold text-brand-700 hover:underline"
                    >
                      Change email
                    </button>
                  </div>
                  <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{forgotEmail}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Enter 6-Digit OTP Code <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      disabled={forgotLoading}
                      onClick={() => handleSendForgotOtp()}
                      className="text-xs font-semibold text-brand-600 hover:underline disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full h-11 text-center font-mono text-xl tracking-[0.35em] font-bold rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showForgotNewPassword ? "text" : "password"}
                      required
                      placeholder="At least 6 characters"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="w-full h-10 rounded-xl border border-slate-300 px-3.5 pr-10 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-700"
                    >
                      {showForgotNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showForgotNewPassword ? "text" : "password"}
                    required
                    placeholder="Re-type new password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-300 px-3.5 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="brand-gradient mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-black transition-all hover:brightness-105 active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  {forgotLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Updating Password…</span>
                    </>
                  ) : (
                    <>
                      <span>Reset &amp; Sign In</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="pt-2 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setFormError(undefined);
                  setSuccessMsg(undefined);
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline"
              >
                ← Back to Sign in
              </button>
            </div>
          </div>
        ) : mode === "login" ? (
          /* ================= LOGIN FORM ================= */
          <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
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
                className={`w-full h-10.5 rounded-xl border px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                  loginErrors.email
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
                }`}
              />
              {loginErrors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium">{loginErrors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-800">
                  Password <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot-password");
                    setForgotEmail(loginValues.email || "");
                    setFormError(undefined);
                    setSuccessMsg(undefined);
                    setForgotStep("enter-email");
                  }}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
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
                  className={`w-full h-10.5 rounded-xl border px-3.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                    loginErrors.password
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-700"
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {loginErrors.password && (
                <p className="mt-1 text-xs text-red-600 font-medium">{loginErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="brand-gradient mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-black transition-all hover:brightness-105 active:scale-95 disabled:opacity-60"
            >
              <span>{loading ? "Signing in…" : "Sign In"}</span>
              <ArrowRight size={16} />
            </button>

            <div className="pt-2 text-center">
              <p className="text-sm text-slate-500">
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
          <form onSubmit={handleRegisterSubmit} noValidate className="space-y-3">
            {/* Row 1: Name & Mobile (2 columns) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">
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
                  className={`w-full h-10 rounded-xl border px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                    regErrors.name
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
                  }`}
                />
                {regErrors.name && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{regErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">
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
                  className={`w-full h-10 rounded-xl border px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                    regErrors.mobile
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
                  }`}
                />
                {regErrors.mobile && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{regErrors.mobile}</p>
                )}
              </div>
            </div>

            {/* Row 2: Email (Full width) */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
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
                className={`w-full h-10 rounded-xl border px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                  regErrors.email
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
                }`}
              />
              {regErrors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium">{regErrors.email}</p>
              )}
            </div>

            {/* Row 3: Password & Confirm Password (2 columns) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">
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
                    className={`w-full h-10 rounded-xl border px-3.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                      regErrors.password
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-700"
                    aria-label={showRegPassword ? "Hide password" : "Show password"}
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {regErrors.password && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{regErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">
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
                  className={`w-full h-10 rounded-xl border px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                    regErrors.confirmPassword
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
                  }`}
                />
                {regErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{regErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Row 4: OTP Verification Code (Only verified users can create account) */}
            {regOtpSent && (
              <div className="rounded-2xl border-2 border-brand-300 bg-brand-50/70 p-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-brand-950">
                    Enter 6-Digit Email OTP <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    disabled={regOtpLoading}
                    onClick={handleSendRegisterOtp}
                    className="text-xs font-bold text-brand-700 hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    Resend OTP
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={regValues.otp}
                  onChange={(e) => {
                    setRegValues((v) => ({ ...v, otp: e.target.value.replace(/\D/g, "") }));
                    if (regErrors.otp) setRegErrors((e2) => ({ ...e2, otp: undefined }));
                  }}
                  className="w-full h-10 text-center font-mono text-lg tracking-[0.3em] font-bold rounded-xl border border-brand-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                {regErrors.otp && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{regErrors.otp}</p>
                )}
              </div>
            )}

            {/* Row 5: Compact Terms */}
            <div className="pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={regValues.acceptTerms}
                  onChange={(e) => {
                    setRegValues((v) => ({ ...v, acceptTerms: e.target.checked }));
                    if (regErrors.acceptTerms) setRegErrors((e2) => ({ ...e2, acceptTerms: undefined }));
                  }}
                  className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 accent-[#f99f1e]"
                />
                <span className="text-xs sm:text-sm text-slate-600">
                  I agree to warranty updates &amp; terms.
                </span>
              </label>
              {regErrors.acceptTerms && (
                <p className="mt-1 text-xs text-red-600 font-medium">{regErrors.acceptTerms}</p>
              )}
            </div>

            {/* Row 6: Action Button */}
            <button
              type="submit"
              disabled={loading || regOtpLoading}
              className="brand-gradient mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-black transition-all hover:brightness-105 active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {regOtpLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Sending Verification Code…</span>
                </>
              ) : loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Verifying &amp; Creating…</span>
                </>
              ) : regOtpSent ? (
                <>
                  <span>Verify OTP &amp; Create Account</span>
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  <span>Verify Email &amp; Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="pt-1.5 text-center">
              <p className="text-sm text-slate-500">
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
