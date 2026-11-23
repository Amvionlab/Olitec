"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ArrowDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";

type FilterCategory = "all" | "inverters" | "battery" | "brochures";

interface DocumentItem {
  id: string;
  category: "inverters" | "battery" | "brochures";
  title: string;
  familyTitle: string;
  eyebrow: string;
  eyebrowColor: string;
  description: string;
  pdfSize: string;
  pdfUrl: string;
  printFriendlySize?: string;
  printFriendlyUrl?: string;
  renderImage?: string;
  keywords: string[];
}

const DOCUMENTS: DocumentItem[] = [
  {
    id: "brochure",
    category: "brochures",
    title: "Energy storage solutions brochure",
    familyTitle: "Energy storage solutions brochure",
    eyebrow: "START HERE",
    eyebrowColor: "text-[#C46E0E]",
    description: "The complete Olitec inverter and battery range with applications and specifications, in one document.",
    pdfSize: "PDF 1.9 MB",
    pdfUrl: "/downloads/olitec-energy-storage-brochure.pdf",
    keywords: ["brochure", "solutions", "storage", "complete", "range", "overview", "specifications"],
  },
  {
    id: "inverters",
    category: "inverters",
    title: "Hybrid inverter datasheet",
    familyTitle: "OLI-1H and OLI-3H series",
    eyebrow: "HYBRID INVERTERS",
    eyebrowColor: "text-[#C46E0E]",
    description: "PDF 0.7 MB · OLI-1H single-phase 3 to 6 kW and OLI-3H three-phase 15 to 30 kW",
    pdfSize: "0.7 MB",
    pdfUrl: "/downloads/olitec-hybrid-inverter-datasheet.pdf",
    printFriendlySize: "0.3 MB",
    printFriendlyUrl: "/downloads/olitec-hybrid-inverter-datasheet-text.pdf",
    renderImage: "/images/products/inverter-render.png",
    keywords: ["inverter", "hybrid", "OLI-1H", "OLI-3H", "single-phase", "three-phase", "datasheet", "kW", "pure sine"],
  },
  {
    id: "battery",
    category: "battery",
    title: "LFP battery datasheet",
    familyTitle: "OLB-5.12 series",
    eyebrow: "LFP BATTERY",
    eyebrowColor: "text-[#1F7A34]",
    description: "PDF 0.5 MB · OLB-5.12 wall-mount and rack-mount 5.12 kWh packs",
    pdfSize: "0.5 MB",
    pdfUrl: "/downloads/olitec-lfp-battery-datasheet.pdf",
    printFriendlySize: "0.3 MB",
    printFriendlyUrl: "/downloads/olitec-lfp-battery-datasheet-text.pdf",
    renderImage: "/images/products/battery-render.png",
    keywords: ["battery", "lfp", "OLB-5.12", "OLB-5.12W", "OLB-5.12R", "storage", "rack-mount", "wall-mount", "datasheet", "kWh"],
  },
];

