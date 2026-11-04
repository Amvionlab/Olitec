import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { forwardRef, useId } from "react";
import { AlertCircle, CheckCircle2, Info, Loader2, Star } from "lucide-react";
import { cn, formatPrice } from "@/utils/format";
import type { StockStatus } from "@/types";

// ---------------------------------------------------------------- buttons

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 disabled:bg-brand-200",
  dark: "bg-forest text-white hover:bg-forest/90 disabled:bg-slate-300",
  secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:text-slate-400",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
};
const sizes: Record<Size, string> = { sm: "h-9 px-3 text-sm", md: "h-11 px-5 text-sm", lg: "h-12 px-6 text-base" };

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn("inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed", variants[variant], sizes[size], className);
}

export function Button({
  variant,
  size,
  loading,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}

// ---------------------------------------------------------------- form fields

const fieldBase =
  "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:bg-slate-100 aria-[invalid=true]:border-red-500";

export function Field({ label, error, hint, required, children, id }: { label: string; error?: string; hint?: string; required?: boolean; children: (id: string, describedBy?: string) => ReactNode; id?: string }) {
  const generated = useId();
  const fieldId = id ?? generated;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {children(fieldId, describedBy)}
      {error ? (
        <p id={`${fieldId}-error`} className="text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(fieldBase, className)} {...props} />;
});

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "min-h-24", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldBase, "pr-8", className)} {...props} />;
}

/** Text input wired to a label/error, for the common case. */
export function TextField({
  label,
  error,
  hint,
  required,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      {(id, describedBy) => <Input id={id} required={required} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...props} />}
    </Field>
  );
}

// ---------------------------------------------------------------- feedback

export function Alert({ kind = "error", children, className }: { kind?: "error" | "success" | "info"; children: ReactNode; className?: string }) {
  const Icon = kind === "error" ? AlertCircle : kind === "success" ? CheckCircle2 : Info;
  const tone = kind === "error" ? "bg-red-50 text-red-800 ring-red-200" : kind === "success" ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-sky-50 text-sky-800 ring-sky-200";
  return (
    <div role={kind === "error" ? "alert" : "status"} className={cn("flex gap-2 rounded-lg px-4 py-3 text-sm ring-1", tone, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500" role="status">
      <Loader2 className="size-5 animate-spin" aria-hidden /> {label}…
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      {icon && <div className="mb-3 text-slate-400">{icon}</div>}
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {children && <div className="mt-1 max-w-md text-sm text-slate-600">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border border-slate-200 bg-white", className)}>{children}</div>;
}

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

// ---------------------------------------------------------------- commerce bits

export function Price({ price, mrp, size = "md" }: { price: number; mrp?: number; size?: "sm" | "md" | "lg" }) {
  const off = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className={cn("font-bold text-slate-900", size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-lg")}>{formatPrice(price)}</span>
      {off > 0 && (
        <>
          <span className={cn("text-slate-500 line-through", size === "lg" ? "text-base" : "text-sm")}>
            <span className="sr-only">MRP </span>
            {formatPrice(mrp!)}
          </span>
          <span className={cn("font-semibold text-leaf", size === "lg" ? "text-base" : "text-sm")}>{off}% off</span>
        </>
      )}
    </div>
  );
}

export function Stars({ value, count, size = "sm" }: { value: number; count?: number; size?: "sm" | "md" }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Rated ${value.toFixed(1)} out of 5${count !== undefined ? ` from ${count} reviews` : ""}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(size === "md" ? "size-5" : "size-3.5", star <= Math.round(value) ? "fill-brand-400 text-brand-400" : "fill-slate-200 text-slate-200")}
          aria-hidden
        />
      ))}
      {count !== undefined && <span className="text-xs text-slate-500">({count})</span>}
    </span>
  );
}

const stockStyles: Record<StockStatus, [string, string]> = {
  in_stock: ["In stock", "bg-emerald-50 text-emerald-700"],
  low_stock: ["Only a few left", "bg-amber-50 text-amber-700"],
  out_of_stock: ["Out of stock", "bg-slate-100 text-slate-600"],
};

export function StockBadge({ status }: { status: StockStatus }) {
  const [label, style] = stockStyles[status];
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", style)}>{label}</span>;
}

export function StatusPill({ label, tone = "slate" }: { label: string; tone?: "green" | "amber" | "red" | "slate" | "blue" }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
    red: "bg-red-50 text-red-700 ring-red-600/20",
    slate: "bg-slate-100 text-slate-700 ring-slate-500/20",
    blue: "bg-sky-50 text-sky-700 ring-sky-600/20",
  };
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", tones[tone])}>{label}</span>;
}

export function orderTone(status: string): "green" | "amber" | "red" | "slate" | "blue" {
  if (["delivered"].includes(status)) return "green";
  if (["pending_payment", "return_requested"].includes(status)) return "amber";
  if (["cancelled", "returned", "refunded"].includes(status)) return "red";
  if (["shipped", "out_for_delivery"].includes(status)) return "blue";
  return "slate";
}
