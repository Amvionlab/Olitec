import type { SupportStatus, WarrantyStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

const statusStyles: Record<WarrantyStatus | SupportStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Expired: "bg-slate-100 text-slate-600 ring-slate-500/20",
  Rejected: "bg-red-50 text-red-700 ring-red-600/20",
  Open: "bg-brand-50 text-brand-700 ring-brand-600/20",
  "In Progress": "bg-amber-50 text-amber-700 ring-amber-600/20",
  Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

export function StatusBadge({ status, className }: { status: WarrantyStatus | SupportStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        statusStyles[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {status}
    </span>
  );
}
