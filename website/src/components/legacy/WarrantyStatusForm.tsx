"use client";

import { useId, useState, type FormEvent } from "react";
import { lookupWarrantyStatus, type WarrantyStatusResult } from "@/services/warranties";
import { validateMobile, validateSerialNumber } from "@/lib/validation";
import { formatDate } from "@/lib/format";
import { warrantyStatusPage } from "@/content/pages";
import { cn } from "@/lib/cn";
import { DefinitionRows, LegacyCard, legacyButton, legacyButtonSecondary } from "./ui";

const controlClass =
  "box-border block min-h-12 w-full rounded-[12px] border bg-white px-3.5 py-3 text-base text-black focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_3px_rgb(249_159_30/0.2)]";

/** "Check your warranty status" form. Looks up the sample warranties until the API exists. */
export function WarrantyStatusForm() {
  const id = useId();
  const [errors, setErrors] = useState<{ serial?: string; mobile?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [found, setFound] = useState<WarrantyStatusResult | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const serial = String(data.get("serial") ?? "");
    const mobile = String(data.get("mobile") ?? "");
    const next = { serial: validateSerialNumber(serial), mobile: validateMobile(mobile) };
    setErrors(next);
    if (next.serial || next.mobile) return;

    setSubmitting(true);
    const result = await lookupWarrantyStatus(serial, mobile);
    setSubmitting(false);
    if (!result.ok) {
      setErrors({ form: result.message });
      return;
    }
    setFound(result.data);
  }

  if (found) {
    return (
      <div role="status" className="rounded-[25.528px] border-[1.5px] border-leaf bg-leaf/10 p-7">
        <h3 className="mb-2 text-[22px] font-semibold text-forest">Warranty found</h3>
        <p className="mb-2">We have found your registration. Your warranty details are shown below.</p>
        <p className="text-sm text-muted">Demo build: details come from sample data and no SMS is sent.</p>
        <LegacyCard className="mt-5">
          <h3 className="mb-3 text-[20px] font-semibold text-black">Warranty details</h3>
          <DefinitionRows
            rows={[
              { label: "Product model", value: found.model },
              { label: "Serial number", value: found.serialNumber },
              { label: "Registered on", value: formatDate(found.registeredOn) },
              { label: "Warranty valid until", value: found.validUntil ? formatDate(found.validUntil) : "Starts after verification" },
              { label: "Status", value: found.status },
            ]}
          />
        </LegacyCard>
        <button type="button" className={cn(legacyButtonSecondary, "mt-[18px]")} onClick={() => setFound(null)}>
          Check another
        </button>
      </div>
    );
  }

  const field = (name: "serial" | "mobile", label: string, hint?: string) => {
    const error = errors[name];
    return (
      <div>
        <label htmlFor={`${id}-${name}`} className="mb-1.5 block text-[15px] font-semibold text-black">
          {label}
        </label>
        <input
          id={`${id}-${name}`}
          name={name}
          type={name === "mobile" ? "tel" : "text"}
          inputMode={name === "mobile" ? "numeric" : undefined}
          aria-required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-${name}-error` : hint ? `${id}-${name}-hint` : undefined}
          className={cn(controlClass, error ? "border-red-500" : "border-[#b7b7b7]")}
        />
        {error ? (
          <p id={`${id}-${name}-error`} className="mt-1 text-[13px] text-red-600">
            {error}
          </p>
        ) : (
          hint && (
            <p id={`${id}-${name}-hint`} className="mt-1 text-[13px] text-muted">
              {hint}
            </p>
          )
        )}
      </div>
    );
  };

  return (
    <form noValidate onSubmit={onSubmit} className="grid grid-cols-1 gap-x-5 gap-y-[18px] sm:grid-cols-2">
      {field("serial", "Serial number", warrantyStatusPage.serialHint)}
      {field("mobile", "Registered mobile number")}
      {errors.form && (
        <p className="text-[15px] text-red-600 sm:col-span-2" role="alert">
          {errors.form}
        </p>
      )}
      <div className="sm:col-span-2">
        <button type="submit" className={legacyButton} disabled={submitting}>
          {submitting ? "Checking…" : "Check status"}
        </button>
      </div>
    </form>
  );
}
