"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { enquiryForms, type EnquiryField, type EnquiryKind } from "@/content/forms";
import { savedEnquiryKinds, submitEnquiry, type EnquiryValues } from "@/services/enquiries";
import { validateEmail, validateMobile, validateName, validateRequired, validateSerialNumber } from "@/lib/validation";
import { cn } from "@/lib/cn";
import { legacyButton, legacyButtonSecondary } from "./ui";

const controlClass =
  "box-border block min-h-12 w-full rounded-[12px] border bg-white px-3.5 py-3 text-base text-black focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_3px_rgb(249_159_30/0.2)]";

function validateField(field: EnquiryField, value: string, file: File | null): string | undefined {
  if (field.type === "file") {
    if (!file) return field.required ? `${field.label} is required.` : undefined;
    if (field.acceptTypes && !field.acceptTypes.includes(file.type)) return `${field.label}: this file type is not accepted.`;
    if (field.maxMb && file.size > field.maxMb * 1024 * 1024) return `${field.label} must be ${field.maxMb} MB or smaller.`;
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) return field.required ? (field.type === "select" ? `Select ${field.label.toLowerCase()}.` : validateRequired(value, field.label)) : undefined;
  switch (field.type) {
    case "name":
      return validateName(value);
    case "email":
      return validateEmail(value);
    case "tel":
      return validateMobile(value);
    case "serial":
      return validateSerialNumber(value);
    case "pincode":
      return /^[1-9]\d{5}$/.test(trimmed) ? undefined : "Enter a valid 6-digit PIN code.";
    case "number":
      return Number(trimmed) >= 0 ? undefined : `${field.label} must be 0 or more.`;
    case "url":
      return /^https?:\/\/\S+\.\S+/.test(trimmed) ? undefined : "Enter a full link starting with https://";
    case "date": {
      const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
      return trimmed >= today ? undefined : `${field.label} cannot be in the past.`;
    }
    default:
      return undefined;
  }
}

function inputType(field: EnquiryField) {
  switch (field.type) {
    case "name":
    case "serial":
    case "pincode":
      return "text";
    default:
      return field.type;
  }
}

/** Form from the Olitec HTML design with validation. Service requests are saved; the other kinds are simulated. */
export function EnquiryForm({ kind }: { kind: EnquiryKind }) {
  const config = enquiryForms[kind];
  const baseId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values: EnquiryValues = {};
    const files: Record<string, File> = {};
    const nextErrors: Record<string, string> = {};

    for (const field of config.fields) {
      const raw = data.get(field.name);
      const file = raw instanceof File && raw.size > 0 ? raw : null;
      const value = typeof raw === "string" ? raw : (file?.name ?? "");
      values[field.name] = value;
      if (file) files[field.name] = file;
      const error = validateField(field, value, file);
      if (error) nextErrors[field.name] = error;
    }
    if (!data.get("consent")) nextErrors.consent = "Please tick the box to continue.";

    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setSubmitting(true);
    const response = await submitEnquiry(kind, values, files).catch(() => ({
      ok: false as const,
      message: "We could not read the attached file. Please choose it again.",
      fieldErrors: undefined,
    }));
    setSubmitting(false);
    if (!response.ok) {
      setErrors({ ...response.fieldErrors, form: response.message });
      return;
    }
    setResult(config.success.message.replace("{reference}", response.data.reference ?? ""));
    requestAnimationFrame(() => successRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  if (result) {
    return (
      <div ref={successRef} role="status" className="rounded-[25.528px] border-[1.5px] border-leaf bg-leaf/10 p-7">
        <h3 className="mb-2 text-[22px] font-semibold text-forest">{config.success.title}</h3>
        <p className="mb-2">{result}</p>
        {!savedEnquiryKinds.includes(kind) && (
          <p className="mb-[18px] text-sm text-muted">Demo build: this form was not sent or saved, and no files were uploaded.</p>
        )}
        <button
          type="button"
          className={legacyButtonSecondary}
          onClick={() => {
            setResult(null);
            setErrors({});
          }}
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="grid grid-cols-1 gap-x-5 gap-y-[18px] sm:grid-cols-2">
      {config.fields.map((field) => {
        const id = `${baseId}-${field.name}`;
        const error = errors[field.name];
        const describedBy = error ? `${id}-error` : field.hint ? `${id}-hint` : undefined;
        const common = {
          id,
          name: field.name,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": describedBy,
          "aria-required": field.required || undefined,
          className: cn(controlClass, error ? "border-red-500" : "border-[#b7b7b7]"),
        };
        return (
          <div key={field.name} className={cn(field.full && "sm:col-span-2")}>
            <label htmlFor={id} className="mb-1.5 block text-[15px] font-semibold text-black">
              {field.label}
              {field.required && <span className="sr-only"> (required)</span>}
            </label>
            {field.type === "select" ? (
              <select {...common} defaultValue="">
                <option value="">{field.emptyOption ?? "Select"}</option>
                {field.options?.map((option) => (
                  <option key={option}>{option}</option>
                ))}
                {field.groups?.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea {...common} placeholder={field.placeholder} className={cn(common.className, "min-h-[120px] resize-y")} />
            ) : (
              <input
                {...common}
                type={inputType(field)}
                placeholder={field.placeholder}
                accept={field.accept}
                inputMode={field.type === "tel" || field.type === "pincode" ? "numeric" : undefined}
                min={field.type === "number" ? 0 : undefined}
                autoComplete={field.type === "name" ? "name" : field.type === "email" ? "email" : field.type === "tel" ? "tel" : undefined}
              />
            )}
            {error ? (
              <p id={`${id}-error`} className="mt-1 text-[13px] text-red-600">
                {error}
              </p>
            ) : (
              field.hint && (
                <p id={`${id}-hint`} className="mt-1 text-[13px] text-muted">
                  {field.hint}
                </p>
              )
            )}
          </div>
        );
      })}

      <div className="sm:col-span-2">
        <label className="flex items-start gap-2.5 text-[15px] text-muted">
          <input
            type="checkbox"
            name="consent"
            className="mt-[3px] size-5 flex-none accent-brand-500"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? `${baseId}-consent-error` : undefined}
          />
          <span>{config.consent}</span>
        </label>
        {errors.consent && (
          <p id={`${baseId}-consent-error`} className="mt-1 text-[13px] text-red-600">
            {errors.consent}
          </p>
        )}
      </div>

      {errors.form && (
        <p className="text-[15px] text-red-600 sm:col-span-2" role="alert">
          {errors.form}
        </p>
      )}

      <div className="sm:col-span-2">
        <button type="submit" className={legacyButton} disabled={submitting}>
          {submitting ? "Submitting…" : config.submitLabel}
        </button>
      </div>
    </form>
  );
}
