"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, RefreshCw, Eye, EyeOff, ArrowRight } from "lucide-react";
import { apiPost, fileToUpload } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fetchActiveProducts, type ApiProductItem } from "@/services/products";
import { getStoredUser, register, sendRegistrationOtp, type UserProfile } from "@/services/auth";
import {
  INVOICE_ACCEPTED_TYPES,
  INVOICE_MAX_BYTES,
  validateEmail,
  validateMobile,
  validateName,
  validateNewPassword,
  validateRequired,
} from "@/lib/validation";

type TextFieldName =
  | "customerName"
  | "email"
  | "mobile"
  | "installationAddress"
  | "productModel"
  | "serialNumber"
  | "purchaseDate"
  | "installationDate"
  | "dealerName"
  | "dealerContact";
type FileFieldName = "invoice" | "installationDocument";
type FieldName = TextFieldName | FileFieldName;

type Values = Record<TextFieldName, string>;
type Files = Record<FileFieldName, File | null>;
type Errors = Partial<Record<FieldName, string>>;

const emptyValues: Values = {
  customerName: "",
  email: "",
  mobile: "",
  installationAddress: "",
  productModel: "",
  serialNumber: "",
  purchaseDate: "",
  installationDate: "",
  dealerName: "",
  dealerContact: "",
};

/** Field order, used to focus the first invalid field. */
const fieldOrder: FieldName[] = [...(Object.keys(emptyValues) as TextFieldName[]), "invoice", "installationDocument"];

function validateDocument(file: File | null, label: string): string | undefined {
  if (!file) return `Upload the ${label.toLowerCase()}.`;
  if (!INVOICE_ACCEPTED_TYPES.includes(file.type)) return `${label} must be a PDF, JPG or PNG file.`;
  if (file.size > INVOICE_MAX_BYTES) return `${label} must be 5 MB or smaller.`;
  return undefined;
}

function validate(values: Values, files: Files, today: string): Errors {
  const dealerDigits = values.dealerContact.replace(/\D/g, "");
  return {
    customerName: validateName(values.customerName),
    email: validateEmail(values.email),
    mobile: validateMobile(values.mobile),
    installationAddress: !values.installationAddress.trim()
      ? "Installation address is required."
      : values.installationAddress.trim().length < 10
        ? "Enter the complete installation address."
        : undefined,
    productModel: validateRequired(values.productModel, "Product model"),
    serialNumber: !values.serialNumber.trim()
      ? "Serial number is required."
      : /^[A-Za-z0-9-]{6,30}$/.test(values.serialNumber.trim())
        ? undefined
        : "Serial number must be 6–30 letters, numbers or hyphens.",
    purchaseDate: !values.purchaseDate
      ? "Purchase date is required."
      : values.purchaseDate > today
        ? "Purchase date cannot be in the future."
        : undefined,
    installationDate: !values.installationDate
      ? "Installation date is required."
      : values.installationDate > today
        ? "Installation date cannot be in the future."
        : values.purchaseDate && values.installationDate < values.purchaseDate
          ? "Installation date cannot be before the purchase date."
          : undefined,
    dealerName: validateRequired(values.dealerName, "Dealer / distributor name"),
    dealerContact: dealerDigits && (dealerDigits.length < 8 || dealerDigits.length > 15) ? "Enter a valid contact number." : undefined,
    invoice: validateDocument(files.invoice, "Purchase invoice"),
    installationDocument: validateDocument(files.installationDocument, "Installation document"),
  };
}

const inputClass =
  "block w-full rounded-[12px] border bg-white px-4 text-[15px] text-ink placeholder:text-muted/70 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

