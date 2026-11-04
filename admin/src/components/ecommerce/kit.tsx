"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Lock, X } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { ecomApi, messageOf, type PageMeta } from "@/services/ecommerce/api";
import { useEcom } from "./EcomSession";

// ---------------------------------------------------------------- data loading

/** Loads `path` whenever it changes. `reload()` refetches (after a write). */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<PageMeta>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    setLoading(true);
    ecomApi
      .page<T>(path)
      .then((result) => {
        if (cancelled) return;
        setData(result.data);
        setMeta(result.meta);
        setError(null);
      })
      .catch((reason) => !cancelled && setError(messageOf(reason)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [path, tick]);

  return { data, meta, error, loading, reload: useCallback(() => setTick((value) => value + 1), []), setData };
}

/** Filters kept in the URL so list views are shareable and survive reloads. */
export function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const get = (key: string) => params.get(key) ?? "";
  const set = (changes: Record<string, string | number | null | undefined>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    if (!("page" in changes)) next.delete("page");
    router.replace(`${pathname}${next.toString() ? `?${next}` : ""}`, { scroll: false });
  };
  return { get, set, params };
}

/** Runs a write, shows a toast and returns whether it succeeded. */
export function useAction() {
  const { notify } = useEcom();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async <T,>(work: () => Promise<T>, success?: string): Promise<T | undefined> => {
      setBusy(true);
      try {
        const result = await work();
        if (success) notify(success);
        return result;
      } catch (error) {
        notify(messageOf(error), "error");
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [notify],
  );
  return { run, busy };
}

// ---------------------------------------------------------------- layout bits

export function Forbidden({ permission }: { permission: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center text-slate-600">
      <Lock className="size-8 text-slate-400" aria-hidden />
      <p className="font-medium text-slate-900">You do not have access to this page</p>
      <p className="text-sm">Requires the “{permission}” permission. Ask a Super Admin to change your role.</p>
    </div>
  );
}

/** Renders children only with the permission (the API refuses the data anyway). */
export function RequirePermission({ permission, children }: { permission: string; children: ReactNode }) {
  const { can } = useEcom();
  return can(permission) ? <>{children}</> : <Forbidden permission={permission} />;
}

export function LoadState({ loading, error, empty, children }: { loading: boolean; error: string | null; empty?: boolean; children: ReactNode }) {
  if (error) return <div className="p-4"><Alert tone="error">{error}</Alert></div>;
  if (loading && empty !== false) return <p className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" aria-hidden /> Loading…</p>;
  return <>{children}</>;
}

export function Pager({ meta, onPage }: { meta: PageMeta; onPage: (page: number) => void }) {
  const page = meta.page ?? 1;
  const pageCount = meta.pageCount ?? 1;
  if (!meta.total) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
      <span>
        Page {page} of {pageCount} · {meta.total} total
      </span>
      <div className="flex gap-1">
        <button className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </button>
        <button className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40" disabled={page >= pageCount} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

const tones = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  blue: "bg-brand-50 text-brand-700 ring-brand-600/20",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/20",
} as const;
export type Tone = keyof typeof tones;

export function Pill({ children, tone = "slate" }: { children: ReactNode; tone?: Tone }) {
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", tones[tone])}>{children}</span>;
}

const STATUS_TONES: Record<string, Tone> = {
  active: "green", paid: "green", captured: "green", delivered: "green", processed: "green", approved: "green", resolved: "green", converted: "green", accepted: "green", in_stock: "green",
  pending: "amber", pending_payment: "amber", cod_pending: "amber", refund_pending: "amber", return_requested: "amber", draft: "amber", open: "amber", new: "amber", low: "amber", processing: "blue",
  created: "slate", inactive: "slate", archived: "slate", closed: "slate", expired: "slate",
  failed: "red", cancelled: "red", rejected: "red", refunded: "red", returned: "red", out: "red",
  confirmed: "blue", packed: "blue", shipped: "blue", out_for_delivery: "blue", in_progress: "blue", contacted: "blue", quotation_sent: "blue", negotiation: "blue", sent: "blue", partially_refunded: "blue",
};

export function StatusPill({ status }: { status: string }) {
  return <Pill tone={STATUS_TONES[status] ?? "slate"}>{status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}</Pill>;
}

/** Native <dialog> modal (focus trap and Esc for free), like the existing ConfirmDialog. */
export function Modal({ open, title, onClose, children, wide }: { open: boolean; title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={cn("m-auto w-[calc(100%-2rem)] rounded-2xl border border-slate-200 p-0 shadow-xl backdrop:bg-slate-900/40", wide ? "max-w-3xl" : "max-w-lg")}
      aria-label={title}
    >
      {open && (
        <div className="max-h-[85vh] overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close">
              <X className="size-5" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      )}
    </dialog>
  );
}

export function StatCard({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: "warn" | "bad" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold", tone === "bad" ? "text-red-600" : tone === "warn" ? "text-amber-600" : "text-slate-900")}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/** Simple accessible horizontal bar chart (values also listed as text). */
export function BarList({ rows, format = (value) => String(value) }: { rows: { label: string; value: number }[]; format?: (value: number) => string }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  if (!rows.length) return <p className="py-6 text-center text-sm text-slate-500">No data for this period.</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.label} className="space-y-1">
          <div className="flex justify-between gap-2 text-sm">
            <span className="truncate text-slate-700">{row.label}</span>
            <span className="shrink-0 font-medium text-slate-900">{format(row.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Vertical column chart for time series. */
export function ColumnChart({ rows, format }: { rows: { label: string; value: number }[]; format: (value: number) => string }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  if (!rows.length) return <p className="py-10 text-center text-sm text-slate-500">No sales in this period.</p>;
  return (
    <div className="overflow-x-auto">
      <div className="flex h-48 min-w-full items-end gap-1" role="img" aria-label={`Chart: ${rows.map((row) => `${row.label} ${format(row.value)}`).join(", ")}`}>
        {rows.map((row) => (
          <div key={row.label} className="group relative flex min-w-6 flex-1 flex-col items-center justify-end">
            <div className="w-full rounded-t bg-brand-500 transition group-hover:bg-brand-700" style={{ height: `${Math.max(2, (row.value / max) * 100)}%` }} />
            <span className="pointer-events-none absolute -top-7 hidden whitespace-nowrap rounded bg-slate-900 px-2 py-0.5 text-xs text-white group-hover:block">{format(row.value)}</span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1 text-[10px] text-slate-500">
        {rows.map((row, index) => (
          <span key={row.label} className="min-w-6 flex-1 truncate text-center">
            {rows.length > 14 && index % Math.ceil(rows.length / 10) !== 0 ? "" : row.label.slice(5) || row.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- image upload

const MAX_BYTES = 5 * 1024 * 1024;

/** Uploads JPEG/PNG/WebP (≤5 MB) to the backend, which re-checks type by file signature. Returns the public URL. */
export function ImageUpload({ onUploaded, label = "Upload image", multiple }: { onUploaded: (url: string) => void; label?: string; multiple?: boolean }) {
  const { notify } = useEcom();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    for (const file of Array.from(files)) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        notify(`${file.name}: only JPEG, PNG or WebP images are allowed.`, "error");
        continue;
      }
      if (file.size > MAX_BYTES) {
        notify(`${file.name}: images must be smaller than 5 MB.`, "error");
        continue;
      }
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      try {
        const result = await ecomApi.post<{ url: string }>("/admin/uploads", { fileName: file.name, contentType: file.type, dataBase64 });
        onUploaded(result.url);
      } catch (error) {
        notify(`${file.name}: ${messageOf(error)}`, "error");
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  };

  return (
    <>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} className="sr-only" onChange={(event) => void upload(event.target.files)} aria-label={label} />
      <Button variant="secondary" size="sm" onClick={() => input.current?.click()} loading={busy}>
        <ImagePlus className="size-4" aria-hidden /> {label}
      </Button>
    </>
  );
}

export function Thumb({ src, alt = "" }: { src: string | null | undefined; alt?: string }) {
  return src ? (
    // Plain <img>: admin thumbnails come straight from the API media host; no optimisation needed.
    <img src={src} alt={alt} className="size-10 rounded-lg border border-slate-200 bg-white object-contain" loading="lazy" />
  ) : (
    <span className="block size-10 rounded-lg bg-slate-100" aria-hidden />
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export const inputClass = "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";
