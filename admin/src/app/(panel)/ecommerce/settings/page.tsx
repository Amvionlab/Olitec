"use client";

import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Field, LoadState, RequirePermission, inputClass, useAction, useApi } from "@/components/ecommerce/kit";
import { ecomApi } from "@/services/ecommerce/api";

interface Settings {
  store: { name: string; supportEmail: string; supportPhone: string; gstin: string; legalName: string; address: string };
  shipping: { flatFee: number; freeShippingThreshold: number; serviceablePincodePrefixes: string[]; estimatedDays: string };
  checkout: { guestCheckout: boolean; codEnabled: boolean; codMaxOrderValue: number; reservationMinutes: number };
  returns: { returnWindowDays: number; cancellableStatuses: string[] };
  social: { facebook: string; instagram: string; linkedin: string; youtube: string };
}

function SettingsContent() {
  const { data, error, loading, setData } = useApi<Settings>("/admin/settings");
  const [form, setForm] = useState<Settings | null>(null);
  const [prefixes, setPrefixes] = useState("");
  const { run, busy } = useAction();

  useEffect(() => {
    if (data) {
      setForm(structuredClone(data));
      setPrefixes(data.shipping.serviceablePincodePrefixes.join(", "));
    }
  }, [data]);

  const save = async (key: keyof Settings, patch: Record<string, unknown>) => {
    const result = await run(() => ecomApi.patch<Settings>(`/admin/settings/${key}`, patch), "Settings saved");
    if (result) setData(result);
  };

  if (!form) return <LoadState loading={loading} error={error}>{null}</LoadState>;
  const set = <K extends keyof Settings>(key: K, patch: Partial<Settings[K]>) => setForm({ ...form, [key]: { ...form[key], ...patch } });

  return (
    <>
      <PageHeader title="Store settings" description="Values used by checkout, invoices and the shop footer. Changes take effect within 30 seconds." />
      <Alert tone="warning" className="mb-6">Shipping fees, Cash on Delivery and the return window are business decisions. The defaults (free shipping, COD off, returns off) are placeholders — confirm them before launch.</Alert>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Store and invoice details" description="Printed on GST invoices and quotations" />
          <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void save("store", form.store); }}>
            <Field label="Store name"><input className={inputClass} maxLength={150} value={form.store.name} onChange={(event) => set("store", { name: event.target.value })} /></Field>
            <Field label="Legal name"><input className={inputClass} maxLength={200} value={form.store.legalName} onChange={(event) => set("store", { legalName: event.target.value })} /></Field>
            <Field label="GSTIN"><input className={inputClass} maxLength={15} value={form.store.gstin} onChange={(event) => set("store", { gstin: event.target.value.toUpperCase() })} /></Field>
            <Field label="Support phone"><input className={inputClass} maxLength={30} value={form.store.supportPhone} onChange={(event) => set("store", { supportPhone: event.target.value })} /></Field>
            <div className="md:col-span-2"><Field label="Support email"><input className={inputClass} type="email" value={form.store.supportEmail} onChange={(event) => set("store", { supportEmail: event.target.value })} /></Field></div>
            <div className="md:col-span-2"><Field label="Registered address"><textarea className={`${inputClass} min-h-16`} maxLength={500} value={form.store.address} onChange={(event) => set("store", { address: event.target.value })} /></Field></div>
            <div className="md:col-span-2"><Button type="submit" loading={busy}>Save store details</Button></div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Shipping" />
          <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={(event) => {
            event.preventDefault();
            const list = prefixes.split(/[\s,]+/).filter(Boolean);
            void save("shipping", { ...form.shipping, serviceablePincodePrefixes: list });
          }}>
            <Field label="Flat shipping fee (₹)" hint="0 = free shipping"><input className={inputClass} type="number" min={0} value={form.shipping.flatFee} onChange={(event) => set("shipping", { flatFee: Number(event.target.value) })} /></Field>
            <Field label="Free shipping from (₹)" hint="0 = no threshold"><input className={inputClass} type="number" min={0} value={form.shipping.freeShippingThreshold} onChange={(event) => set("shipping", { freeShippingThreshold: Number(event.target.value) })} /></Field>
            <div className="md:col-span-2"><Field label="Estimated delivery text" hint="Shown at checkout, e.g. “5–7 working days”"><input className={inputClass} maxLength={100} value={form.shipping.estimatedDays} onChange={(event) => set("shipping", { estimatedDays: event.target.value })} /></Field></div>
            <div className="md:col-span-2"><Field label="Serviceable pincode prefixes" hint="Comma-separated, e.g. 600, 632. Empty = deliver everywhere."><input className={inputClass} value={prefixes} onChange={(event) => setPrefixes(event.target.value)} /></Field></div>
            <div className="md:col-span-2"><Button type="submit" loading={busy}>Save shipping</Button></div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Checkout and payments" />
          <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void save("checkout", form.checkout); }}>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={form.checkout.guestCheckout} onChange={(event) => set("checkout", { guestCheckout: event.target.checked })} /> Allow guest checkout</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={form.checkout.codEnabled} onChange={(event) => set("checkout", { codEnabled: event.target.checked })} /> Offer Cash on Delivery</label>
            <Field label="COD maximum order (₹)" hint="0 = no limit"><input className={inputClass} type="number" min={0} value={form.checkout.codMaxOrderValue} onChange={(event) => set("checkout", { codMaxOrderValue: Number(event.target.value) })} /></Field>
            <Field label="Hold stock for unpaid checkouts (minutes)"><input className={inputClass} type="number" min={5} max={1440} value={form.checkout.reservationMinutes} onChange={(event) => set("checkout", { reservationMinutes: Number(event.target.value) })} /></Field>
            <div className="md:col-span-2"><Button type="submit" loading={busy}>Save checkout settings</Button></div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Cancellations and returns" />
          <form className="grid gap-4 p-5" onSubmit={(event) => { event.preventDefault(); void save("returns", form.returns); }}>
            <Field label="Return window after delivery (days)" hint="0 = customers cannot request returns online"><input className={inputClass} type="number" min={0} max={365} value={form.returns.returnWindowDays} onChange={(event) => set("returns", { returnWindowDays: Number(event.target.value) })} /></Field>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">Customers may request cancellation while the order is</legend>
              <div className="flex flex-wrap gap-4">
                {[["pending_payment", "Pending payment"], ["confirmed", "Confirmed"], ["processing", "Processing"], ["packed", "Packed"]].map(([status, text]) => (
                  <label key={status} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="accent-brand-600" checked={form.returns.cancellableStatuses.includes(status)} onChange={(event) => set("returns", { cancellableStatuses: event.target.checked ? [...form.returns.cancellableStatuses, status] : form.returns.cancellableStatuses.filter((item) => item !== status) })} />
                    {text}
                  </label>
                ))}
              </div>
            </fieldset>
            <div><Button type="submit" loading={busy}>Save return settings</Button></div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Social links" description="Shown in the shop footer when filled in" />
          <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void save("social", form.social); }}>
            {(["facebook", "instagram", "linkedin", "youtube"] as const).map((network) => (
              <Field key={network} label={network[0].toUpperCase() + network.slice(1)}><input className={inputClass} type="url" placeholder="https://" value={form.social[network]} onChange={(event) => set("social", { [network]: event.target.value })} /></Field>
            ))}
            <div className="md:col-span-2"><Button type="submit" loading={busy}>Save social links</Button></div>
          </form>
        </Card>
      </div>
    </>
  );
}

export default function SettingsPage() {
  return (
    <RequirePermission permission="settings.manage">
      <SettingsContent />
    </RequirePermission>
  );
}
