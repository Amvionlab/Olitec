"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui";
import { api, errorMessage } from "@/services/api";
import type { PaymentSession } from "@/types";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, handler: (response: { error?: { code?: string; description?: string } }) => void) => void };
  }
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the payment window. Check your connection and try again."));
    document.body.appendChild(script);
  });
}

/**
 * Starts payment for an order. The amount comes from the backend's gateway order — never from this page.
 * After Razorpay returns, the signed response is sent to the backend for verification; the webhook confirms it too.
 */
export function PayButton({ orderNumber, token, onDone, autoStart }: { orderNumber: string; token?: string; onDone: (message: { kind: "success" | "error" | "info"; text: string }) => void; autoStart?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [mock, setMock] = useState<PaymentSession | null>(null);
  const started = useRef(false);

  const start = async () => {
    setBusy(true);
    try {
      const session = await api.post<PaymentSession>("/payments/initiate", { orderNumber, token });
      if (session.provider === "mock") {
        setMock(session);
        setBusy(false);
        return;
      }
      await loadRazorpay();
      const checkout = new window.Razorpay!({
        key: session.keyId,
        amount: session.amount,
        currency: session.currency,
        order_id: session.providerOrderId,
        name: "OLITEC Shop",
        description: `Order ${orderNumber}`,
        prefill: session.prefill,
        theme: { color: "#f99f1e" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await api.post("/payments/verify", {
              orderNumber,
              token,
              providerOrderId: response.razorpay_order_id,
              providerPaymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            onDone({ kind: "success", text: "Payment received. Your order is confirmed." });
          } catch (error) {
            onDone({ kind: "error", text: errorMessage(error) });
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            onDone({ kind: "info", text: "Payment was not completed. You can try again — your items are held for a limited time." });
          },
        },
      });
      checkout.on("payment.failed", (response) => {
        void api
          .post("/payments/failure", { orderNumber, token, providerOrderId: session.providerOrderId, code: response.error?.code, description: response.error?.description })
          .catch(() => undefined);
      });
      checkout.open();
    } catch (error) {
      setBusy(false);
      onDone({ kind: "error", text: errorMessage(error) });
    }
  };

  // Open the payment window once, straight after checkout (ref guard survives React Strict Mode's double effect).
  useEffect(() => {
    if (!autoStart || started.current) return;
    started.current = true;
    void start();
  }, [autoStart]);

  const completeMock = async (outcome: "success" | "failure") => {
    if (!mock) return;
    setBusy(true);
    try {
      await api.post("/payments/mock/complete", { orderNumber, token, providerOrderId: mock.providerOrderId, outcome });
      onDone(outcome === "success" ? { kind: "success", text: "Payment received. Your order is confirmed." } : { kind: "error", text: "Payment failed. You can try again." });
    } catch (error) {
      onDone({ kind: "error", text: errorMessage(error) });
    } finally {
      setMock(null);
      setBusy(false);
    }
  };

  return (
    <>
      <Button size="lg" onClick={() => void start()} loading={busy}>
        <CreditCard className="size-5" aria-hidden /> Pay now
      </Button>
      {mock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" role="dialog" aria-modal="true" aria-label="Test payment">
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6">
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Development mode — no real payment is taken.</p>
            <h2 className="text-lg font-bold">Test payment</h2>
            <p className="text-sm text-slate-600">
              Amount: ₹{(mock.amount / 100).toLocaleString("en-IN")} for order {orderNumber}
            </p>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => void completeMock("success")} loading={busy}>
                Simulate success
              </Button>
              <Button className="flex-1" variant="secondary" onClick={() => void completeMock("failure")} disabled={busy}>
                Simulate failure
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
