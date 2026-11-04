"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Container, Spinner } from "@/components/ui";
import { OrderView } from "@/components/order/OrderView";
import { orderTokens } from "@/hooks/useIdempotencyKey";

function OrderContent({ orderNumber }: { orderNumber: string }) {
  const search = useSearchParams();
  const [token, setToken] = useState<string | undefined | null>(null);
  useEffect(() => setToken(orderTokens.get(orderNumber)), [orderNumber]);
  return token === null ? <Spinner label="Loading order" /> : <OrderView orderNumber={orderNumber} token={token} autoPay={search.get("pay") === "1"} />;
}

/** Order confirmation / payment page reached right after checkout (works for guests through the session token). */
export default function OrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = use(params);
  return (
    <Container className="py-8">
      <Suspense fallback={<Spinner label="Loading order" />}>
        <OrderContent orderNumber={orderNumber} />
      </Suspense>
    </Container>
  );
}
