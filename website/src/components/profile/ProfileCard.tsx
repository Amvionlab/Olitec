"use client";

import { useState, type FormEvent } from "react";
import { Pencil } from "lucide-react";
import type { Customer } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/FormField";
import { updateProfile, type ProfileUpdateInput } from "@/services/customer";
import { formatDate, formatMobile } from "@/lib/format";
import { hasErrors, validateMobile, validateName, validateRequired, type FieldErrors } from "@/lib/validation";

function toInput(customer: Customer): ProfileUpdateInput {
  const { name, mobile, addressLine, city, state, pincode } = customer;
  return { name, mobile, addressLine, city, state, pincode };
}

function validate(values: ProfileUpdateInput): FieldErrors<ProfileUpdateInput> {
  return {
    name: validateName(values.name),
    mobile: validateMobile(values.mobile),
    addressLine: validateRequired(values.addressLine, "Address"),
    city: validateRequired(values.city, "City"),
    state: validateRequired(values.state, "State"),
    pincode: /^\d{6}$/.test(values.pincode) ? undefined : "Enter a 6-digit PIN code.",
  };
}

export function ProfileCard({ initialCustomer }: { initialCustomer: Customer }) {
  const [customer, setCustomer] = useState(initialCustomer);
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(toInput(initialCustomer));
  const [errors, setErrors] = useState<FieldErrors<ProfileUpdateInput>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string>();

  const update = (field: keyof ProfileUpdateInput, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  function startEditing() {
    setValues(toInput(customer));
    setErrors({});
    setNotice(undefined);
    setEditing(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;
    setSaving(true);
    const result = await updateProfile(customer, values);
    setSaving(false);
    if (result.ok) {
      setCustomer(result.data);
      setEditing(false);
      setNotice(`${result.message} (Demo: changes are kept only until you reload.)`);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Personal information"
        description={`Member since ${formatDate(customer.memberSince)}`}
        action={
          !editing && (
            <Button variant="secondary" size="sm" onClick={startEditing}>
              <Pencil className="size-3.5" aria-hidden /> Edit
            </Button>
          )
        }
      />

      {notice && !editing && (
        <div className="px-5 pt-4">
          <Alert tone="success">{notice}</Alert>
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSubmit} noValidate className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Full name" value={values.name} onChange={(e) => update("name", e.target.value)} error={errors.name} required />
            <TextField
              label="Mobile number"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={values.mobile}
              onChange={(e) => update("mobile", e.target.value.replace(/\D/g, ""))}
              error={errors.mobile}
              required
            />
          </div>
          <TextField label="Email" value={customer.email} disabled hint="Contact support to change your email address." />
          <TextField label="Address" value={values.addressLine} onChange={(e) => update("addressLine", e.target.value)} error={errors.addressLine} required />
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="City" value={values.city} onChange={(e) => update("city", e.target.value)} error={errors.city} required />
            <TextField label="State" value={values.state} onChange={(e) => update("state", e.target.value)} error={errors.state} required />
            <TextField
              label="PIN code"
              inputMode="numeric"
              maxLength={6}
              value={values.pincode}
              onChange={(e) => update("pincode", e.target.value.replace(/\D/g, ""))}
              error={errors.pincode}
              required
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      ) : (
        <dl className="grid sm:grid-cols-2">
          {[
            { label: "Full name", value: customer.name },
            { label: "Email", value: customer.email },
            { label: "Mobile", value: formatMobile(customer.mobile) },
            { label: "Address", value: `${customer.addressLine}, ${customer.city}, ${customer.state} ${customer.pincode}` },
          ].map((item) => (
            <div key={item.label} className="border-b border-slate-100 px-5 py-3 sm:odd:border-r">
              <dt className="text-xs text-slate-500">{item.label}</dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-900">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}
