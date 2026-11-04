"use client";

import { useEffect, useState } from "react";
import { MapPin, Pencil, Trash2 } from "lucide-react";
import { Alert, Button, Card, EmptyState, Spinner, TextField } from "@/components/ui";
import { AddressFields, emptyAddress, validateAddress } from "@/components/checkout/AddressFields";
import { api, errorMessage } from "@/services/api";
import { useStore } from "@/store/StoreProvider";
import type { Address, AddressInput } from "@/types";

type Draft = AddressInput & { label: string; isDefaultShipping: boolean; isDefaultBilling: boolean };

export default function AddressesPage() {
  const { notify } = useStore();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>({ ...emptyAddress, label: "", isDefaultShipping: false, isDefaultBilling: false });
  const [errors, setErrors] = useState<Partial<Record<keyof AddressInput, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<Address[]>("/account/addresses").then(setAddresses).catch((reason) => setError(errorMessage(reason)));
  }, []);

  const startEdit = (address?: Address) => {
    setErrors({});
    setEditing(address?.id ?? "new");
    setDraft(
      address
        ? { fullName: address.fullName, phone: address.phone, line1: address.line1, line2: address.line2 ?? "", city: address.city, state: address.state, pincode: address.pincode, label: address.label ?? "", isDefaultShipping: address.isDefaultShipping, isDefaultBilling: address.isDefaultBilling }
        : { ...emptyAddress, label: "", isDefaultShipping: !addresses?.length, isDefaultBilling: !addresses?.length },
    );
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validateAddress(draft);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const body = { ...draft, line2: draft.line2 || undefined, label: draft.label || undefined };
      setAddresses(editing === "new" ? await api.post<Address[]>("/account/addresses", body) : await api.patch<Address[]>(`/account/addresses/${editing}`, body));
      setEditing(null);
      notify("Address saved");
    } catch (reason) {
      notify(errorMessage(reason), "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (address: Address) => {
    if (!window.confirm(`Delete the address for ${address.fullName}?`)) return;
    try {
      setAddresses(await api.delete<Address[]>(`/account/addresses/${address.id}`));
      notify("Address deleted");
    } catch (reason) {
      notify(errorMessage(reason), "error");
    }
  };

  if (error) return <Alert>{error}</Alert>;
  if (!addresses) return <Spinner label="Loading addresses" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Saved addresses</h1>
        {editing === null && <Button onClick={() => startEdit()}>Add address</Button>}
      </div>

      {editing !== null && (
        <Card className="p-6">
          <form onSubmit={save} className="space-y-4" noValidate>
            <h2 className="text-lg font-semibold">{editing === "new" ? "New address" : "Edit address"}</h2>
            <TextField label="Label" value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} maxLength={40} hint="e.g. Home, Office (optional)" />
            <AddressFields idPrefix="addr" value={draft} onChange={(value) => setDraft({ ...draft, ...value })} errors={errors} />
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="size-4 accent-brand-500" checked={draft.isDefaultShipping} onChange={(event) => setDraft({ ...draft, isDefaultShipping: event.target.checked })} />
                Default shipping address
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="size-4 accent-brand-500" checked={draft.isDefaultBilling} onChange={(event) => setDraft({ ...draft, isDefaultBilling: event.target.checked })} />
                Default billing address
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={busy}>
                Save address
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {addresses.length === 0 && editing === null ? (
        <EmptyState icon={<MapPin className="size-10" />} title="No saved addresses">
          Save an address to check out faster.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className="space-y-2 p-5 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-900">{address.fullName}</p>
                {address.label && <span className="rounded bg-slate-100 px-1.5 text-xs">{address.label}</span>}
                {address.isDefaultShipping && <span className="rounded bg-brand-50 px-1.5 text-xs font-semibold text-brand-800">Default shipping</span>}
                {address.isDefaultBilling && <span className="rounded bg-sky-50 px-1.5 text-xs font-semibold text-sky-800">Default billing</span>}
              </div>
              <p className="text-slate-600">
                {address.line1}
                {address.line2 && `, ${address.line2}`}
                <br />
                {address.city}, {address.state} {address.pincode}
                <br />
                {address.phone}
              </p>
              <div className="flex gap-3 pt-1">
                <button onClick={() => startEdit(address)} className="flex items-center gap-1 font-medium text-brand-700 hover:underline">
                  <Pencil className="size-3.5" aria-hidden /> Edit
                </button>
                <button onClick={() => void remove(address)} className="flex items-center gap-1 font-medium text-red-600 hover:underline">
                  <Trash2 className="size-3.5" aria-hidden /> Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
