"use client";

/**
 * Client-side store state: signed-in customer, cart and wishlist ids, plus toast notifications.
 * The server is the source of truth — every action calls the API and replaces local state with its response.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, errorMessage } from "@/services/api";
import type { Cart, Customer } from "@/types";

type Toast = { id: number; kind: "success" | "error" | "info"; message: string };

interface StoreContext {
  customer: Customer | null | undefined;
  cart: Cart | null;
  wishlistIds: Set<number>;
  setCustomer: (customer: Customer | null) => void;
  refreshCart: () => Promise<void>;
  setCart: (cart: Cart) => void;
  addToCart: (productId: number, quantity: number, options?: { silent?: boolean }) => Promise<boolean>;
  toggleWishlist: (productId: number) => Promise<void>;
  signOut: () => Promise<void>;
  notify: (message: string, kind?: Toast["kind"]) => void;
}

const Context = createContext<StoreContext | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null | undefined>(undefined);
  const [cart, setCart] = useState<Cart | null>(null);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const notify = useCallback((message: string, kind: Toast["kind"] = "success") => {
    const id = nextId.current++;
    setToasts((list) => [...list, { id, kind, message }]);
    setTimeout(() => setToasts((list) => list.filter((toast) => toast.id !== id)), 4500);
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      setCart(await api.get<Cart>("/cart"));
    } catch {
      setCart(null);
    }
  }, []);

  const loadWishlist = useCallback(async () => {
    try {
      setWishlistIds(new Set(await api.get<number[]>("/account/wishlist/ids")));
    } catch {
      setWishlistIds(new Set());
    }
  }, []);

  useEffect(() => {
    api
      .get<Customer | null>("/auth/me")
      .then(setCustomer)
      .catch(() => setCustomer(null));
    void refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    if (customer) void loadWishlist();
    else setWishlistIds(new Set());
  }, [customer, loadWishlist]);

  const addToCart = useCallback(
    async (productId: number, quantity: number, options: { silent?: boolean } = {}) => {
      try {
        setCart(await api.post<Cart>("/cart/items", { productId, quantity }));
        if (!options.silent) notify("Added to cart");
        return true;
      } catch (error) {
        notify(errorMessage(error), "error");
        return false;
      }
    },
    [notify],
  );

  const toggleWishlist = useCallback(
    async (productId: number) => {
      if (!customer) {
        notify("Sign in to save items to your wishlist", "info");
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      const saved = wishlistIds.has(productId);
      try {
        const ids = saved ? await api.delete<number[]>(`/account/wishlist/${productId}`) : await api.post<number[]>(`/account/wishlist/${productId}`);
        setWishlistIds(new Set(ids));
        notify(saved ? "Removed from wishlist" : "Saved to wishlist");
      } catch (error) {
        notify(errorMessage(error), "error");
      }
    },
    [customer, notify, router, wishlistIds],
  );

  const signOut = useCallback(async () => {
    await api.post("/auth/logout").catch(() => undefined);
    setCustomer(null);
    await refreshCart();
    router.push("/");
    router.refresh();
  }, [refreshCart, router]);

  const value = useMemo<StoreContext>(
    () => ({ customer, cart, wishlistIds, setCustomer, refreshCart, setCart, addToCart, toggleWishlist, signOut, notify }),
    [customer, cart, wishlistIds, refreshCart, addToCart, toggleWishlist, signOut, notify],
  );

  return (
    <Context.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite" role="status">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-lg ring-1 ${
              toast.kind === "error" ? "bg-red-600 text-white ring-red-700" : toast.kind === "info" ? "bg-slate-900 text-white ring-slate-800" : "bg-forest text-white ring-forest"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </Context.Provider>
  );
}

export function useStore(): StoreContext {
  const value = useContext(Context);
  if (!value) throw new Error("useStore must be used inside <StoreProvider>");
  return value;
}
