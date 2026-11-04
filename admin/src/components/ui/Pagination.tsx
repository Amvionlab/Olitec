import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  /** Builds the URL for a given page, preserving the current filters. */
  hrefForPage: (page: number) => string;
}

function pageWindow(page: number, pageCount: number): number[] {
  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  return Array.from({ length: Math.min(5, pageCount) }, (_, i) => start + i);
}

export function Pagination({ page, pageCount, total, pageSize, hrefForPage }: PaginationProps) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const navClass = "flex size-8 items-center justify-center rounded-lg border text-sm";

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{from}</span>–<span className="font-medium text-slate-700">{to}</span> of{" "}
        <span className="font-medium text-slate-700">{total}</span>
      </p>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        {page > 1 ? (
          <Link href={hrefForPage(page - 1)} className={cn(navClass, "border-slate-200 bg-white hover:bg-slate-50")} aria-label="Previous page">
            <ChevronLeft className="size-4" />
          </Link>
        ) : (
          <span className={cn(navClass, "border-slate-100 text-slate-300")} aria-hidden>
            <ChevronLeft className="size-4" />
          </span>
        )}
        {pageWindow(page, pageCount).map((n) => (
          <Link
            key={n}
            href={hrefForPage(n)}
            aria-current={n === page ? "page" : undefined}
            className={cn(
              navClass,
              n === page ? "border-brand-600 bg-brand-600 font-medium text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            )}
          >
            {n}
          </Link>
        ))}
        {page < pageCount ? (
          <Link href={hrefForPage(page + 1)} className={cn(navClass, "border-slate-200 bg-white hover:bg-slate-50")} aria-label="Next page">
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span className={cn(navClass, "border-slate-100 text-slate-300")} aria-hidden>
            <ChevronRight className="size-4" />
          </span>
        )}
      </nav>
    </div>
  );
}

/** Builds a query-string URL, dropping empty values. */
export function buildHref(path: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && !(key === "page" && value === 1)) search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
