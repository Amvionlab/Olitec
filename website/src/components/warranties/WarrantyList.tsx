import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { WarrantyWithProduct } from "@/services/warranties";
import { formatDate } from "@/lib/format";
import { ProductImage } from "@/components/products/ProductImage";
import { StatusBadge } from "@/components/ui/StatusBadge";

function coverageText(warranty: WarrantyWithProduct) {
  switch (warranty.status) {
    case "Active":
      return `Valid until ${formatDate(warranty.endDate)}`;
    case "Expired":
      return `Expired on ${formatDate(warranty.endDate)}`;
    case "Pending":
      return "Awaiting verification";
    case "Rejected":
      return "Registration rejected — see details";
  }
}

export function WarrantyList({ warranties }: { warranties: WarrantyWithProduct[] }) {
  return (
    <ul className="divide-y divide-slate-100">
      {warranties.map((warranty) => (
        <li key={warranty.id}>
          <Link href={`/warranties/${warranty.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50">
            <ProductImage category={warranty.product.category} name={warranty.product.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-900">{warranty.product.name}</p>
              <p className="truncate text-sm text-slate-500">
                {warranty.warrantyNumber} · S/N {warranty.serialNumber}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 sm:hidden">{coverageText(warranty)}</p>
            </div>
            <p className="hidden w-48 text-right text-sm text-slate-500 sm:block">{coverageText(warranty)}</p>
            <StatusBadge status={warranty.status} />
            <ChevronRight className="size-4 shrink-0 text-slate-300" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
