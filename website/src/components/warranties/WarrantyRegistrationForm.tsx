"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { apiPost, fileToUpload } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  INVOICE_ACCEPTED_TYPES,
  INVOICE_MAX_BYTES,
  validateEmail,
  validateMobile,
  validateName,
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
  const [values, setValues] = useState<Values>({ ...emptyValues, productModel: defaultProductModel });
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
      <div role="status" className="space-y-4 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-leaf/10 text-2xl text-leaf" aria-hidden>
          ✓
        </div>
        <h2 className="text-xl font-semibold text-black">Warranty registration submitted</h2>
        <p className="text-[15px] text-muted">
          Your registration number is <strong className="text-black">{submitted.registrationNumber}</strong> for serial number{" "}
          <strong className="text-black">{submitted.serialNumber}</strong>. Status: <strong className="text-black">Pending</strong>.
        </p>
        {!submitted.persisted && (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Demo mode: the server is not connected to the database, so this registration was not saved and the files were not uploaded.
          </p>
        )}
        <p className="text-sm text-muted">
          Our team will verify your invoice and installation document. Keep the registration number for future reference.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(undefined)}
          className="mt-2 inline-flex h-11 items-center justify-center rounded-full border border-black px-6 text-sm font-semibold text-black transition hover:bg-black/5"
        >
          Register another product
        </button>
      </div>
    );
  }

  return (
    <form key={formKey} ref={formRef} onSubmit={handleSubmit} noValidate>
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
          <Field id="productModel" label="Product / Solar Panel Model" required error={errors.productModel}>
            <input {...inputProps("productModel")} type="text" placeholder="Enter product model" onChange={(e) => update("productModel", e.target.value)} />
          </Field>
          <Field id="serialNumber" label="Product Serial Number" required error={errors.serialNumber}>
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

      <div className="border-t border-[#e6e6e6] pt-5">
        <p className="mb-5 text-xs text-muted">Please verify all details before submitting your warranty registration.</p>
        {formError && (
          <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="brand-gradient flex h-[52px] w-full items-center justify-center rounded-full text-[15px] font-semibold text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit Warranty Registration"}
        </button>
      </div>
    </form>
  );
}
