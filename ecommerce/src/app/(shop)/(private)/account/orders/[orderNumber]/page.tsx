"use client";

import { use } from "react";
import Link from "next/link";
import { OrderView } from "@/components/order/OrderView";

export default function AccountOrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = use(params);
  return (
    <div className="space-y-4">
      <Link href="/account/orders" className="text-sm font-medium text-brand-700 hover:underline">
        ← All orders
      </Link>
      <OrderView orderNumber={orderNumber} />
    </div>
  );
}
