"use client";

import { use, useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Field, LoadState, Modal, RequirePermission, StatusPill, inputClass, useAction, useApi } from "@/components/ecommerce/kit";
import { formatDate, formatDateTime, formatMobile } from "@/lib/format";
import { ECOM_API_BASE, ecomApi, label, money } from "@/services/ecommerce/api";

const STATUSES = ["new", "contacted", "quotation_sent", "negotiation", "converted", "closed"];

interface Enquiry {
  id: number;
  enquiryNumber: string;
  contactName: string;
  companyName: string | null;
  email: string;
  phone: string;
  products: { name: string; quantity: number }[];
  deliveryLocation: string;
  gstin: string | null;
  requirements: string | null;
  status: string;
  assignedAdminId: number | null;
  convertedOrderNumber: string | null;
  createdAt: string;
  notes: { id: number; note: string; adminName: string | null; createdAt: string }[];
  quotations: { id: number; quotationNumber: string; total: number; validUntil: string; status: string; createdBy: string | null; createdAt: string }[];
}

type QuoteLine = { name: string; sku: string; quantity: string; unitPrice: string; taxRate: string };

function Detail({ id }: { id: string }) {
  const { data, error, loading, setData } = useApi<Enquiry>(`/admin/bulk-enquiries/${encodeURIComponent(id)}`);
  const staff = useApi<{ id: number; name: string }[]>("/admin/orders/staff");
  const { run, busy } = useAction();
  const [note, setNote] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [quote, setQuote] = useState<{ lines: QuoteLine[]; shipping: string; validUntil: string; terms: string; send: boolean } | null>(null);

  if (!data) return <LoadState loading={loading} error={error}>{null}</LoadState>;
  const save = async (body: Record<string, unknown>, message: string) => {
    const result = await run(() => ecomApi.patch<Enquiry>(`/admin/bulk-enquiries/${data.id}`, body), message);
    if (result) setData(result);
  };

  const openQuote = () =>
    setQuote({
      lines: data.products.map((item) => ({ name: item.name, sku: "", quantity: String(item.quantity), unitPrice: "", taxRate: "18" })),
      shipping: "0",
      validUntil: new Date(Date.now() + 15 * 86400_000).toISOString().slice(0, 10),
      terms: "",
      send: true,
    });

  const quoteTotal = quote ? quote.lines.reduce((sum, line) => sum + Number(line.unitPrice || 0) * Number(line.quantity || 0) * (1 + Number(line.taxRate || 0) / 100), 0) + Number(quote.shipping || 0) : 0;

  return (
    <>
      <PageHeader title={`Enquiry ${data.enquiryNumber}`} description={`Received ${formatDateTime(data.createdAt)}`} back={{ href: "/ecommerce/enquiries", label: "Bulk enquiries" }} actions={<StatusPill status={data.status} />} />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="space-y-4 p-5 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><p className="font-medium text-slate-900">{data.companyName ?? data.contactName}</p><p className="text-slate-600">{data.contactName}<br /><a href={`mailto:${data.email}`} className="text-brand-700">{data.email}</a><br /><a href={`tel:${data.phone}`}>{formatMobile(data.phone)}</a></p></div>
              <div><p className="font-medium text-slate-900">Delivery</p><p className="text-slate-600">{data.deliveryLocation}{data.gstin && <><br />GSTIN {data.gstin}</>}</p></div>
            </div>
            <div>
              <p className="font-medium text-slate-900">Requested products</p>
              <ul className="mt-1 list-disc pl-5 text-slate-600">{data.products.map((item, index) => <li key={index}>{item.name} — {item.quantity} units</li>)}</ul>
            </div>
            {data.requirements && <div><p className="font-medium text-slate-900">Additional requirements</p><p className="whitespace-pre-line text-slate-600">{data.requirements}</p></div>}
          </Card>

          <Card>
            <CardHeader title="Quotations" action={<Button size="sm" onClick={openQuote}><Plus className="size-4" aria-hidden /> Prepare quotation</Button>} />
            {data.quotations.length === 0 ? <p className="p-5 text-sm text-slate-500">No quotations yet.</p> : (
              <ul className="divide-y divide-slate-100">
                {data.quotations.map((quotation) => (
                  <li key={quotation.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                    <span>
                      <span className="font-medium">{quotation.quotationNumber}</span> · {money(quotation.total)} <StatusPill status={quotation.status} />
                      <span className="block text-xs text-slate-500">Valid until {formatDate(quotation.validUntil)} · by {quotation.createdBy ?? "—"}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <a href={`${ECOM_API_BASE}/admin/bulk-enquiries/quotations/${quotation.id}/document`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-700 hover:underline"><FileText className="size-4" aria-hidden /> Download</a>
                      <select aria-label={`Status of ${quotation.quotationNumber}`} className={`${inputClass} w-36`} value={quotation.status} onChange={async (event) => { const result = await run(() => ecomApi.patch<Enquiry>(`/admin/bulk-enquiries/quotations/${quotation.id}`, { status: event.target.value }), "Quotation updated"); if (result) setData(result); }}>
                        {["draft", "sent", "accepted", "rejected", "expired"].map((status) => <option key={status} value={status}>{label(status)}</option>)}
                      </select>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="space-y-3 p-5 text-sm">
            <h2 className="font-semibold">Follow-up notes</h2>
            <form className="flex gap-2" onSubmit={async (event) => { event.preventDefault(); if (note.trim().length < 2) return; const result = await run(() => ecomApi.post<Enquiry>(`/admin/bulk-enquiries/${data.id}/notes`, { note: note.trim() }), "Note added"); if (result) { setData(result); setNote(""); } }}>
              <input className={inputClass} value={note} maxLength={1000} placeholder="Call summary, next step…" onChange={(event) => setNote(event.target.value)} aria-label="New note" />
              <Button type="submit" size="sm" loading={busy}>Add</Button>
            </form>
            <ul className="space-y-2">{data.notes.map((item) => <li key={item.id} className="rounded-lg bg-slate-50 p-2"><p>{item.note}</p><p className="text-xs text-slate-500">{item.adminName} · {formatDateTime(item.createdAt)}</p></li>)}</ul>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="space-y-3 p-5">
            <Field label="Status">
              <select className={inputClass} value={data.status} onChange={(event) => void save({ status: event.target.value }, "Status updated")}>
                {STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}
              </select>
            </Field>
            <Field label="Assigned sales staff">
              <select className={inputClass} value={data.assignedAdminId ?? ""} onChange={(event) => void save({ assignedAdminId: event.target.value ? Number(event.target.value) : null }, "Assignment saved")}>
                <option value="">Unassigned</option>
                {staff.data?.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
              </select>
            </Field>
          </Card>
          <Card className="space-y-3 p-5 text-sm">
            <h2 className="font-semibold">Conversion</h2>
            {data.convertedOrderNumber ? (
              <p>Converted to order <strong>{data.convertedOrderNumber}</strong>.</p>
            ) : (
              <>
                <p className="text-slate-600">When the customer accepts, place the order (e.g. through the shop with the agreed coupon) and link it here.</p>
                <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void save({ convertedOrderNumber: orderNumber.trim().toUpperCase() }, "Enquiry marked as converted"); }}>
                  <input className={inputClass} placeholder="OL-2026-000123" pattern="OL-[0-9]{4}-[0-9]{6}" value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} aria-label="Order number" />
                  <Button type="submit" size="sm" loading={busy}>Link</Button>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>

      <Modal open={quote !== null} title="Prepare quotation" onClose={() => setQuote(null)} wide>
        {quote && (
          <form className="space-y-4" onSubmit={async (event) => {
            event.preventDefault();
            const result = await run(
              () =>
                ecomApi.post<Enquiry>(`/admin/bulk-enquiries/${data.id}/quotations`, {
                  items: quote.lines.map((line) => ({ name: line.name.trim(), ...(line.sku ? { sku: line.sku.trim() } : {}), quantity: Number(line.quantity), unitPrice: Number(line.unitPrice), taxRate: Number(line.taxRate) })),
                  shippingTotal: Number(quote.shipping || 0),
                  validUntil: quote.validUntil,
                  ...(quote.terms ? { terms: quote.terms } : {}),
                  status: quote.send ? "sent" : "draft",
                }),
              "Quotation created",
            );
            if (result) { setData(result); setQuote(null); }
          }}>
            <p className="text-sm text-slate-500">Unit prices are entered before GST, as usual for B2B quotations.</p>
            {quote.lines.map((line, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[2fr_1fr_80px_1fr_80px_auto] sm:items-end">
                <Field label="Item"><input className={inputClass} required minLength={2} value={line.name} onChange={(event) => setQuote({ ...quote, lines: quote.lines.map((item, position) => (position === index ? { ...item, name: event.target.value } : item)) })} /></Field>
                <Field label="SKU"><input className={inputClass} value={line.sku} onChange={(event) => setQuote({ ...quote, lines: quote.lines.map((item, position) => (position === index ? { ...item, sku: event.target.value } : item)) })} /></Field>
                <Field label="Qty"><input className={inputClass} required inputMode="numeric" value={line.quantity} onChange={(event) => setQuote({ ...quote, lines: quote.lines.map((item, position) => (position === index ? { ...item, quantity: event.target.value.replace(/\D/g, "") } : item)) })} /></Field>
                <Field label="Unit price ₹"><input className={inputClass} required inputMode="decimal" value={line.unitPrice} onChange={(event) => setQuote({ ...quote, lines: quote.lines.map((item, position) => (position === index ? { ...item, unitPrice: event.target.value } : item)) })} /></Field>
                <Field label="GST %"><input className={inputClass} required inputMode="decimal" value={line.taxRate} onChange={(event) => setQuote({ ...quote, lines: quote.lines.map((item, position) => (position === index ? { ...item, taxRate: event.target.value } : item)) })} /></Field>
                <Button variant="ghost" size="sm" disabled={quote.lines.length === 1} onClick={() => setQuote({ ...quote, lines: quote.lines.filter((_, position) => position !== index) })} aria-label="Remove line"><Trash2 className="size-4" /></Button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => setQuote({ ...quote, lines: [...quote.lines, { name: "", sku: "", quantity: "1", unitPrice: "", taxRate: "18" }] })}><Plus className="size-4" aria-hidden /> Add line</Button>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Shipping (₹)"><input className={inputClass} inputMode="decimal" value={quote.shipping} onChange={(event) => setQuote({ ...quote, shipping: event.target.value })} /></Field>
              <Field label="Valid until"><input className={inputClass} type="date" required value={quote.validUntil} onChange={(event) => setQuote({ ...quote, validUntil: event.target.value })} /></Field>
            </div>
            <Field label="Terms"><textarea className={`${inputClass} min-h-20`} maxLength={2000} value={quote.terms} onChange={(event) => setQuote({ ...quote, terms: event.target.value })} placeholder="Payment terms, delivery timeline, validity — as approved by the business" /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={quote.send} onChange={(event) => setQuote({ ...quote, send: event.target.checked })} /> Mark as sent to the customer</label>
            <div className="flex items-center justify-between">
              <p className="font-semibold">Total incl. GST: {money(Math.round(quoteTotal * 100) / 100)}</p>
              <div className="flex gap-2"><Button variant="secondary" onClick={() => setQuote(null)}>Cancel</Button><Button type="submit" loading={busy}>Save quotation</Button></div>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

export default function EnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequirePermission permission="enquiries.manage">
      <Detail id={id} />
    </RequirePermission>
  );
}
