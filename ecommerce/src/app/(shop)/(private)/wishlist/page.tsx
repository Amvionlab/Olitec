"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Alert, ButtonLink, Container, EmptyState, Spinner } from "@/components/ui";
import { ProductGrid } from "@/components/product/ProductCard";
import { api, errorMessage } from "@/services/api";
import { useStore } from "@/store/StoreProvider";
import type { ProductSummary } from "@/types";

export default function WishlistPage() {
  const { customer, wishlistIds } = useStore();
  const [items, setItems] = useState<ProductSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customer) return;
    api.get<ProductSummary[]>("/account/wishlist").then(setItems).catch((reason) => setError(errorMessage(reason)));
  }, [customer]);

  if (customer === undefined) return <Spinner />;
  if (customer === null) {
    return (
      <Container className="py-12">
        <EmptyState icon={<Heart className="size-10" />} title="Sign in to see your wishlist" action={<ButtonLink href="/login?next=/wishlist">Sign in</ButtonLink>} />
      </Container>
    );
  }

  // Removing an item on this page updates the shared id set; hide it immediately.
  const visible = items?.filter((item) => wishlistIds.has(item.id));

  return (
    <Container className="space-y-6 py-8">
      <h1 className="text-3xl font-bold text-slate-900">My wishlist</h1>
      {error ? (
        <Alert>{error}</Alert>
      ) : !visible ? (
        <Spinner />
      ) : visible.length === 0 ? (
        <EmptyState icon={<Heart className="size-10" />} title="Your wishlist is empty" action={<ButtonLink href="/products">Browse products</ButtonLink>}>
          Tap the heart on any product to save it here.
        </EmptyState>
      ) : (
        <ProductGrid products={visible} />
      )}
    </Container>
  );
}
