"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, Lock } from "lucide-react";
import { Alert, Button, ButtonLink, Container, EmptyState, Spinner, TextArea, TextField } from "@/components/ui";
import { AddressFields, emptyAddress, validateAddress } from "@/components/checkout/AddressFields";
import { CartSummary } from "@/components/cart/CartSummary";
import { ProductImage } from "@/components/product/ProductImage";
import { orderTokens, useIdempotencyKey } from "@/hooks/useIdempotencyKey";
import { ApiError, api, errorMessage, toQuery } from "@/services/api";
import { useStore } from "@/store/StoreProvider";
import type { Address, AddressInput, CheckoutPreview } from "@/types";
import { cn, formatPrice } from "@/utils/format";

const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export default function CheckoutPage() {
  const router = useRouter();
  const { customer, refreshCart } = useStore();
  const idempotency = useIdempotencyKey();
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Address[]>([]);
  const [shippingId, setShippingId] = useState<number | "new">("new");
  const [billingId, setBillingId] = useState<number | "new">("new");
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [shipping, setShipping] = useState<AddressInput>(emptyAddress);
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState<AddressInput>(emptyAddress);
  const [gstin, setGstin] = useState("");
  const [note, setNote] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);
  const [method, setMethod] = useState<"online" | "cod">("online");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  const selectedShipping = shippingId === "new" ? shipping : saved.find((address) => address.id === shippingId);
  const pincode = selectedShipping?.pincode ?? "";

  const loadPreview = useCallback(async (code?: string) => {
    try {
      setPreview(await api.get<CheckoutPreview>(`/checkout/preview${toQuery({ pincode: code && /^[1-9][0-9]{5}$/.test(code) ? code : undefined })}`));
      setLoadError(null);
    } catch (error) {
      setLoadError(errorMessage(error));
    }
  }, []);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  useEffect(() => {
    if (/^[1-9][0-9]{5}$/.test(pincode)) void loadPreview(pincode);
  }, [pincode, loadPreview]);

  useEffect(() => {
    if (!customer) return;
    setContact((current) => ({ name: current.name || customer.name, email: current.email || customer.email, phone: current.phone || customer.mobile }));
    api
      .get<Address[]>("/account/addresses")
      .then((list) => {
        setSaved(list);
        const preferred = list.find((address) => address.isDefaultShipping) ?? list[0];
        if (preferred) setShippingId(preferred.id);
        const billingDefault = list.find((address) => address.isDefaultBilling);
        if (billingDefault) setBillingId(billingDefault.id);
      })
      .catch(() => undefined);
  }, [customer]);

  const codAllowed = useMemo(
    () => Boolean(preview?.checkout.codEnabled && (preview.checkout.codMaxOrderValue <= 0 || preview.totals.total <= preview.checkout.codMaxOrderValue)),
    [preview],
  );

  if (loadError) {
    return (
      <Container className="py-12">
        <Alert>{loadError}</Alert>
      </Container>
    );
  }
  if (!preview || customer === undefined) return <Spinner label="Preparing checkout" />;
  if (preview.items.length === 0) {
    return (
      <Container className="py-12">
        <EmptyState title="Your cart is empty" action={<ButtonLink href="/products">Browse products</ButtonLink>} />
      </Container>
    );
  }
  if (!customer && !preview.checkout.guestCheckout) {
    return (
      <Container className="py-12">
        <EmptyState title="Sign in to check out" action={<ButtonLink href="/login?next=/checkout">Sign in</ButtonLink>}>
          Please sign in or create an account to place your order.
        </EmptyState>
      </Container>
    );
  }

  const validate = () => {
    const next: Record<string, string> = {};
    if (contact.name.trim().length < 2) next.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) next.email = "Enter a valid email address.";
    if (!/^[6-9][0-9]{9}$/.test(contact.phone)) next.phone = "Enter a 10-digit mobile number.";
    if (shippingId === "new") Object.entries(validateAddress(shipping)).forEach(([key, value]) => (next[`shipping.${key}`] = value));
    if (!billingSame && billingId === "new") Object.entries(validateAddress(billing)).forEach(([key, value]) => (next[`billing.${key}`] = value));
    if (gstin && !GSTIN.test(gstin)) next.gstin = "Enter a valid 15-character GSTIN.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const placeOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) {
      setSubmitError("Please correct the highlighted fields.");
      return;
    }
    if (preview.serviceable === false) {
      setSubmitError("We do not deliver to this pincode yet.");
      return;
    }
    setPlacing(true);
    try {
      const clean = (address: AddressInput) => ({ ...address, line2: address.line2 || undefined });
      const result = await api.post<{ orderNumber: string; accessToken: string }>("/checkout/orders", {
        idempotencyKey: idempotency.get(),
        contact: { name: contact.name.trim(), email: contact.email.trim(), phone: contact.phone },
        ...(shippingId === "new" ? { shippingAddress: clean(shipping) } : { shippingAddressId: shippingId }),
        billingSameAsShipping: billingSame,
        ...(!billingSame ? (billingId === "new" ? { billingAddress: clean(billing) } : { billingAddressId: billingId }) : {}),
        billingGstin: gstin || undefined,
        paymentMethod: method,
        customerNote: note.trim() || undefined,
        saveAddress: Boolean(customer && shippingId === "new" && saveAddress),
        expectedTotal: preview.totals.total,
      });
      orderTokens.save(result.orderNumber, result.accessToken);
      idempotency.reset();
      await refreshCart();
      router.push(`/order/${result.orderNumber}${method === "online" ? "?pay=1" : ""}`);
    } catch (error) {
      if (error instanceof ApiError && error.code === "PRICE_CHANGED") {
        idempotency.reset();
        await loadPreview(pincode);
      }
      if (error instanceof ApiError && error.code === "CART_INVALID") await loadPreview(pincode);
      setSubmitError(errorMessage(error));
      setPlacing(false);
    }
  };

  const fieldErrors = (prefix: string) =>
    Object.fromEntries(Object.entries(errors).filter(([key]) => key.startsWith(`${prefix}.`)).map(([key, value]) => [key.slice(prefix.length + 1), value]));

  return (
    <Container className="py-8">
      <h1 className="mb-6 text-3xl font-bold text-slate-900">Checkout</h1>
      {!customer && (
        <Alert kind="info" className="mb-6">
          Checking out as a guest.{" "}
          <Link href="/login?next=/checkout" className="font-semibold underline">
            Sign in
          </Link>{" "}
          to use saved addresses and see this order in your account.
        </Alert>
      )}
      <form onSubmit={placeOrder} noValidate className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
            <h2 className="text-lg font-semibold">1. Contact information</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField label="Name" required autoComplete="name" value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} error={errors.name} />
              <TextField label="Email" type="email" required autoComplete="email" value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} error={errors.email} hint="Order updates are sent here" />
              <TextField label="Mobile" required inputMode="numeric" maxLength={10} autoComplete="tel-national" value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value.replace(/\D/g, "") })} error={errors.phone} />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
            <h2 className="text-lg font-semibold">2. Shipping address</h2>
            {saved.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Saved addresses">
                {saved.map((address) => (
                  <label key={address.id} className={cn("cursor-pointer rounded-xl border p-4 text-sm", shippingId === address.id ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300")}>
                    <input type="radio" name="shipping" className="sr-only" checked={shippingId === address.id} onChange={() => setShippingId(address.id)} />
                    <span className="font-semibold text-slate-900">{address.fullName}</span>
                    {address.label && <span className="ml-2 rounded bg-slate-100 px-1.5 text-xs">{address.label}</span>}
                    <span className="mt-1 block text-slate-600">
                      {address.line1}
                      {address.line2 && `, ${address.line2}`}, {address.city}, {address.state} {address.pincode}
                    </span>
                    <span className="block text-slate-500">{address.phone}</span>
                  </label>
                ))}
                <label className={cn("flex cursor-pointer items-center justify-center rounded-xl border border-dashed p-4 text-sm font-semibold", shippingId === "new" ? "border-brand-500 bg-brand-50 text-brand-800" : "border-slate-300 text-slate-600")}>
                  <input type="radio" name="shipping" className="sr-only" checked={shippingId === "new"} onChange={() => setShippingId("new")} />+ Use a new address
                </label>
              </div>
            )}
            {shippingId === "new" && (
              <>
                <AddressFields idPrefix="ship" value={shipping} onChange={setShipping} errors={fieldErrors("shipping")} />
                {customer && (
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" className="size-4 accent-brand-500" checked={saveAddress} onChange={(event) => setSaveAddress(event.target.checked)} />
                    Save this address to my account
                  </label>
                )}
              </>
            )}
            {preview.serviceable === false && <Alert>Sorry, we do not deliver to pincode {pincode} yet.</Alert>}
            {preview.serviceable && preview.checkout.estimatedDelivery && <p className="text-sm text-emerald-700">Delivery available · Estimated {preview.checkout.estimatedDelivery}</p>}
          </section>

          <section className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
            <h2 className="text-lg font-semibold">3. Billing details</h2>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="size-4 accent-brand-500" checked={billingSame} onChange={(event) => setBillingSame(event.target.checked)} />
              Billing address is the same as shipping
            </label>
            {!billingSame && (
              <>
                {saved.length > 0 && (
                  <select aria-label="Billing address" value={billingId} onChange={(event) => setBillingId(event.target.value === "new" ? "new" : Number(event.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
                    {saved.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.fullName} — {address.line1}, {address.city}
                      </option>
                    ))}
                    <option value="new">New billing address</option>
                  </select>
                )}
                {billingId === "new" && <AddressFields idPrefix="bill" value={billing} onChange={setBilling} errors={fieldErrors("billing")} />}
              </>
            )}
            <TextField label="GSTIN (for business purchases)" value={gstin} onChange={(event) => setGstin(event.target.value.toUpperCase())} maxLength={15} error={errors.gstin} hint="Optional — printed on your tax invoice" />
          </section>

          <section className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
            <h2 className="text-lg font-semibold">4. Payment method</h2>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
              <label className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-4", method === "online" ? "border-brand-500 bg-brand-50" : "border-slate-200")}>
                <input type="radio" name="method" className="mt-1 accent-brand-500" checked={method === "online"} onChange={() => setMethod("online")} />
                <span>
                  <span className="flex items-center gap-2 font-semibold">
                    <CreditCard className="size-4" aria-hidden /> Pay online
                  </span>
                  <span className="text-sm text-slate-600">UPI, cards, net banking and wallets</span>
                </span>
              </label>
              {codAllowed && (
                <label className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-4", method === "cod" ? "border-brand-500 bg-brand-50" : "border-slate-200")}>
                  <input type="radio" name="method" className="mt-1 accent-brand-500" checked={method === "cod"} onChange={() => setMethod("cod")} />
                  <span>
                    <span className="flex items-center gap-2 font-semibold">
                      <Banknote className="size-4" aria-hidden /> Cash on delivery
                    </span>
                    <span className="text-sm text-slate-600">Pay when your order arrives</span>
                  </span>
                </label>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="note" className="block text-sm font-medium text-slate-700">
                Order note (optional)
              </label>
              <TextArea id="note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Delivery instructions, preferred time…" />
            </div>
          </section>
        </div>

        <div className="space-y-4 lg:sticky lg:top-40 lg:self-start">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <h2 className="mb-3 font-semibold">Items ({preview.itemCount})</h2>
            <ul className="max-h-72 space-y-3 overflow-y-auto">
              {preview.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 text-sm">
                  <ProductImage src={item.image} alt={item.name} sizes="48px" className="size-12 shrink-0 rounded-lg" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 font-medium">{item.name}</span>
                    <span className="text-slate-500">Qty {item.quantity}</span>
                    {item.issueMessage && <span className="block text-red-600">{item.issueMessage}</span>}
                  </span>
                  <span className="font-semibold">{formatPrice(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <Link href="/cart" className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline">
              Edit cart
            </Link>
          </div>
          <CartSummary totals={preview.totals}>
            {submitError && <Alert>{submitError}</Alert>}
            <Button type="submit" size="lg" className="w-full" loading={placing} disabled={!preview.canCheckout || preview.serviceable === false}>
              <Lock className="size-4" aria-hidden />
              {method === "cod" ? "Place order" : `Pay ${formatPrice(preview.totals.total)}`}
            </Button>
            <p className="text-center text-xs text-slate-500">
              By placing this order you agree to our{" "}
              <Link href="/policies/terms-and-conditions" className="underline">
                terms
              </Link>
              . Stock is held for {preview.checkout.reservationMinutes} minutes while you pay.
            </p>
          </CartSummary>
        </div>
      </form>
    </Container>
  );
}
