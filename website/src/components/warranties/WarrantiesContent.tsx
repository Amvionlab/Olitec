"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { WarrantyList } from "./WarrantyList";
import { mockWarranties } from "@/mock/data";
import { getProductById } from "@/services/products";
import type { WarrantyStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

const statuses: WarrantyStatus[] = ["Active", "Pending", "Expired", "Rejected"];

export function WarrantiesContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const status = statuses.find((s) => s === statusParam);

  const all = mockWarranties.map((w) => {
    const product = getProductById(w.productId)!;
    return { ...w, product };
  });

  const filtered = all.filter((w) => !status || w.status === status);
  const counts = Object.fromEntries(statuses.map((s) => [s, all.filter((w) => w.status === s).length]));
  const tabs = [{ label: "All", value: undefined, count: all.length }, ...statuses.map((s) => ({ label: s, value: s, count: counts[s] }))];

  return (
    <Card>
      <nav className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 pt-3" aria-label="Filter by status">
        {tabs.map((tab) => {
          const active = tab.value === status;
          return (
            <Link
              key={tab.label}
              href={tab.value ? `/warranties?status=${tab.value}` : "/warranties"}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 border-b-2 px-3 pb-3 text-sm font-medium transition-colors",
                active ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800",
              )}
            >
              {tab.label}
              <span className={cn("rounded-full px-2 text-xs", active ? "bg-brand-50" : "bg-slate-100")}>{tab.count}</span>
            </Link>
          );
        })}
      </nav>

      {filtered.length > 0 ? (
        <WarrantyList warranties={filtered} />
      ) : (
        <EmptyState
          title={status ? `No ${status.toLowerCase()} warranties` : "No registered products yet"}
          description="Register a product with its serial number and invoice to activate warranty cover."
          action={<ButtonLink href="/warranties/register">Register a product</ButtonLink>}
        />
      )}
    </Card>
  );
}
