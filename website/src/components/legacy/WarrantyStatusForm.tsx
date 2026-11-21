"use client";

import { useId, useState, type FormEvent } from "react";
import { lookupWarrantyStatus, type WarrantyStatusResult } from "@/services/warranties";
import { validateSerialNumber } from "@/lib/validation";
import { formatDate } from "@/lib/format";
import { warrantyStatusPage } from "@/content/pages";
import { cn } from "@/lib/cn";
import { DownloadWarrantyPdfButton } from "@/components/warranties/DownloadWarrantyPdfButton";
import type { WarrantyCertificateData } from "@/lib/warranty-certificate-pdf";
import { ShieldCheck, CheckCircle2, ArrowRight, Search, FileText } from "lucide-react";

const controlClass =
  "box-border block min-h-12 w-full rounded-[14px] border bg-white px-4 py-3.5 text-base text-black placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:shadow-[0_0_0_3px_rgb(249_159_30/0.2)] transition";

/** "Check your warranty status" form. Looks up warranty status by serial number alone. */
export function WarrantyStatusForm() {
  const id = useId();
  const [serialInput, setSerialInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [found, setFound] = useState<WarrantyStatusResult | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const serial = serialInput.trim().toUpperCase();
    const validationError = validateSerialNumber(serial);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    setSubmitting(true);
    const result = await lookupWarrantyStatus(serial);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setFound(result.data);
  }

  if (found) {
    const certificateData: WarrantyCertificateData = {
      warrantyNumber: found.warrantyNumber || `WR-${found.serialNumber.replace(/[^A-Za-z0-9]/g, "").slice(-6)}`,
      serialNumber: found.serialNumber,
      customerName: found.customerName || "Registered Customer",
      email: "—",
      mobile: found.mobile || "—",
      installationAddress: found.installationAddress || "—",
      productName: found.productName || found.model,
      productModel: found.model,
      capacity: found.capacity || "",
      mrp: found.mrp || 0,
      warrantyMonths: found.warrantyMonths || 60,
      purchaseDate: found.purchaseDate || found.registeredOn.slice(0, 10),
      installationDate: found.installationDate || undefined,
      dealerName: found.dealerName || "Authorized Olitec Partner",
      status: found.status === "Active" ? "Active" : found.status,
    };

    return (
      <div role="status" className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 sm:p-8 shadow-sm">
        {/* Verified Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-emerald-200/80">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-xs">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                OFFICIAL WARRANTY RECORD
              </div>
              <h3 className="text-xl font-bold text-slate-900">Warranty Active & Verified</h3>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-800">
            <CheckCircle2 size={14} className="text-emerald-600" />
            {found.status || "Active"}
          </span>
        </div>

        {/* Product Details Section */}
        <div className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Product Specifications
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Product</span>
              <span className="font-bold text-slate-900 text-sm">{found.productName || found.model}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Model</span>
              <span className="font-bold text-slate-900 font-mono text-sm">{found.model}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Capacity</span>
              <span className="font-bold text-slate-900">{found.capacity || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Standard Warranty</span>
              <span className="font-bold text-slate-900">
                {found.warrantyMonths ? `${Math.round(found.warrantyMonths / 12)} Years` : "5 Years"}
              </span>
            </div>
          </div>
        </div>

        {/* Warranty Registration Details */}
        <div className="mt-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Registration & Coverage Details
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Warranty Registration No:</span>
              <span className="font-bold font-mono text-slate-900">{certificateData.warrantyNumber}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Hardware Serial Number:</span>
              <span className="font-bold font-mono text-slate-900">{found.serialNumber}</span>
            </div>
            {found.customerName && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-bold text-slate-900">{found.customerName}</span>
              </div>
            )}
            {found.purchaseDate && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Purchase Date:</span>
                <span className="font-bold text-slate-900">{formatDate(found.purchaseDate)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Registered On:</span>
              <span className="font-bold text-slate-900">{formatDate(found.registeredOn)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Warranty Valid Until:</span>
              <span className="font-bold text-emerald-700">
                {found.validUntil ? formatDate(found.validUntil) : "Starts after invoice verification"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center gap-3 pt-2">
          <DownloadWarrantyPdfButton
            data={certificateData}
            variant="primary"
            label="Download Warranty Certificate (PDF)"
            className="h-11 px-6 rounded-xl text-xs font-bold shadow-sm"
          />
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 cursor-pointer"
            onClick={() => {
              setFound(null);
              setSerialInput("");
            }}
          >
            Check Another Serial Number
          </button>
        </div>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor={`${id}-serial`} className="mb-2 block text-sm font-bold text-slate-900">
          Product Serial Number
        </label>
        <div className="relative">
          <input
            id={`${id}-serial`}
            name="serial"
            type="text"
            required
            value={serialInput}
            onChange={(e) => {
              setSerialInput(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. OL2KTL2610000520 or OLI-1H3L-..."
            aria-required
            aria-invalid={error ? true : undefined}
            className={cn(controlClass, error ? "border-red-500" : "border-slate-300", "font-mono font-bold tracking-wider")}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          {warrantyStatusPage.serialHint || "Found on the silver barcode label on your hardware chassis or invoice."}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      <div>
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-7 text-sm font-bold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
          disabled={submitting || !serialInput.trim()}
        >
          {submitting ? (
            <span>Verifying Serial...</span>
          ) : (
            <>
              <Search size={16} />
              <span>Check Warranty Status</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
