"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Package,
  ShoppingBag,
  FileText,
  Check,
} from "lucide-react";

import { apiPost, fileToUpload } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fetchActiveProducts, type ApiProductItem } from "@/services/products";
import { getStoredUser, register, sendRegistrationOtp, type UserProfile } from "@/services/auth";
import { DownloadWarrantyPdfButton } from "./DownloadWarrantyPdfButton";
import type { WarrantyCertificateData } from "@/lib/warranty-certificate-pdf";
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
  const [currentStep, setCurrentStep] = useState(1);

const steps = [
  {
    number: 1,
    title: "Customer Details",
    description: "Your personal information",
  },
  {
    number: 2,
    title: "Product Details",
    description: "Product and serial number",
  },
  {
    number: 3,
    title: "Purchase Details",
    description: "Purchase and dealer information",
  },
  {
    number: 4,
    title: "Documents",
    description: "Upload required documents",
  },
];
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
  const [serialStatus, setSerialStatus] = useState<
  "idle" | "checking" | "valid" | "invalid"
>("idle");
const [serialMessage, setSerialMessage] = useState("");
const [serialValidated, setSerialValidated] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ registrationNumber: string; serialNumber: string; persisted: boolean }>();
  const [submittedData, setSubmittedData] = useState<WarrantyCertificateData | null>(null);
  // Reset file inputs after a successful submission (they cannot be cleared through React state).
  const [formKey, setFormKey] = useState(0);

  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

  function update(field: TextFieldName, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }
  async function handleSerialValidation() {
  if (!values.serialNumber.trim() || !values.productModel.trim()) {
    setSerialStatus("idle");
    setSerialValidated(false);
    return;
  }
  setSerialStatus("idle");
  setSerialValidated(false);
  setSerialMessage("");
  setSerialStatus("checking");
  setSerialValidated(false);
  setSerialMessage("");

  const result = await apiPost("/warranty-registrations/validate-serial", {
    serialNumber: values.serialNumber.trim(),
    productModel: values.productModel.trim(),
  });

  if (result.ok) {
    setSerialStatus("valid");
    setSerialValidated(true);
    setSerialMessage("Serial number verified successfully.");
  } else {
    setSerialStatus("invalid");
    setSerialValidated(false);
    setSerialMessage(result.message || "Invalid serial number.");
  }
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

function validateCurrentStep() {
  const allErrors = validate(values, files, today);

  const fieldsByStep: Record<number, FieldName[]> = {
    1: ["customerName", "email", "mobile", "installationAddress"],
    2: ["productModel", "serialNumber"],
    3: [
      "purchaseDate",
      "installationDate",
      "dealerName",
      "dealerContact",
    ],
    4: ["invoice", "installationDocument"],
  };

  const currentFields = fieldsByStep[currentStep];
  const stepErrors: Errors = {};

  currentFields.forEach((field) => {
    if (allErrors[field]) {
      stepErrors[field] = allErrors[field];
    }
  });

  setErrors((prev) => ({
    ...prev,
    ...stepErrors,
  }));

  const firstInvalid = currentFields.find(
    (field) => allErrors[field]
  );

  if (firstInvalid) {
    formRef.current
      ?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)
      ?.focus();

    return false;
  }
  if (currentStep === 2 && serialStatus === "checking") {
  setFormError("Serial number verification is in progress. Please wait.");
  return false;
}
  if (currentStep === 2 && !serialValidated) {
    setFormError(
      "Please verify a valid serial number before continuing."
    );
    return false;
  }
if (currentStep === 4 && !currentUser) {
  const passErr = validateNewPassword(signupPassword);

  if (passErr) {
    setFormError(passErr);
    return false;
  }

  if (signupPassword !== signupConfirmPassword) {
    setFormError("Passwords do not match.");
    return false;
  }

  if (!otpSent || signupOtp.trim().length !== 6) {
    setFormError("Please send OTP and enter the 6-digit verification code.");
    return false;
  }
}
  setFormError(undefined);
  return true;
}

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);
    const nextErrors = validate(values, files, today);
    setErrors(nextErrors);
    if (!serialValidated) {
  setFormError("Please verify a valid serial number before submitting.");
  return;
}
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
      const matchedProduct = products.find((p) => p.model === values.productModel);
      setSubmittedData({
        warrantyNumber: result.data.registrationNumber,
        serialNumber: result.data.serialNumber,
        customerName: values.customerName.trim(),
        email: values.email.trim(),
        mobile: values.mobile.replace(/\D/g, ""),
        installationAddress: values.installationAddress.trim(),
        productName: matchedProduct?.name || values.productModel,
        productModel: values.productModel.trim(),
        capacity: (matchedProduct as any)?.capacity || "",
        mrp: matchedProduct?.priceInr || 0,
        warrantyMonths: matchedProduct?.warrantyMonths || 60,
        purchaseDate: values.purchaseDate,
        installationDate: values.installationDate,
        dealerName: values.dealerName.trim(),
        dealerContact: values.dealerContact.trim() || undefined,
        status: "Active",
      });

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
        <h2 className="text-2xl font-bold text-slate-900">Warranty Approved & Active!</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Registration Number: <strong className="text-slate-900 font-mono">{submitted.registrationNumber}</strong> | Serial:{" "}
          <strong className="text-slate-900 font-mono">{submitted.serialNumber}</strong>. Status:{" "}
          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 size={13} /> Active
          </span>
        </p>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Hardware serial number has been matched and verified with factory production records. Your warranty is active immediately without manual review.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {submittedData && (
            <DownloadWarrantyPdfButton
              data={submittedData}
              variant="primary"
              label="Download Warranty Certificate (PDF)"
              className="h-11 px-7 rounded-full text-sm font-bold shadow-md"
            />
          )}
          <Link
            href="/warranties"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-900 px-7 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            <span>Go to Your Dashboard</span>
            <ArrowRight size={16} />
          </Link>
          <button
            type="button"
            onClick={() => {
              setSubmitted(undefined);
              setSubmittedData(null);
              setSignupPassword("");
              setSignupConfirmPassword("");
              setSignupOtp("");
              setOtpSent(false);
              setOtpMsg(undefined);
            }}
            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-7 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 cursor-pointer"
          >
            Register Another Product
          </button>
        </div>
      </div>
    );
  }

  return (
    <form key={formKey} ref={formRef} onSubmit={handleSubmit} noValidate>
      <div className="mb-8">
  <div className="mb-6 flex items-center justify-between">
    <div>
      <p className="text-sm font-semibold text-slate-500">
        STEP {currentStep} OF 4
      </p>
      <h2 className="mt-1 text-xl font-bold text-slate-900">
        {steps[currentStep - 1].title}
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {steps[currentStep - 1].description}
      </p>
    </div>

    <div className="text-2xl font-bold text-brand-600">
      {Math.round((currentStep / 4) * 100)}%
    </div>
  </div>

  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
    <div
      className="h-full rounded-full bg-brand-500 transition-all duration-300"
      style={{ width: `${(currentStep / 4) * 100}%` }}
    />
  </div>

  <div className="mt-6 grid grid-cols-4 gap-2">
    {steps.map((step) => (
      <div key={step.number} className="text-center">
        <div
          className={`mx-auto flex size-9 items-center justify-center rounded-full text-sm font-bold ${
            currentStep >= step.number
              ? "bg-brand-500 text-black"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {currentStep > step.number ? (
            <Check size={17} />
          ) : (
            step.number
          )}
        </div>

        <p
          className={`mt-2 hidden text-xs font-semibold sm:block ${
            currentStep >= step.number
              ? "text-slate-900"
              : "text-slate-400"
          }`}
        >
          {step.title}
        </p>
      </div>
    ))}
  </div>
</div>
      {/* Autofill Notification Banner for Logged-in Users */}
      {currentUser && (
        <div className="mb-8 flex items-center gap-2.5 rounded-2xl bg-amber-50 border border-amber-200/80 px-4 py-3 text-xs font-semibold text-amber-950">
          <CheckCircle2 size={16} className="text-amber-600 shrink-0" />
          <span>
            Signed in as <strong>{currentUser.name}</strong> ({currentUser.email}) • Contact details autofilled and warranty will link directly to your Dashboard.
          </span>
        </div>
      )}

      {currentStep === 1 && (
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
      </section>)}

      {currentStep === 2 && (
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
                    setSerialStatus("idle");
                    setSerialValidated(false);
                    setSerialMessage("");
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
onChange={(e) => {
  update("productModel", e.target.value);
  setSerialStatus("idle");
  setSerialValidated(false);
  setSerialMessage("");
}}                  />
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
onChange={(e) => {
  update("serialNumber", e.target.value.toUpperCase());
  setSerialStatus("idle");
  setSerialValidated(false);
  setSerialMessage("");
}}
onBlur={handleSerialValidation}            />
{serialStatus === "checking" && (
  <p className="mt-1.5 text-xs text-slate-500">
    Checking serial number...
  </p>
)}

{serialStatus === "valid" && (
  <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600">
    <CheckCircle2 size={14} />
    {serialMessage}
  </p>
)}

{serialStatus === "invalid" && (
  <p className="mt-1.5 text-xs text-red-600">
    {serialMessage}
  </p>
)}
          </Field>
        </div>
      </section>)}

      {currentStep === 3 && (
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
      </section>)}

      {currentStep === 4 && (
  <>
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
  </>
)}

   
<div className="border-t border-[#e6e6e6] pt-5">
  <p className="mb-5 text-xs text-muted">
    Please verify all details before submitting your warranty registration.
  </p>

  {formError && (
    <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
      {formError}
    </div>
  )}

  <div className="flex items-center justify-between gap-3">
    {/* Previous Button */}
    <button
      type="button"
      onClick={() => {
        setCurrentStep((step) => step - 1);
        setFormError(undefined);
      }}
      disabled={currentStep === 1}
      className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      Previous
    </button>

    {/* Next Button */}
    {currentStep < 4 ? (
      <button
        type="button"
        onClick={() => {
          if (validateCurrentStep()) {
            setCurrentStep((step) => step + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
className="rounded-lg bg-[#1F7A34] px-7 py-3 text-sm font-semibold text-white transition hover:bg-green-800"      >
        Next
      </button>
    ) : (
      /* Final Submit Button */
      <button
        type="submit"
        disabled={
          submitting ||
          otpLoading ||
          !serialValidated ||
          serialStatus === "checking"
        }
className="rounded-lg bg-[#1F7A34] px-7 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"      >
        {submitting ? "Submitting..." : "Submit Registration"}
      </button>
    )}
  </div>
</div>

    </form>
  );
}
