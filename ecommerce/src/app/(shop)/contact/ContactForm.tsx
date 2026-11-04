"use client";

import { useState } from "react";
import { Alert, Button, TextArea, TextField } from "@/components/ui";
import { api, errorMessage } from "@/services/api";
import { useStore } from "@/store/StoreProvider";

export function ContactForm() {
  const { customer } = useStore();
  const [form, setForm] = useState({ name: "", email: "", phone: "", orderNumber: "", subject: "", message: "" });
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const values = { ...form, name: form.name || customer?.name || "", email: form.email || customer?.email || "" };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (values.message.trim().length < 10) return setResult({ kind: "error", text: "Please describe your question (at least 10 characters)." });
    if (values.phone && !/^[6-9][0-9]{9}$/.test(values.phone)) return setResult({ kind: "error", text: "Enter a 10-digit mobile number or leave it empty." });
    setBusy(true);
    try {
      const data = await api.post<{ ticketNumber: string }>("/support", {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone || undefined,
        orderNumber: values.orderNumber.trim().toUpperCase() || undefined,
        subject: values.subject.trim(),
        message: values.message.trim(),
      });
      setResult({ kind: "success", text: `Thanks — your request ${data.ticketNumber} has been received.${customer ? " You can follow it under Account → Support." : ""}` });
      setForm({ name: "", email: "", phone: "", orderNumber: "", subject: "", message: "" });
    } catch (reason) {
      setResult({ kind: "error", text: errorMessage(reason) });
    } finally {
      setBusy(false);
    }
  };

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...values, [key]: key === "phone" ? event.target.value.replace(/\D/g, "") : event.target.value });

  return (
    <form onSubmit={submit} className="space-y-4">
      {result && <Alert kind={result.kind}>{result.text}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name" required value={values.name} onChange={set("name")} autoComplete="name" />
        <TextField label="Email" type="email" required value={values.email} onChange={set("email")} autoComplete="email" />
        <TextField label="Mobile" inputMode="numeric" maxLength={10} value={values.phone} onChange={set("phone")} autoComplete="tel-national" />
        <TextField label="Order number" value={values.orderNumber} onChange={set("orderNumber")} placeholder="If your question is about an order" maxLength={24} />
      </div>
      <TextField label="Subject" required value={values.subject} onChange={set("subject")} minLength={3} maxLength={150} />
      <div className="space-y-1.5">
        <label htmlFor="message" className="block text-sm font-medium text-slate-700">
          Message <span className="text-red-600">*</span>
        </label>
        <TextArea id="message" required value={values.message} onChange={set("message")} maxLength={4000} rows={5} />
      </div>
      <Button type="submit" loading={busy}>
        Send message
      </Button>
    </form>
  );
}
