"use client";

import { useState } from "react";
import { CheckCircle2, Truck } from "lucide-react";
import { Alert, Button, Card, Container, StatusPill, TextField, orderTone } from "@/components/ui";
import { api, errorMessage } from "@/services/api";
import type { OrderHistoryEntry, OrderStatus } from "@/types";
import { formatDate, PAYMENT_STATUS_LABELS } from "@/utils/format";

interface Tracking {
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  paymentStatus: string;
  placedAt: string;
  itemCount: number;
  tracking: { courier: string | null; number: string | null; url: string | null; shippedAt: string | null; deliveredAt: string | null };
  history: OrderHistoryEntry[];
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<Tracking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setResult(await api.post<Tracking>("/orders/track", { orderNumber: orderNumber.trim().toUpperCase(), email: email.trim() }));
    } catch (reason) {
      setResult(null);
      setError(errorMessage(reason) === "Order not found." ? "We could not find an order with that number and email." : errorMessage(reason));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="max-w-3xl space-y-6 py-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Track your order</h1>
        <p className="mt-1 text-slate-600">Enter your order number and the email used at checkout.</p>
      </div>
      <Card className="p-6">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <TextField label="Order number" placeholder="OL-2026-000123" required value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} maxLength={24} />
          <TextField label="Email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          <Button type="submit" loading={busy} className="h-[42px]">
            Track
          </Button>
        </form>
      </Card>
      {error && <Alert>{error}</Alert>}
      {result && (
        <Card className="space-y-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-bold">{result.orderNumber}</p>
              <p className="text-sm text-slate-500">
                Placed {formatDate(result.placedAt)} · {result.itemCount} item{result.itemCount === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex gap-2">
              <StatusPill label={result.statusLabel} tone={orderTone(result.status)} />
              <StatusPill label={PAYMENT_STATUS_LABELS[result.paymentStatus] ?? result.paymentStatus} />
            </div>
          </div>
          {(result.tracking.number || result.tracking.courier) && (
            <p className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm">
              <Truck className="size-4 text-brand-600" aria-hidden />
              {result.tracking.courier} {result.tracking.number && <>· {result.tracking.number}</>}
              {result.tracking.url && (
                <a href={result.tracking.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 hover:underline">
                  Track with courier
                </a>
              )}
            </p>
          )}
          <ol className="space-y-3 border-l-2 border-slate-200 pl-5">
            {result.history.map((entry, index) => (
              <li key={index} className="relative">
                <CheckCircle2 className="absolute -left-[30px] top-0.5 size-5 rounded-full bg-white text-leaf" aria-hidden />
                <p className="font-semibold text-slate-900">{entry.label}</p>
                <p className="text-xs text-slate-500">{formatDate(entry.at, true)}</p>
                {entry.note && <p className="text-sm text-slate-600">{entry.note}</p>}
              </li>
            ))}
          </ol>
        </Card>
      )}
    </Container>
  );
}
