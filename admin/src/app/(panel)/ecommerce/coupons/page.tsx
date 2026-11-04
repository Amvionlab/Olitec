"use client";

import { Suspense, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { TBody, THead, Table, Td, Th } from "@/components/ui/Table";
import { Field, LoadState, Modal, Pager, Pill, RequirePermission, inputClass, useAction, useApi, useUrlFilters } from "@/components/ecommerce/kit";
import { formatDate } from "@/lib/format";
import { ecomApi, messageOf, money, qs } from "@/services/ecommerce/api";

interface Coupon {
  id: number;
  code: string;
  description: string | null;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  usedCount: number;
  newCustomersOnly: boolean;
  appliesTo: "all" | "products" | "categories";
  applicableIds: number[];
  isActive: boolean;
  totalDiscountGiven: number;
}

type Draft = Omit<Coupon, "id" | "usedCount" | "totalDiscountGiven" | "discountValue" | "minOrderValue" | "maxDiscount" | "usageLimit" | "perCustomerLimit" | "startsAt" | "endsAt" | "applicableIds" | "description"> & {
  id?: number;
  description: string;
  discountValue: string;
  minOrderValue: string;
  maxDiscount: string;
  usageLimit: string;
  perCustomerLimit: string;
  startsAt: string;
  endsAt: string;
  applicableIds: string;
};

const toLocal = (value: string | null) => (value ? new Date(new Date(value).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
const empty: Draft = { code: "", description: "", discountType: "percentage", discountValue: "", minOrderValue: "0", maxDiscount: "", usageLimit: "", perCustomerLimit: "1", newCustomersOnly: false, appliesTo: "all", applicableIds: "", isActive: true, startsAt: "", endsAt: "" };

function CouponsContent() {
  const { get, set } = useUrlFilters();
  const { data, meta, error, loading, reload } = useApi<Coupon[]>(`/admin/coupons${qs({ q: get("q"), status: get("status"), page: get("page") || 1, pageSize: 25 })}`);
  const categories = useApi<{ id: number; name: string }[]>("/admin/categories");
  const { busy } = useAction();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const edit = (coupon?: Coupon) => {
    setFormError(null);
    setDraft(
      coupon
        ? {
            id: coupon.id, code: coupon.code, description: coupon.description ?? "", discountType: coupon.discountType, discountValue: String(coupon.discountValue), minOrderValue: String(coupon.minOrderValue),
            maxDiscount: coupon.maxDiscount === null ? "" : String(coupon.maxDiscount), usageLimit: coupon.usageLimit === null ? "" : String(coupon.usageLimit), perCustomerLimit: coupon.perCustomerLimit === null ? "" : String(coupon.perCustomerLimit),
            newCustomersOnly: coupon.newCustomersOnly, appliesTo: coupon.appliesTo, applicableIds: coupon.applicableIds.join(", "), isActive: coupon.isActive, startsAt: toLocal(coupon.startsAt), endsAt: toLocal(coupon.endsAt),
          }
        : { ...empty },
    );
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const ids = draft.applicableIds.split(/[\s,]+/).filter(Boolean).map(Number);
    if (ids.some((id) => !Number.isInteger(id) || id < 1)) return setFormError("Product/category ids must be whole numbers separated by commas.");
    const nullable = (value: string) => (value.trim() === "" ? null : Number(value));
    const body = {
      code: draft.code.trim().toUpperCase(),
      description: draft.description.trim() || null,
      discountType: draft.discountType,
      discountValue: Number(draft.discountValue),
      minOrderValue: Number(draft.minOrderValue || 0),
      maxDiscount: nullable(draft.maxDiscount),
      usageLimit: nullable(draft.usageLimit),
      perCustomerLimit: nullable(draft.perCustomerLimit),
      newCustomersOnly: draft.newCustomersOnly,
      appliesTo: draft.appliesTo,
      applicableIds: draft.appliesTo === "all" ? [] : ids,
      isActive: draft.isActive,
      startsAt: draft.startsAt ? new Date(draft.startsAt).toISOString() : null,
      endsAt: draft.endsAt ? new Date(draft.endsAt).toISOString() : null,
    };
    setSaving(true);
    try {
      if (draft.id) await ecomApi.patch(`/admin/coupons/${draft.id}`, body);
      else await ecomApi.post("/admin/coupons", body);
      setDraft(null);
      reload();
    } catch (reason) {
      setFormError(messageOf(reason));
    } finally {
      setSaving(false);
    }
  };

  const describe = (coupon: Coupon) => `${coupon.discountType === "percentage" ? `${coupon.discountValue}%` : money(coupon.discountValue)} off${coupon.maxDiscount ? ` (max ${money(coupon.maxDiscount)})` : ""}${coupon.minOrderValue ? ` · min ${money(coupon.minOrderValue)}` : ""}`;
  const state = (coupon: Coupon) => (!coupon.isActive ? <Pill>Inactive</Pill> : coupon.endsAt && new Date(coupon.endsAt) < new Date() ? <Pill tone="red">Expired</Pill> : coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit ? <Pill tone="amber">Used up</Pill> : <Pill tone="green">Active</Pill>);

  return (
    <>
      <PageHeader title="Coupons" description="Validated on the server at checkout. Coupons with a description and no restrictions are suggested in the cart." actions={<Button onClick={() => edit()}><Plus className="size-4" aria-hidden /> New coupon</Button>} />
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <input type="search" placeholder="Search code" aria-label="Search coupons" className={inputClass} defaultValue={get("q")} onKeyDown={(event) => event.key === "Enter" && set({ q: (event.target as HTMLInputElement).value })} />
          <select aria-label="Status" className={`${inputClass} sm:w-40`} value={get("status")} onChange={(event) => set({ status: event.target.value })}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <LoadState loading={loading} error={error} empty={!data}>
          {data?.length === 0 ? <EmptyState title="No coupons yet" /> : (
            <Table>
              <THead><tr><Th>Code</Th><Th>Discount</Th><Th>Valid</Th><Th className="text-right">Used</Th><Th className="text-right">Discount given</Th><Th>Rules</Th><Th>Status</Th><Th /></tr></THead>
              <TBody>
                {data?.map((coupon) => (
                  <tr key={coupon.id}>
                    <Td><span className="font-mono font-semibold">{coupon.code}</span>{coupon.description && <span className="block text-xs text-slate-500">{coupon.description}</span>}</Td>
                    <Td className="text-sm">{describe(coupon)}</Td>
                    <Td className="text-xs">{coupon.startsAt ? formatDate(coupon.startsAt) : "Now"} → {coupon.endsAt ? formatDate(coupon.endsAt) : "No end"}</Td>
                    <Td className="text-right">{coupon.usedCount}{coupon.usageLimit !== null && ` / ${coupon.usageLimit}`}</Td>
                    <Td className="text-right">{money(coupon.totalDiscountGiven)}</Td>
                    <Td className="text-xs text-slate-600">{[coupon.perCustomerLimit !== null && `${coupon.perCustomerLimit}/customer`, coupon.newCustomersOnly && "First order only", coupon.appliesTo !== "all" && `${coupon.applicableIds.length} ${coupon.appliesTo}`].filter(Boolean).join(" · ") || "—"}</Td>
                    <Td>{state(coupon)}</Td>
                    <Td><Button variant="ghost" size="sm" onClick={() => edit(coupon)} aria-label={`Edit ${coupon.code}`}><Pencil className="size-4" /></Button></Td>
                  </tr>
                ))}
              </TBody>
            </Table>
          )}
          <Pager meta={meta} onPage={(page) => set({ page })} />
        </LoadState>
      </Card>

      <Modal open={draft !== null} title={draft?.id ? `Edit ${draft.code}` : "New coupon"} onClose={() => setDraft(null)} wide>
        {draft && (
          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            {formError && <div className="md:col-span-2"><Alert tone="error">{formError}</Alert></div>}
            <Field label="Code *" hint="Letters, numbers, - and _"><input className={`${inputClass} font-mono uppercase`} required pattern="[A-Za-z0-9_\-]{3,40}" value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value.toUpperCase() })} /></Field>
            <Field label="Description" hint="Shown to customers in the cart"><input className={inputClass} maxLength={255} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></Field>
            <Field label="Discount type">
              <select className={inputClass} value={draft.discountType} onChange={(event) => setDraft({ ...draft, discountType: event.target.value as Draft["discountType"] })}>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount (₹)</option>
              </select>
            </Field>
            <Field label={draft.discountType === "percentage" ? "Percent off *" : "Amount off (₹) *"}><input className={inputClass} required inputMode="decimal" value={draft.discountValue} onChange={(event) => setDraft({ ...draft, discountValue: event.target.value })} /></Field>
            <Field label="Minimum order value (₹)"><input className={inputClass} inputMode="decimal" value={draft.minOrderValue} onChange={(event) => setDraft({ ...draft, minOrderValue: event.target.value })} /></Field>
            <Field label="Maximum discount (₹)" hint="Empty = no cap"><input className={inputClass} inputMode="decimal" value={draft.maxDiscount} onChange={(event) => setDraft({ ...draft, maxDiscount: event.target.value })} /></Field>
            <Field label="Starts"><input className={inputClass} type="datetime-local" value={draft.startsAt} onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })} /></Field>
            <Field label="Expires"><input className={inputClass} type="datetime-local" value={draft.endsAt} onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })} /></Field>
            <Field label="Total uses allowed" hint="Empty = unlimited"><input className={inputClass} inputMode="numeric" value={draft.usageLimit} onChange={(event) => setDraft({ ...draft, usageLimit: event.target.value.replace(/\D/g, "") })} /></Field>
            <Field label="Uses per customer" hint="Empty = unlimited"><input className={inputClass} inputMode="numeric" value={draft.perCustomerLimit} onChange={(event) => setDraft({ ...draft, perCustomerLimit: event.target.value.replace(/\D/g, "") })} /></Field>
            <Field label="Applies to">
              <select className={inputClass} value={draft.appliesTo} onChange={(event) => setDraft({ ...draft, appliesTo: event.target.value as Draft["appliesTo"] })}>
                <option value="all">Whole cart</option>
                <option value="products">Specific products</option>
                <option value="categories">Specific categories</option>
              </select>
            </Field>
            {draft.appliesTo !== "all" && (
              <Field label={draft.appliesTo === "products" ? "Product ids" : "Category ids"} hint={draft.appliesTo === "categories" ? categories.data?.map((category) => `${category.id}=${category.name}`).join(", ") : "Product id is shown in the product URL"}>
                <input className={inputClass} placeholder="e.g. 3, 7, 12" value={draft.applicableIds} onChange={(event) => setDraft({ ...draft, applicableIds: event.target.value })} />
              </Field>
            )}
            <div className="flex flex-wrap gap-5 md:col-span-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={draft.newCustomersOnly} onChange={(event) => setDraft({ ...draft, newCustomersOnly: event.target.checked })} /> First order only</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} /> Active</label>
            </div>
            <div className="flex justify-end gap-2 md:col-span-2"><Button variant="secondary" onClick={() => setDraft(null)}>Cancel</Button><Button type="submit" loading={saving || busy}>Save coupon</Button></div>
          </form>
        )}
      </Modal>
    </>
  );
}

export default function CouponsPage() {
  return (
    <RequirePermission permission="coupons.manage">
      <Suspense>
        <CouponsContent />
      </Suspense>
    </RequirePermission>
  );
}
