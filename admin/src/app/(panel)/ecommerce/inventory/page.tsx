"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { TBody, THead, Table, Td, Th } from "@/components/ui/Table";
import { useEcom } from "@/components/ecommerce/EcomSession";
import { Field, LoadState, Modal, Pager, Pill, RequirePermission, StatCard, inputClass, useAction, useApi, useUrlFilters } from "@/components/ecommerce/kit";
import { formatDateTime } from "@/lib/format";
import { ecomApi, label, qs } from "@/services/ecommerce/api";

interface StockRow {
  id: number;
  sku: string;
  name: string;
  status: string;
  category: string;
  stockQty: number;
  reservedQty: number;
  available: number;
  lowStockThreshold: number;
  lastMovementAt: string | null;
}

interface Movement {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  type: string;
  quantity: number;
  stockAfter: number;
  reservedAfter: number;
  reference: string | null;
  note: string | null;
  adminName: string | null;
  createdAt: string;
}

interface Reconciliation {
  checked: number;
  mismatches: { productId: number; sku: string; name: string; recordedReserved: number; actualHeld: number }[];
  applied: boolean;
}

function StockTable() {
  const { can } = useEcom();
  const { get, set } = useUrlFilters();
  const { run, busy } = useAction();
  const { data, meta, error, loading, reload } = useApi<{ items: StockRow[]; summary: { lowStock: number; outOfStock: number; unitsOnHand: number; unitsReserved: number } }>(
    `/admin/inventory${qs({ q: get("q"), stock: get("stock"), page: get("page") || 1, pageSize: 25 })}`,
  );
  const [adjusting, setAdjusting] = useState<StockRow | null>(null);
  const [form, setForm] = useState({ type: "stock_in" as "stock_in" | "stock_out" | "adjustment", quantity: "", note: "", lowStockThreshold: "" });

  const open = (row: StockRow) => {
    setAdjusting(row);
    setForm({ type: "stock_in", quantity: "", note: "", lowStockThreshold: String(row.lowStockThreshold) });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!adjusting) return;
    const quantity = Number.parseInt(form.quantity, 10);
    const ok = await run(
      () =>
        ecomApi.post(`/admin/inventory/${adjusting.id}/adjust`, {
          type: form.type,
          quantity,
          ...(form.note ? { note: form.note } : {}),
          ...(form.lowStockThreshold !== "" ? { lowStockThreshold: Number(form.lowStockThreshold) } : {}),
        }),
      "Stock updated",
    );
    if (ok !== undefined) {
      setAdjusting(null);
      reload();
    }
  };

  const preview = adjusting && form.quantity !== "" ? (form.type === "stock_in" ? adjusting.stockQty + Number(form.quantity) : form.type === "stock_out" ? adjusting.stockQty - Number(form.quantity) : Number(form.quantity)) : null;

  return (
    <>
      {data && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Units on hand" value={data.summary.unitsOnHand} />
          <StatCard label="Held by checkouts" value={data.summary.unitsReserved} hint="Released automatically if unpaid" />
          <StatCard label="Low stock" value={data.summary.lowStock} tone={data.summary.lowStock ? "warn" : undefined} />
          <StatCard label="Out of stock" value={data.summary.outOfStock} tone={data.summary.outOfStock ? "bad" : undefined} />
        </div>
      )}
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <form className="relative flex-1" onSubmit={(event) => { event.preventDefault(); set({ q: new FormData(event.currentTarget).get("q") as string }); }}>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input name="q" type="search" defaultValue={get("q")} placeholder="Search name or SKU" aria-label="Search inventory" className={`${inputClass} pl-9`} />
          </form>
          <select aria-label="Stock level" className={`${inputClass} sm:w-44`} value={get("stock")} onChange={(event) => set({ stock: event.target.value })}>
            <option value="">All stock levels</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
            <option value="in">Healthy</option>
          </select>
        </div>
        <LoadState loading={loading} error={error} empty={!data}>
          {data?.items.length === 0 ? (
            <EmptyState title="No products match" />
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Product</Th>
                  <Th className="text-right">On hand</Th>
                  <Th className="text-right">Reserved</Th>
                  <Th className="text-right">Available</Th>
                  <Th className="text-right">Alert at</Th>
                  <Th>Last movement</Th>
                  <Th />
                </tr>
              </THead>
              <TBody>
                {data?.items.map((row) => (
                  <tr key={row.id}>
                    <Td>
                      <Link href={`/ecommerce/products/${row.id}`} className="font-medium text-slate-900 hover:text-brand-700">{row.name}</Link>
                      <span className="block text-xs text-slate-500">{row.sku} · {row.category}</span>
                    </Td>
                    <Td className="text-right">{row.stockQty}</Td>
                    <Td className="text-right text-slate-500">{row.reservedQty}</Td>
                    <Td className="text-right">
                      {row.available <= 0 ? <Pill tone="red">Out · {row.available}</Pill> : row.available <= row.lowStockThreshold ? <Pill tone="amber">Low · {row.available}</Pill> : row.available}
                    </Td>
                    <Td className="text-right text-slate-500">{row.lowStockThreshold}</Td>
                    <Td className="text-xs text-slate-500">{row.lastMovementAt ? formatDateTime(row.lastMovementAt) : "—"}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => set({ tab: "movements", productId: row.id })}>History</Button>
                        {can("inventory.manage") && <Button variant="secondary" size="sm" onClick={() => open(row)}>Adjust</Button>}
                      </div>
                    </Td>
                  </tr>
                ))}
              </TBody>
            </Table>
          )}
          <Pager meta={meta} onPage={(page) => set({ page })} />
        </LoadState>
      </Card>

      <Modal open={adjusting !== null} title={`Adjust stock — ${adjusting?.name ?? ""}`} onClose={() => setAdjusting(null)}>
        {adjusting && (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-slate-600">
              On hand <strong>{adjusting.stockQty}</strong> · reserved by checkouts <strong>{adjusting.reservedQty}</strong>
            </p>
            <Field label="Movement">
              <select className={inputClass} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as typeof form.type })}>
                <option value="stock_in">Stock in (received)</option>
                <option value="stock_out">Stock out (damaged, lost, used)</option>
                <option value="adjustment">Set exact count (physical stock-take)</option>
              </select>
            </Field>
            <Field label={form.type === "adjustment" ? "Counted quantity" : "Quantity"}>
              <input className={inputClass} inputMode="numeric" required value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value.replace(/\D/g, "") })} />
            </Field>
            {preview !== null && (
              <p className={preview < adjusting.reservedQty ? "text-sm text-red-600" : "text-sm text-slate-600"}>
                New on-hand: <strong>{preview}</strong>
                {preview < adjusting.reservedQty && ` — cannot be below the ${adjusting.reservedQty} units held by checkouts.`}
              </p>
            )}
            <Field label="Low-stock alert threshold"><input className={inputClass} inputMode="numeric" value={form.lowStockThreshold} onChange={(event) => setForm({ ...form, lowStockThreshold: event.target.value.replace(/\D/g, "") })} /></Field>
            <Field label="Note" hint="Supplier invoice, reason, stock-take reference…"><input className={inputClass} maxLength={500} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></Field>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAdjusting(null)}>Cancel</Button>
              <Button type="submit" loading={busy} disabled={form.quantity === "" || (preview !== null && preview < adjusting.reservedQty)}>Save movement</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

