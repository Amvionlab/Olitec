"use client";

import { useState } from "react";
import { Building2, Plus, Trash2 } from "lucide-react";
import { Alert, Button, Card, Container, TextArea, TextField } from "@/components/ui";
import { api, errorMessage } from "@/services/api";
import { useStore } from "@/store/StoreProvider";

type Line = { name: string; quantity: string };
const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export default function BulkPurchasePage() {
  const { customer } = useStore();
  const [form, setForm] = useState({ contactName: "", companyName: "", email: "", phone: "", deliveryLocation: "", gstin: "", requirements: "" });
  const [lines, setLines] = useState<Line[]>([{ name: "", quantity: "" }]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const values = { ...form, contactName: form.contactName || customer?.name || "", email: form.email || customer?.email || "", phone: form.phone || customer?.mobile || "" };
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...values, [key]: key === "phone" ? event.target.value.replace(/\D/g, "") : key === "gstin" ? event.target.value.toUpperCase() : event.target.value });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (values.contactName.trim().length < 2) next.contactName = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = "Enter a valid email.";
    if (!/^[6-9][0-9]{9}$/.test(values.phone)) next.phone = "Enter a 10-digit mobile number.";
    if (values.deliveryLocation.trim().length < 3) next.deliveryLocation = "Enter the delivery city or site.";
    if (values.gstin && !GSTIN.test(values.gstin)) next.gstin = "Enter a valid GSTIN.";
    const products = lines.filter((line) => line.name.trim()).map((line) => ({ name: line.name.trim(), quantity: Number.parseInt(line.quantity, 10) }));
    if (!products.length || products.some((line) => !Number.isInteger(line.quantity) || line.quantity < 1)) next.products = "Add at least one product with a quantity.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const data = await api.post<{ enquiryNumber: string }>("/bulk-enquiries", {
        contactName: values.contactName.trim(),
        companyName: values.companyName.trim() || undefined,
        email: values.email.trim(),
        phone: values.phone,
        products,
        deliveryLocation: values.deliveryLocation.trim(),
        gstin: values.gstin || undefined,
        requirements: values.requirements.trim() || undefined,
      });
      setResult({ kind: "success", text: `Thank you! Your enquiry ${data.enquiryNumber} has been received. Our team will contact you with a quotation.` });
      setLines([{ name: "", quantity: "" }]);
      setForm({ contactName: "", companyName: "", email: "", phone: "", deliveryLocation: "", gstin: "", requirements: "" });
    } catch (reason) {
      setResult({ kind: "error", text: errorMessage(reason) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="max-w-3xl space-y-6 py-10">
      <div className="flex items-start gap-4">
        <span className="rounded-2xl bg-brand-50 p-3 text-brand-600">
          <Building2 className="size-7" aria-hidden />
        </span>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Bulk purchase enquiry</h1>
          <p className="mt-1 text-slate-600">For installers, businesses and projects. Tell us what you need and we will send a quotation.</p>
        </div>
      </div>
      {result && <Alert kind={result.kind}>{result.text}</Alert>}
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Your name" required value={values.contactName} onChange={set("contactName")} error={errors.contactName} autoComplete="name" />
            <TextField label="Company name" value={values.companyName} onChange={set("companyName")} autoComplete="organization" />
            <TextField label="Email" type="email" required value={values.email} onChange={set("email")} error={errors.email} autoComplete="email" />
            <TextField label="Mobile number" required inputMode="numeric" maxLength={10} value={values.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel-national" />
            <TextField label="Delivery location" required value={values.deliveryLocation} onChange={set("deliveryLocation")} error={errors.deliveryLocation} hint="City / district and pincode" />
            <TextField label="GSTIN" value={values.gstin} onChange={set("gstin")} error={errors.gstin} maxLength={15} hint="Optional — for GST invoicing" />
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-slate-900">Products and quantities *</legend>
            {lines.map((line, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1">
                  <TextField label={`Product ${index + 1}`} value={line.name} onChange={(event) => setLines(lines.map((item, position) => (position === index ? { ...item, name: event.target.value } : item)))} placeholder="e.g. 540 W mono PERC panels" maxLength={200} />
                </div>
                <div className="w-28">
                  <TextField label="Quantity" inputMode="numeric" value={line.quantity} onChange={(event) => setLines(lines.map((item, position) => (position === index ? { ...item, quantity: event.target.value.replace(/\D/g, "") } : item)))} />
                </div>
                {lines.length > 1 && (
                  <button type="button" onClick={() => setLines(lines.filter((_, position) => position !== index))} className="mb-1 rounded-lg p-2.5 text-slate-500 hover:bg-slate-100 hover:text-red-600" aria-label={`Remove product ${index + 1}`}>
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            ))}
            {errors.products && <p className="text-xs text-red-600">{errors.products}</p>}
            {lines.length < 20 && (
              <Button variant="ghost" size="sm" onClick={() => setLines([...lines, { name: "", quantity: "" }])}>
                <Plus className="size-4" aria-hidden /> Add another product
              </Button>
            )}
          </fieldset>

          <div className="space-y-1.5">
            <label htmlFor="requirements" className="block text-sm font-medium text-slate-700">
              Additional requirements
            </label>
            <TextArea id="requirements" value={values.requirements} onChange={set("requirements")} maxLength={2000} placeholder="Timeline, installation needs, technical specifications…" />
          </div>
          <Button type="submit" size="lg" loading={busy}>
            Submit enquiry
          </Button>
        </form>
      </Card>
    </Container>
  );
}