function Field({
  id,
  label,
  required,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-ink">
        {label}
        {required && <span className="ml-0.5 text-brand-600" aria-hidden>*</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-6 border-b border-[#e6e6e6] pb-4 text-lg font-semibold text-black">{children}</h2>;
}

/** Public warranty registration (no account needed). Saved through POST /api/warranty-registrations. */
export function WarrantyRegistrationForm({ defaultProductModel = "" }: { defaultProductModel?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [products, setProducts] = useState<ApiProductItem[]>([]);
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [values, setValues] = useState<Values>({ ...emptyValues, productModel: defaultProductModel });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Auto-signup state for guests registering warranty
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupOtp, setSignupOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMsg, setOtpMsg] = useState<string>();
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    fetchActiveProducts().then((items) => {
      if (items && items.length > 0) setProducts(items);
    });

    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
      setValues((v) => ({
        ...v,
        customerName: v.customerName || user.name || "",
        email: v.email || user.email || "",
        mobile: v.mobile || user.mobile || "",
        installationAddress:
          v.installationAddress ||
          user.city ||
          (user.state ? `${user.city || ""}, ${user.state}` : ""),
      }));
    }
  }, []);

  const [files, setFiles] = useState<Files>({ invoice: null, installationDocument: null });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ registrationNumber: string; serialNumber: string; persisted: boolean }>();
  // Reset file inputs after a successful submission (they cannot be cleared through React state).
  const [formKey, setFormKey] = useState(0);

  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

  function update(field: TextFieldName, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function updateFile(field: FileFieldName, file: File | null) {
    setFiles((f) => ({ ...f, [field]: file }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handleSendWarrantyOtp() {
    const emailErr = validateEmail(values.email);
    if (emailErr) {
      setErrors((e) => ({ ...e, email: emailErr }));
      setFormError(emailErr);
      return;
    }
    setOtpLoading(true);
    setFormError(undefined);
    const res = await sendRegistrationOtp(values.email.trim(), values.customerName.trim());
    setOtpLoading(false);
    if (!res.ok) {
      setFormError(res.message);
      return;
    }
    setOtpSent(true);
    setOtpMsg("Verification code sent to " + values.email.trim() + "!");
  }

  function inputProps(field: TextFieldName) {
    return {
      id: field,
      name: field,
      value: values[field],
      "aria-invalid": errors[field] ? true : undefined,
      "aria-describedby": errors[field] ? `${field}-error` : undefined,
      className: cn(inputClass, "h-11", errors[field] ? "border-red-500" : "border-[#b7b7b7]"),
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);
    const nextErrors = validate(values, files, today);
    setErrors(nextErrors);
    const firstInvalid = fieldOrder.find((field) => nextErrors[field]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    // If user is not logged in, execute registration with OTP verification first!
    if (!currentUser) {
      const passErr = validateNewPassword(signupPassword);
      if (passErr) {
        setFormError(passErr);
        return;
      }
      if (signupPassword !== signupConfirmPassword) {
        setFormError("Passwords do not match.");
        return;
      }
      if (!otpSent) {
        await handleSendWarrantyOtp();
        setFormError("We sent a 6-digit verification code to " + values.email + ". Please enter it below to complete registration.");
        return;
      }
      if (!signupOtp || signupOtp.trim().length !== 6) {
        setFormError("Please enter the 6-digit email verification code.");
        return;
      }

      setSubmitting(true);
      const regRes = await register({
        name: values.customerName.trim(),
        email: values.email.trim(),
        mobile: values.mobile.replace(/\D/g, ""),
        password: signupPassword,
        otp: signupOtp.trim(),
      });

      if (!regRes.ok) {
        setSubmitting(false);
        setFormError(regRes.message);
        return;
      }
      // User registered & verified!
      setCurrentUser(regRes.data);
    }

    setSubmitting(true);
    try {
      const result = await apiPost<{ registrationNumber: string; serialNumber: string }>("/warranty-registrations", {
        customerName: values.customerName.trim(),
        email: values.email.trim(),
        mobile: values.mobile.replace(/\D/g, ""),
        installationAddress: values.installationAddress.trim(),
        productModel: values.productModel.trim(),
        serialNumber: values.serialNumber.trim(),
        purchaseDate: values.purchaseDate,
        installationDate: values.installationDate,
        dealerName: values.dealerName.trim(),
        dealerContact: values.dealerContact.trim() || undefined,
        invoice: await fileToUpload(files.invoice!),
        installationDocument: await fileToUpload(files.installationDocument!),
      });
      if (!result.ok) {
        if (result.code === "CONFLICT") {
          setErrors((e) => ({ ...e, serialNumber: "A warranty is already registered for this serial number." }));
        } else {
          setErrors((e) => ({ ...e, ...result.fields }));
        }
        setFormError(result.message);
        return;
      }
      setSubmitted({ ...result.data, persisted: result.persisted !== false });
      setValues(emptyValues);
      setFiles({ invoice: null, installationDocument: null });
      setFormKey((k) => k + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFormError("We could not read one of the attached files. Please choose it again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div role="status" className="space-y-4 text-center py-6">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-2">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Warranty Registration Submitted!</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Your registration number is <strong className="text-slate-900 font-mono">{submitted.registrationNumber}</strong> for Serial{" "}
          <strong className="text-slate-900 font-mono">{submitted.serialNumber}</strong>. Status: <span className="font-bold text-amber-600">Pending Review</span>.
        </p>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Your account is active and verified. This warranty has been registered directly to your Olitec Dashboard.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Link
            href="/warranties"
            className="brand-gradient inline-flex h-11 items-center justify-center gap-2 rounded-full px-7 text-sm font-bold text-black transition hover:brightness-105 shadow-sm"
          >
            <span>Go to Your Dashboard</span>
            <ArrowRight size={16} />
          </Link>
          <button
            type="button"
            onClick={() => {
              setSubmitted(undefined);
              setSignupPassword("");
              setSignupConfirmPassword("");
              setSignupOtp("");
              setOtpSent(false);
              setOtpMsg(undefined);
            }}
            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
          >
            Register Another Product
          </button>
        </div>
      </div>
    );
  }

  return (
    <form key={formKey} ref={formRef} onSubmit={handleSubmit} noValidate>
      {/* Autofill Notification Banner for Logged-in Users */}
      {currentUser && (
        <div className="mb-8 flex items-center gap-2.5 rounded-2xl bg-amber-50 border border-amber-200/80 px-4 py-3 text-xs font-semibold text-amber-950">
          <CheckCircle2 size={16} className="text-amber-600 shrink-0" />
          <span>
            Signed in as <strong>{currentUser.name}</strong> ({currentUser.email}) • Contact details autofilled and warranty will link directly to your Dashboard.
          </span>
        </div>
      )}

      <section className="mb-10">
        <SectionTitle>01. Customer Information</SectionTitle>
        <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
          <Field id="customerName" label="Customer Name" required error={errors.customerName}>
            <input {...inputProps("customerName")} type="text" autoComplete="name" placeholder="Enter your full name" onChange={(e) => update("customerName", e.target.value)} />
          </Field>
          <Field id="email" label="Email Address" required error={errors.email}>
            <input {...inputProps("email")} type="email" autoComplete="email" placeholder="example@gmail.com" onChange={(e) => update("email", e.target.value)} />
          </Field>
          <Field id="mobile" label="Mobile Number" required error={errors.mobile}>
            <input
              {...inputProps("mobile")}
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="Enter mobile number"
              onChange={(e) => update("mobile", e.target.value)}
            />
          </Field>
          <Field id="installationAddress" label="Installation Address" required error={errors.installationAddress} className="sm:col-span-2">
            <textarea
              {...inputProps("installationAddress")}
              rows={3}
              autoComplete="street-address"
              placeholder="Enter complete installation address"
              className={cn(inputClass, "min-h-[80px] resize-y py-3", errors.installationAddress ? "border-red-500" : "border-[#b7b7b7]")}
              onChange={(e) => update("installationAddress", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="mb-10">
        <SectionTitle>02. Product Information</SectionTitle>
        <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
          <Field
            id="productModel"
            label="Product / Solar Model (from Product Master)"
            required
            error={errors.productModel}
            hint={isCustomModel ? "Type your model number below" : "Select from registered Olitec models"}
          >
            {!isCustomModel ? (
              <div className="space-y-2">
                <select
                  id="productModel"
                  name="productModel"
                  value={values.productModel}
                  aria-invalid={errors.productModel ? true : undefined}
                  className={cn(
                    inputClass,
                    "h-11 cursor-pointer bg-white",
                    errors.productModel ? "border-red-500" : "border-[#b7b7b7]"
                  )}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "__custom__") {
                      setIsCustomModel(true);
                      update("productModel", "");
                    } else {
                      update("productModel", val);
                    }
                  }}
                >
                  <option value="">-- Choose Product Model --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.model}>
                      {p.name} ({p.model}) • {p.category}
                    </option>
                  ))}
                  <option value="__custom__">✎ Other model / Enter manually...</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <input
                    {...inputProps("productModel")}
                    type="text"
                    placeholder="e.g. OLI-1H3L or custom model"
                    onChange={(e) => update("productModel", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomModel(false);
                      update("productModel", "");
                    }}
                    className="absolute right-3 top-2.5 text-xs font-semibold text-brand-600 hover:underline"
                  >
                    Select from list
                  </button>
                </div>
              </div>
            )}
          </Field>
          <Field id="serialNumber" label="Product Serial Number" required error={errors.serialNumber} hint="e.g. OL-INV-2026-8812">
            <input
              {...inputProps("serialNumber")}
              type="text"
              autoComplete="off"
              placeholder="Enter serial number"
              onChange={(e) => update("serialNumber", e.target.value.toUpperCase())}
            />
          </Field>
        </div>
      </section>

      <section className="mb-10">
        <SectionTitle>03. Purchase &amp; Installation Details</SectionTitle>
        <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
          <Field id="purchaseDate" label="Purchase Date" required error={errors.purchaseDate}>
            <input {...inputProps("purchaseDate")} type="date" max={today} onChange={(e) => update("purchaseDate", e.target.value)} />
          </Field>
          <Field id="installationDate" label="Installation Date" required error={errors.installationDate}>
            <input
              {...inputProps("installationDate")}
              type="date"
              min={values.purchaseDate || undefined}
              max={today}
              onChange={(e) => update("installationDate", e.target.value)}
            />
          </Field>
          <Field id="dealerName" label="Dealer / Distributor Name" required error={errors.dealerName}>
            <input {...inputProps("dealerName")} type="text" placeholder="Enter dealer name" onChange={(e) => update("dealerName", e.target.value)} />
          </Field>
          <Field id="dealerContact" label="Dealer Contact Number" error={errors.dealerContact}>
            <input {...inputProps("dealerContact")} type="tel" placeholder="Enter dealer contact" onChange={(e) => update("dealerContact", e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="mb-8">
        <SectionTitle>04. Document Upload</SectionTitle>
        <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
          {(
            [
              ["invoice", "Purchase Invoice"],
              ["installationDocument", "Installation Document"],
            ] as const
          ).map(([field, label]) => (
            <Field key={field} id={field} label={label} required error={errors[field]} hint="PDF, JPG, PNG · up to 5 MB">
              <input
                id={field}
                name={field}
                type="file"
                accept={INVOICE_ACCEPTED_TYPES.join(",")}
                aria-invalid={errors[field] ? true : undefined}
                aria-describedby={errors[field] ? `${field}-error` : undefined}
                onChange={(e) => updateFile(field, e.target.files?.[0] ?? null)}
                className={cn(
                  "block w-full rounded-[12px] border bg-white px-3 py-2.5 text-sm text-ink file:mr-3 file:rounded-full file:border file:border-[#e6e6e6] file:bg-brand-50 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-brand-800 hover:file:bg-brand-100",
                  errors[field] ? "border-red-500" : "border-[#b7b7b7]",
                )}
              />
            </Field>
          ))}
        </div>
      </section>

      {/* 05. Account Activation & Email OTP (Only for users not currently signed in) */}
      {!currentUser && (
        <section className="mb-8">
          <SectionTitle>05. Account Activation &amp; Email Verification</SectionTitle>
          <div className="rounded-2xl border-2 border-brand-200 bg-brand-50/50 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-brand-900 font-bold text-sm">
              <ShieldCheck size={18} className="text-brand-600" />
              <span>Create Account to Track This Warranty in Your Dashboard</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              To track this warranty, request service visits, and access product documents, set a password and verify your email address. Both account activation and warranty registration will be processed together.
            </p>

            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-800">
                  Create Account Password <span className="text-brand-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    placeholder="Min 8 chars (letter & number)"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="block w-full h-11 rounded-[12px] border border-slate-300 bg-white px-4 pr-10 text-sm text-black focus:border-brand-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-800">
                  Confirm Password <span className="text-brand-600">*</span>
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="Re-type your password"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  className="block w-full h-11 rounded-[12px] border border-slate-300 bg-white px-4 text-sm text-black focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Email OTP Verification Section */}
            <div className="pt-2 border-t border-brand-200/60">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  6-Digit Email Verification Code (OTP) <span className="text-brand-600">*</span>
                </label>
                <button
                  type="button"
                  disabled={otpLoading || !values.email}
                  onClick={handleSendWarrantyOtp}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900 hover:underline disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw size={12} className={otpLoading ? "animate-spin" : ""} />
                  <span>{otpSent ? "Resend OTP" : "Send OTP to " + (values.email || "Email")}</span>
                </button>
              </div>

              {otpMsg && (
                <p className="mb-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>{otpMsg}</span>
                </p>
              )}

              <input
                type="text"
                maxLength={6}
                required
                placeholder="Enter 6-digit OTP code"
                value={signupOtp}
                onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, ""))}
                className="block w-full h-11 rounded-[12px] border border-brand-300 bg-white px-4 font-mono text-base font-bold tracking-widest text-slate-900 focus:border-brand-500 focus:outline-none text-center"
              />
            </div>
          </div>
        </section>
      )}

      <div className="border-t border-[#e6e6e6] pt-5">
        <p className="mb-5 text-xs text-muted">Please verify all details before submitting your warranty registration.</p>
        {formError && (
          <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || otpLoading}
          className="brand-gradient flex h-[52px] w-full items-center justify-center rounded-full text-[15px] font-semibold text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {submitting
            ? currentUser
              ? "Submitting Warranty…"
              : "Verifying & Registering…"
            : currentUser
              ? "Submit Warranty Registration"
              : otpSent
                ? "Verify OTP & Register Warranty"
                : "Verify Email & Register Warranty"}
        </button>
      </div>
    </form>
  );
}
