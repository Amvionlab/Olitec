"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Search,
  FileText,
  Phone,
  AlertCircle,
  Calendar,
  Clock,
  Zap,
  Check,
  HelpCircle,
  Wrench,
} from "lucide-react";
import { lookupWarrantyStatus, type WarrantyStatusResult } from "@/services/warranties";
import { validateSerialNumber } from "@/lib/validation";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { DownloadWarrantyPdfButton } from "@/components/warranties/DownloadWarrantyPdfButton";
import type { WarrantyCertificateData } from "@/lib/warranty-certificate-pdf";

export function WarrantyStatusExplorer() {
  const [serialInput, setSerialInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [found, setFound] = useState<WarrantyStatusResult | null>(null);

  async function handleSearch() {
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

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleSearch();
  }

  const certificateData: WarrantyCertificateData | null = found
    ? {
        warrantyNumber:
          found.warrantyNumber || `WR-${found.serialNumber.replace(/[^A-Za-z0-9]/g, "").slice(-6)}`,
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
      }
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* 1. Header Section */}
      <div className="max-w-3xl mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#D45C0A] mb-3">
          <ShieldCheck className="size-4" />
          <span>Official Warranty Verification</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#161E2C] leading-tight">
          Check your hardware warranty status
        </h2>
        <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">
          Verify active manufacturer coverage, review warranty terms, and instantly download your official digital warranty certificate.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Main Column (8 cols): Search Box & Result */}
        <div className="lg:col-span-8 space-y-6">
          {/* Search Box Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs hover:border-slate-300 transition">
            <form onSubmit={onSubmit} className="space-y-4">
              <label htmlFor="serial-search-input" className="block text-sm font-bold text-slate-900">
                Enter Product Serial Number
              </label>

              <div className="relative flex flex-col sm:flex-row items-stretch gap-2.5">
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Search className="size-5" />
                  </div>
                  <input
                    id="serial-search-input"
                    type="text"
                    value={serialInput}
                    onChange={(e) => {
                      setSerialInput(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Enter serial number (e.g. from device barcode)"
                    className={cn(
                      "w-full rounded-2xl border bg-slate-50/50 py-3.5 pl-11 pr-4 font-mono text-base font-bold tracking-wider text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D45C0A]/30 transition",
                      error ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-[#D45C0A]"
                    )}
                  />
                  {serialInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setSerialInput("");
                        setFound(null);
                        setError(null);
                      }}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs font-semibold text-slate-400 hover:text-slate-700"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || !serialInput.trim()}
                  className="inline-flex h-12 sm:h-auto items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#D45C0A] to-[#E8962C] px-7 py-3 text-sm font-bold text-white shadow-md shadow-[#D45C0A]/20 transition hover:brightness-105 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <span>Check Status</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Helpful finding hint for production customers */}
              <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                <HelpCircle className="size-3.5 text-slate-400 shrink-0" />
                <span>Found on your product rating plate or purchase invoice. Need help? Call 8501 800 800.</span>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
                  <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-600" />
                  <p>{error}</p>
                </div>
              )}
            </form>
          </div>

          {/* Result Card */}
          {found && certificateData && (
            <div className="rounded-3xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/60 to-white p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
              {/* Header Status Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-emerald-200/80">
                <div className="flex items-center gap-3.5">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                    <ShieldCheck className="size-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      OFFICIAL WARRANTY RECORD
                    </span>
                    <h3 className="text-xl font-bold text-slate-900">Warranty Active & Verified</h3>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-emerald-100 border border-emerald-300 px-3.5 py-1 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>{found.status || "Active"}</span>
                </div>
              </div>

              {/* Hardware Specifications */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Hardware Specifications
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Product</span>
                    <span className="font-bold text-slate-900 text-sm">{found.productName || found.model}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Model Series</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">{found.model}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Rated Capacity</span>
                    <span className="font-bold text-slate-900 text-sm">{found.capacity || "Standard"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Standard Cover</span>
                    <span className="font-bold text-emerald-700 text-sm">
                      {found.warrantyMonths ? `${Math.round(found.warrantyMonths / 12)} Years` : "5 Years"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Registration & Validity Details */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Coverage & Validity Timeline
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
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
                      {found.validUntil ? formatDate(found.validUntil) : "Active (5-Year Cycle)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <DownloadWarrantyPdfButton
                  data={certificateData}
                  variant="primary"
                  label="Download Warranty Certificate (PDF)"
                  className="h-12 px-6 rounded-2xl text-xs font-bold shadow-md shadow-[#D45C0A]/10"
                />

                <Link
                  href={`/service-request?serial=${encodeURIComponent(found.serialNumber)}`}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 text-xs font-bold text-slate-700 shadow-xs hover:border-[#D45C0A] hover:text-[#D45C0A] transition"
                >
                  <Wrench className="size-4" />
                  <span>Book Service for this Unit</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setFound(null);
                    setSerialInput("");
                  }}
                  className="inline-flex h-12 items-center justify-center rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-800 px-4 transition cursor-pointer"
                >
                  Check Another Serial
                </button>
              </div>
            </div>
          )}

          {/* Initial Info Guidance (shown when no serial searched yet) */}
          {!found && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 space-y-6">
              <h3 className="text-lg font-bold text-[#161E2C] flex items-center gap-2">
                <ShieldCheck className="size-5 text-[#D45C0A]" />
                <span>What is covered under your Olitec Warranty?</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div className="font-bold text-slate-900 text-sm mb-1">10-Year Inverter</div>
                  <p className="text-slate-600 leading-relaxed">
                    Full replacement coverage on power IGBT modules, DSP motherboard, and MPPT tracker circuits.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div className="font-bold text-slate-900 text-sm mb-1">5-Year LFP Storage</div>
                  <p className="text-slate-600 leading-relaxed">
                    Grade-A LiFePO4 cells with smart active cell balancing BMS and capacity retention guarantee.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <div className="font-bold text-slate-900 text-sm mb-1">On-Site Dispatch</div>
                  <p className="text-slate-600 leading-relaxed">
                    Certified technician on-site visits within 24 to 48 hours for verified active warranty units.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Aside Column (4 cols): Need Help & Register Cards */}
        <div className="lg:col-span-4 space-y-6">
          {/* Not Registered Card */}
          <div className="rounded-3xl border border-amber-200 bg-gradient-to-b from-[#FFF9F2] to-white p-6 shadow-xs">
            <div className="size-10 rounded-xl bg-[#FFF1DF] text-[#D45C0A] flex items-center justify-center mb-3">
              <FileText className="size-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">New Product Not Registered?</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              If you recently purchased an Olitec inverter or battery, register it now to activate official warranty coverage and receive your digital certificate.
            </p>
            <div className="mt-4">
              <Link
                href="/warranties/register"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#161E2C] hover:bg-[#D45C0A] px-4 py-2.5 text-xs font-bold text-white transition shadow-xs"
              >
                <span>Register your warranty</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Where is Serial Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
              <HelpCircle className="size-4 text-[#D45C0A]" />
              <span>Where to find your serial number?</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Look for the silver barcode sticker on:
            </p>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-[#D45C0A] mt-1.5 shrink-0" />
                <span><strong>Inverter:</strong> Right-hand side or bottom terminal bay cover.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-[#D45C0A] mt-1.5 shrink-0" />
                <span><strong>Battery:</strong> Front fascia plate near the status LEDs.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-[#D45C0A] mt-1.5 shrink-0" />
                <span><strong>Invoice:</strong> Itemized invoice provided by your authorized dealer.</span>
              </li>
            </ul>
          </div>

          {/* Phone Helpline Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <Phone className="size-4.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  CALL OLITEC
                </span>
                <h4 className="text-base font-extrabold text-slate-900">8501 800 800</h4>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mt-2">
              Direct access to Olitec warranty and application engineers.
            </p>
            <div className="mt-3.5 pt-3 border-t border-slate-100">
              <a
                href="tel:8501800800"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-800 hover:border-slate-400 transition"
              >
                <Phone className="size-3.5" />
                <span>Call 8501 800 800</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