function Movements() {
  const { get, set } = useUrlFilters();
  const { data, meta, error, loading } = useApi<Movement[]>(`/admin/inventory/movements${qs({ productId: get("productId"), type: get("type"), from: get("from"), to: get("to"), page: get("page") || 1, pageSize: 30 })}`);
  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-end">
        <select aria-label="Movement type" className={`${inputClass} sm:w-48`} value={get("type")} onChange={(event) => set({ type: event.target.value })}>
          <option value="">All movement types</option>
          {["stock_in", "stock_out", "adjustment", "reservation", "release", "sale", "return"].map((type) => <option key={type} value={type}>{label(type)}</option>)}
        </select>
        <input type="date" aria-label="From" className={`${inputClass} sm:w-44`} value={get("from")} onChange={(event) => set({ from: event.target.value })} />
        <input type="date" aria-label="To" className={`${inputClass} sm:w-44`} value={get("to")} onChange={(event) => set({ to: event.target.value })} />
        {get("productId") && <Button variant="ghost" onClick={() => set({ productId: null })}>Clear product filter</Button>}
      </div>
      <LoadState loading={loading} error={error} empty={!data}>
        {data?.length === 0 ? (
          <EmptyState title="No movements" />
        ) : (
          <Table>
            <THead>
              <tr><Th>When</Th><Th>Product</Th><Th>Type</Th><Th className="text-right">Change</Th><Th className="text-right">On hand after</Th><Th className="text-right">Reserved after</Th><Th>Reference</Th><Th>By / note</Th></tr>
            </THead>
            <TBody>
              {data?.map((row) => (
                <tr key={row.id}>
                  <Td className="whitespace-nowrap text-xs">{formatDateTime(row.createdAt)}</Td>
                  <Td><span className="font-medium">{row.productName}</span><span className="block text-xs text-slate-500">{row.sku}</span></Td>
                  <Td><Pill tone={row.quantity > 0 ? "green" : row.quantity < 0 ? "red" : "slate"}>{label(row.type)}</Pill></Td>
                  <Td className="text-right font-medium">{row.quantity > 0 ? `+${row.quantity}` : row.quantity}</Td>
                  <Td className="text-right">{row.stockAfter}</Td>
                  <Td className="text-right text-slate-500">{row.reservedAfter}</Td>
                  <Td className="text-xs">{row.reference ?? "—"}</Td>
                  <Td className="text-xs text-slate-600">{[row.adminName, row.note].filter(Boolean).join(" · ") || "System"}</Td>
                </tr>
              ))}
            </TBody>
          </Table>
        )}
        <Pager meta={meta} onPage={(page) => set({ page })} />
      </LoadState>
    </Card>
  );
}

