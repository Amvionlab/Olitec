"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { api, errorMessage, toQuery } from "@/services/api";

/** Pincode serviceability check (rules configured in Admin → Settings → Shipping). */
export function DeliveryCheck() {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const check = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      setResult({ ok: false, text: "Enter a valid 6-digit pincode." });
      return;
    }
    setBusy(true);
    try {
      const data = await api.get<{ serviceable: boolean; estimatedDelivery: string | null }>(`/cart/delivery-check${toQuery({ pincode })}`);
      setResult(
        data.serviceable
          ? { ok: true, text: data.estimatedDelivery ? `Delivery available. Estimated: ${data.estimatedDelivery}.` : "Delivery available to this pincode." }
          : { ok: false, text: "Sorry, we do not deliver to this pincode yet." },
      );
    } catch (error) {
      setResult({ ok: false, text: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={check} className="space-y-2">
      <label htmlFor="pincode-check" className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
        <MapPin className="size-4" aria-hidden /> Check delivery
      </label>
      <div className="flex gap-2">
        <input
          id="pincode-check"
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          onChange={(event) => setPincode(event.target.value.replace(/\D/g, ""))}
          placeholder="Enter pincode"
          className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="submit" disabled={busy} className="rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">
          Check
        </button>
      </div>
      {result && (
        <p className={result.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"} role="status">
          {result.text}
        </p>
      )}
    </form>
  );
}
