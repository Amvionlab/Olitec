"use client";

import { Field, Select, TextField } from "@/components/ui";
import type { AddressInput } from "@/types";

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand",
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

export const emptyAddress: AddressInput = { fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" };

/** Client-side checks mirror the backend schema so customers see problems before submitting. */
export function validateAddress(address: AddressInput): Partial<Record<keyof AddressInput, string>> {
  const errors: Partial<Record<keyof AddressInput, string>> = {};
  if (address.fullName.trim().length < 2) errors.fullName = "Enter the full name.";
  if (!/^[6-9][0-9]{9}$/.test(address.phone)) errors.phone = "Enter a 10-digit mobile number.";
  if (address.line1.trim().length < 3) errors.line1 = "Enter the street address.";
  if (address.city.trim().length < 2) errors.city = "Enter the city.";
  if (!address.state) errors.state = "Choose the state.";
  if (!/^[1-9][0-9]{5}$/.test(address.pincode)) errors.pincode = "Enter a 6-digit pincode.";
  return errors;
}

export function AddressFields({
  value,
  onChange,
  errors = {},
  idPrefix,
}: {
  value: AddressInput;
  onChange: (value: AddressInput) => void;
  errors?: Partial<Record<keyof AddressInput, string>>;
  idPrefix: string;
}) {
  const set = (key: keyof AddressInput) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...value, [key]: event.target.value });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField id={`${idPrefix}-name`} label="Full name" required autoComplete="name" value={value.fullName} onChange={set("fullName")} error={errors.fullName} maxLength={100} />
      <TextField
        id={`${idPrefix}-phone`}
        label="Mobile number"
        required
        autoComplete="tel-national"
        inputMode="numeric"
        maxLength={10}
        value={value.phone}
        onChange={(event) => onChange({ ...value, phone: event.target.value.replace(/\D/g, "") })}
        error={errors.phone}
      />
      <div className="sm:col-span-2">
        <TextField id={`${idPrefix}-line1`} label="Address line 1" required autoComplete="address-line1" value={value.line1} onChange={set("line1")} error={errors.line1} maxLength={200} hint="House / flat number, building, street" />
      </div>
      <div className="sm:col-span-2">
        <TextField id={`${idPrefix}-line2`} label="Address line 2" autoComplete="address-line2" value={value.line2 ?? ""} onChange={set("line2")} maxLength={200} hint="Area, landmark (optional)" />
      </div>
      <TextField id={`${idPrefix}-city`} label="City" required autoComplete="address-level2" value={value.city} onChange={set("city")} error={errors.city} maxLength={100} />
      <Field id={`${idPrefix}-state`} label="State" required error={errors.state}>
        {(id, describedBy) => (
          <Select id={id} value={value.state} onChange={set("state")} required autoComplete="address-level1" aria-invalid={errors.state ? true : undefined} aria-describedby={describedBy}>
            <option value="">Select state</option>
            {INDIAN_STATES.map((state) => (
              <option key={state}>{state}</option>
            ))}
          </Select>
        )}
      </Field>
      <TextField
        id={`${idPrefix}-pincode`}
        label="Pincode"
        required
        autoComplete="postal-code"
        inputMode="numeric"
        maxLength={6}
        value={value.pincode}
        onChange={(event) => onChange({ ...value, pincode: event.target.value.replace(/\D/g, "") })}
        error={errors.pincode}
      />
    </div>
  );
}
