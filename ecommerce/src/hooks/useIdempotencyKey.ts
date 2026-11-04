"use client";

import { useCallback, useRef } from "react";

/**
 * One key per checkout attempt. Re-submitting (double click, retry after a network error) reuses it, so the
 * backend returns the same order instead of creating a duplicate. Call `reset()` once an order is placed.
 */
export function useIdempotencyKey() {
  const key = useRef<string | null>(null);
  const get = useCallback(() => (key.current ??= crypto.randomUUID()), []);
  const reset = useCallback(() => {
    key.current = null;
  }, []);
  return { get, reset };
}

/** Guest order access tokens, kept for this browser session so the confirmation/payment page can load the order. */
export const orderTokens = {
  save(orderNumber: string, token: string) {
    try {
      sessionStorage.setItem(`order-token:${orderNumber}`, token);
    } catch {
      // ignore
    }
  },
  get(orderNumber: string): string | undefined {
    try {
      return sessionStorage.getItem(`order-token:${orderNumber}`) ?? undefined;
    } catch {
      return undefined;
    }
  },
};