export function DownloadsHub() {
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return DOCUMENTS.filter((doc) => {
      // Category filter
      if (filter !== "all" && doc.category !== filter) return false;
      // Search filter
      if (!q) return true;
      const haystack = `${doc.title} ${doc.familyTitle} ${doc.description} ${doc.keywords.join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [filter, searchQuery]);

  const showBrochure = filteredDocs.some((d) => d.id === "brochure");
  const showInverters = filteredDocs.some((d) => d.id === "inverters");
  const showBattery = filteredDocs.some((d) => d.id === "battery");

  const inverterDoc = DOCUMENTS.find((d) => d.id === "inverters")!;
  const batteryDoc = DOCUMENTS.find((d) => d.id === "battery")!;
  const brochureDoc = DOCUMENTS.find((d) => d.id === "brochure")!;

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 xl:px-12 py-8 sm:py-12">
      {/* 1. Page Header (No banner: A plain "Downloads" heading and one line of text) */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl md:text-[44px] font-bold tracking-tight text-[#161E2C]">
          Downloads
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 font-normal">
          Datasheets and brochures for Olitec hybrid inverters and energy storage systems. All files are PDF.
        </p>
      </div>

      {/* 2. Filter Pills and Search Bar */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer",
              filter === "all"
                ? "bg-[#121C28] text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            <span>All</span>
            <span className={cn("text-xs", filter === "all" ? "text-slate-300" : "text-slate-400")}>5</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("inverters")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer",
              filter === "inverters"
                ? "bg-[#121C28] text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            <span>Hybrid inverters</span>
            <span className={cn("text-xs", filter === "inverters" ? "text-slate-300" : "text-slate-400")}>2</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("battery")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer",
              filter === "battery"
                ? "bg-[#121C28] text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            <span>LFP battery</span>
            <span className={cn("text-xs", filter === "battery" ? "text-slate-300" : "text-slate-400")}>2</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("brochures")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer",
              filter === "brochures"
                ? "bg-[#121C28] text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            <span>Brochures</span>
            <span className={cn("text-xs", filter === "brochures" ? "text-slate-300" : "text-slate-400")}>1</span>
          </button>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-72 md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by model or document, e.g. OLI-1H"
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#D45C0A] transition shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          <p className="text-base font-semibold">No documents found matching "{searchQuery}"</p>
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              setSearchQuery("");
            }}
            className="mt-3 text-xs font-bold text-[#D45C0A] hover:underline"
          >
            Clear filters and search
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 3. "Start Here" Block: Energy Storage Solutions Brochure */}
          {showBrochure && (
            <div className="relative overflow-hidden rounded-[22px] border border-[#FBEAD4] bg-[#FFF8EE] p-6 sm:p-7 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <p className="text-xs font-black uppercase tracking-wider text-[#C46E0E] mb-1.5">
                    START HERE
                  </p>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#121C28]">
                    {brochureDoc.title}
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {brochureDoc.description}
                  </p>
                </div>

                <div className="shrink-0">
                  <a
                    href={brochureDoc.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E8962C] to-[#F3BE48] px-6 py-3 text-xs sm:text-sm font-bold text-[#161E2C] shadow-[0_6px_18px_rgb(232_150_44/0.25)] transition hover:brightness-105 active:scale-95"
                  >
                    <ArrowDown className="size-4 text-[#161E2C]" strokeWidth={2.5} />
                    <span>Download brochure · {brochureDoc.pdfSize}</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* 4. Product Family Cards: 2 Columns (Inverters & Battery) */}
          {(showInverters || showBattery) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Hybrid Inverters */}
              {showInverters && (
                <div className="flex flex-col justify-between rounded-[22px] border border-[#E6EAEF] bg-white p-6 shadow-xs hover:border-slate-300 transition">
                  <div>
                    {/* Header Row: Product Render Image + Eyebrow & Title */}
                    <div className="flex items-center gap-4">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-slate-50 p-1 border border-slate-100 flex items-center justify-center">
                        <Image
                          src={inverterDoc.renderImage!}
                          alt="Olitec Inverter Series"
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                      <div>
                        <p className={cn("text-xs font-black uppercase tracking-wider", inverterDoc.eyebrowColor)}>
                          {inverterDoc.eyebrow}
                        </p>
                        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#121C28] mt-0.5">
                          {inverterDoc.familyTitle}
                        </h3>
                      </div>
                    </div>

                    <div className="my-5 border-b border-[#F0F3F7]" />

                    {/* Datasheet Row */}
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-[#121C28]">
                        {inverterDoc.title}
                      </h4>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                        {inverterDoc.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Print-Friendly Link + Download Button */}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-2">
                    <a
                      href={inverterDoc.printFriendlyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-[13px] font-semibold text-slate-800 hover:text-[#D45C0A] underline underline-offset-4 transition"
                    >
                      Print-friendly ({inverterDoc.printFriendlySize})
                    </a>

                    <a
                      href={inverterDoc.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#E8962C] to-[#F3BE48] px-5 py-2 text-xs sm:text-sm font-bold text-[#161E2C] shadow-[0_4px_14px_rgb(232_150_44/0.22)] transition hover:brightness-105 active:scale-95"
                    >
                      <ArrowDown className="size-3.5 text-[#161E2C]" strokeWidth={2.5} />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Card 2: LFP Battery */}
              {showBattery && (
                <div className="flex flex-col justify-between rounded-[22px] border border-[#E6EAEF] bg-white p-6 shadow-xs hover:border-slate-300 transition">
                  <div>
                    {/* Header Row: Product Render Image + Eyebrow & Title */}
                    <div className="flex items-center gap-4">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-slate-50 p-1 border border-slate-100 flex items-center justify-center">
                        <Image
                          src={batteryDoc.renderImage!}
                          alt="Olitec LFP Battery Series"
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                      <div>
                        <p className={cn("text-xs font-black uppercase tracking-wider", batteryDoc.eyebrowColor)}>
                          {batteryDoc.eyebrow}
                        </p>
                        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#121C28] mt-0.5">
                          {batteryDoc.familyTitle}
                        </h3>
                      </div>
                    </div>

                    <div className="my-5 border-b border-[#F0F3F7]" />

                    {/* Datasheet Row */}
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-[#121C28]">
                        {batteryDoc.title}
                      </h4>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                        {batteryDoc.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Print-Friendly Link + Download Button */}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-2">
                    <a
                      href={batteryDoc.printFriendlyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-[13px] font-semibold text-slate-800 hover:text-[#D45C0A] underline underline-offset-4 transition"
                    >
                      Print-friendly ({batteryDoc.printFriendlySize})
                    </a>

                    <a
                      href={batteryDoc.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#E8962C] to-[#F3BE48] px-5 py-2 text-xs sm:text-sm font-bold text-[#161E2C] shadow-[0_4px_14px_rgb(232_150_44/0.22)] transition hover:brightness-105 active:scale-95"
                    >
                      <ArrowDown className="size-3.5 text-[#161E2C]" strokeWidth={2.5} />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. Bottom Dark Navy Card: Manuals and Certificates */}
          <div className="rounded-[22px] bg-[#121C28] text-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Installation manuals and certificates
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Shared with our channel partners, and on request for project tenders.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                    Installation manuals
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                    Test certificates
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                    Compliance documents
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <Link
                  href="/homes-and-businesses"
                  className="inline-flex items-center justify-center rounded-full border border-white/40 hover:border-white px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-transparent hover:bg-white/10 transition"
                >
                  Request a document
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