function Reconcile() {
  const { can } = useEcom();
  const { run, busy } = useAction();
  const [result, setResult] = useState<Reconciliation | null>(null);
  const check = async (apply: boolean) => {
    const data = await run(() => ecomApi.post<Reconciliation>("/admin/inventory/reconcile", { apply }), apply ? "Reservations corrected" : undefined);
    if (data) setResult(data);
  };
  return (
    <Card className="space-y-4 p-5">
      <p className="text-sm text-slate-600">Compares each product&apos;s reserved quantity with the units actually held by unpaid orders. Use it after an outage or a manual database change.</p>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => void check(false)} loading={busy}>Run check</Button>
        {can("inventory.manage") && result && result.mismatches.length > 0 && <Button onClick={() => void check(true)} loading={busy}>Fix {result.mismatches.length} mismatch(es)</Button>}
      </div>
      {result &&
        (result.mismatches.length === 0 ? (
          <Alert tone="success">All {result.checked} products are consistent.</Alert>
        ) : (
          <Table>
            <THead><tr><Th>Product</Th><Th className="text-right">Recorded reserved</Th><Th className="text-right">Held by orders</Th></tr></THead>
            <TBody>
              {result.mismatches.map((row) => (
                <tr key={row.productId}><Td>{row.name} <span className="text-xs text-slate-500">{row.sku}</span></Td><Td className="text-right">{row.recordedReserved}</Td><Td className="text-right">{row.actualHeld}</Td></tr>
              ))}
            </TBody>
          </Table>
        ))}
    </Card>
  );
}

function InventoryContent() {
  const { get, set } = useUrlFilters();
  const tab = get("tab") || "stock";
  return (
    <>
      <PageHeader title="Inventory" description="Every stock change is recorded. Checkouts hold stock until paid; unpaid holds are released automatically." />
      <div className="mb-4 flex gap-1 border-b border-slate-200" role="tablist">
        {[["stock", "Stock levels"], ["movements", "Movement history"], ["reconcile", "Reconciliation"]].map(([key, title]) => (
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => set({ tab: key === "stock" ? null : key, productId: null, type: null })} className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === key ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            {title}
          </button>
        ))}
      </div>
      {tab === "stock" && <StockTable />}
      {tab === "movements" && <Movements />}
      {tab === "reconcile" && <Reconcile />}
    </>
  );
}

export default function InventoryPage() {
  return (
    <RequirePermission permission="inventory.view">
      <Suspense>
        <InventoryContent />
      </Suspense>
    </RequirePermission>
  );
}
