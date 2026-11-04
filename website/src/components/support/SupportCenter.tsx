"use client";

import { useState, type FormEvent } from "react";
import type { Customer, SupportCategory, SupportRequest } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/FormField";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createSupportRequest, supportCategories, type SupportRequestInput } from "@/services/support";
import { formatDateTime } from "@/lib/format";
import { hasErrors, validateEmail, validateMobile, validateName, type FieldErrors } from "@/lib/validation";

interface SupportCenterProps {
  customer: Customer;
  initialRequests: SupportRequest[];
  warrantyNumbers: string[];
}

function validate(values: SupportRequestInput): FieldErrors<SupportRequestInput> {
  return {
    name: validateName(values.name),
    email: validateEmail(values.email),
    mobile: validateMobile(values.mobile),
    subject: values.subject.trim().length >= 5 ? undefined : "Subject must be at least 5 characters.",
    message:
      values.message.trim().length >= 20 ? undefined : "Please describe the issue in at least 20 characters.",
  };
}

export function SupportCenter({ customer, initialRequests, warrantyNumbers }: SupportCenterProps) {
  const emptyForm: SupportRequestInput = {
    name: customer.name,
    email: customer.email,
    mobile: customer.mobile,
    category: "Repair",
    warrantyNumber: "",
    subject: "",
    message: "",
  };
  const [requests, setRequests] = useState(initialRequests);
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState<FieldErrors<SupportRequestInput>>({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string }>();

  const update = <K extends keyof SupportRequestInput>(field: K, value: SupportRequestInput[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setNotice(undefined);
    if (hasErrors(nextErrors)) return;

    setSubmitting(true);
    const result = await createSupportRequest(values);
    setSubmitting(false);
    if (!result.ok) {
      setNotice({ tone: "error", text: result.message });
      return;
    }
    setRequests((current) => [result.data, ...current]);
    setValues(emptyForm);
    setNotice({ tone: "success", text: `${result.message} Ticket ${result.data.ticketNumber}.` });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader title="New support request" description="Tell us what you need and we will get back to you." />
        <form onSubmit={handleSubmit} noValidate className="space-y-4 p-5">
          {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Name" value={values.name} onChange={(e) => update("name", e.target.value)} error={errors.name} required />
            <TextField label="Email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} error={errors.email} required />
            <TextField
              label="Mobile"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={values.mobile}
              onChange={(e) => update("mobile", e.target.value.replace(/\D/g, ""))}
              error={errors.mobile}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Request type" value={values.category} onChange={(e) => update("category", e.target.value as SupportCategory)} required>
              {supportCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </SelectField>
            <SelectField label="Related warranty" value={values.warrantyNumber} onChange={(e) => update("warrantyNumber", e.target.value)} hint="Optional">
              <option value="">Not related to a warranty</option>
              {warrantyNumbers.map((number) => (
                <option key={number}>{number}</option>
              ))}
            </SelectField>
          </div>
          <TextField label="Subject" value={values.subject} onChange={(e) => update("subject", e.target.value)} error={errors.subject} maxLength={120} required />
          <TextAreaField
            label="Describe the issue"
            value={values.message}
            onChange={(e) => update("message", e.target.value)}
            error={errors.message}
            hint={`${values.message.trim().length}/1000 characters`}
            maxLength={1000}
            required
          />
          <div className="flex justify-end">
            <Button type="submit" loading={submitting}>
              {submitting ? "Submitting…" : "Submit request"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="h-fit lg:col-span-2">
        <CardHeader title="My requests" description="Status updates appear here." />
        {requests.length === 0 ? (
          <EmptyState title="No support requests yet" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {requests.map((request) => (
              <li key={request.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-slate-900">{request.subject}</p>
                  <StatusBadge status={request.status} className="shrink-0" />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {request.ticketNumber} · {request.category}
                  {request.warrantyNumber && ` · ${request.warrantyNumber}`}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">Updated {formatDateTime(request.updatedAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
