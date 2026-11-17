"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Download,
  Eye,
  FileText,
  CheckCircle2,
  Filter,
  Grid,
  List,
  Lock,
  Layers,
  Cpu,
  BatteryCharging,
  FileCheck,
  ExternalLink,
  X,
  SlidersHorizontal,
  ArrowDownToLine,
  Check,
  Sparkles,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";

export interface DownloadDoc {
  id: string;
  title: string;
  category: "Datasheets" | "Brochures";
  hardware: "Hybrid Inverters" | "Energy Storage" | "Complete Systems";
  modelCoverage: string;
  description: string;
  edition: string;
  size: string;
  bytes: number;
  pages: string;
  updated: string;
  version: string;
  href: string;
  isEcoPrint?: boolean;
  tags: string[];
  specs: { label: string; value: string }[];
}

export const DOWNLOAD_DOCS: DownloadDoc[] = [
  {
    id: "inv-full",
    title: "Hybrid Inverter Technical Datasheet",
    category: "Datasheets",
    hardware: "Hybrid Inverters",
    modelCoverage: "OLI-1H (3 to 6 kW) & OLI-3H (15 to 30 kW)",
    description:
      "Complete electrical parameters, MPPT voltage windows, battery charging curves, efficiency profiles, and physical enclosure dimensions.",
    edition: "Full Visual Edition",
    size: "0.7 MB",
    bytes: 739303,
    pages: "4 Pages",
    updated: "Nov 2026",
    version: "v2.4",
    href: "/downloads/olitec-hybrid-inverter-datasheet.pdf",
    tags: ["Single Phase", "Three Phase", "Dual MPPT", "IP66", "<10ms UPS"],
    specs: [
      { label: "Rated Power", value: "3 kW to 30 kW" },
      { label: "PV Input Voltage", value: "Up to 1000 V" },
      { label: "Switch-over", value: "< 10 ms (UPS Class)" },
      { label: "Protection", value: "IP66 Outdoor Rated" },
    ],
  },
  {
    id: "inv-text",
    title: "Hybrid Inverter Specifications (Print & Tender Edition)",
    category: "Datasheets",
    hardware: "Hybrid Inverters",
    modelCoverage: "OLI-1H & OLI-3H Series",
    description:
      "Clean, high-contrast monochrome tables without photographic assets, optimized for contract appendices and tender printouts.",
    edition: "Eco Print Edition",
    isEcoPrint: true,
    size: "0.3 MB",
    bytes: 324360,
    pages: "4 Pages",
    updated: "Nov 2026",
    version: "v2.4-Text",
    href: "/downloads/olitec-hybrid-inverter-datasheet-text.pdf",
    tags: ["Print Friendly", "Tender Ready", "Tabular IEC Specs"],
    specs: [
      { label: "Format", value: "Monochrome Vector" },
      { label: "Ink Optimization", value: "92% Less Ink" },
      { label: "Compliance", value: "IEC / BIS Tables" },
      { label: "Application", value: "Project Tenders" },
    ],
  },
  {
    id: "bat-full",
    title: "OLB-5.12 LFP Battery Storage Datasheet",
    category: "Datasheets",
    hardware: "Energy Storage",
    modelCoverage: "OLB-5.12W (Wall-Mount) & OLB-5.12R (Rack-Mount)",
    description:
      "Prismatic LiFePO4 chemistry ratings, DoD vs cycle curves, CAN/RS485 BMS communication, and modular parallel expansion wiring.",
    edition: "Full Visual Edition",
    size: "0.5 MB",
    bytes: 473991,
    pages: "4 Pages",
    updated: "Nov 2026",
    version: "v2.1",
    href: "/downloads/olitec-lfp-battery-datasheet.pdf",
    tags: ["LiFePO4", "5.12 kWh", "4000 Cycles", "BIS Certified", "Scalable 51.2 kWh"],
    specs: [
      { label: "Nominal Capacity", value: "5.12 kWh (100 Ah)" },
      { label: "Nominal Voltage", value: "51.2 V" },
      { label: "Cycle Life", value: "4,000 @ 80% DoD" },
      { label: "Certifications", value: "BIS, UN 38.3" },
    ],
  },
  {
    id: "bat-text",
    title: "OLB-5.12 LFP Battery Specifications (Print Edition)",
    category: "Datasheets",
    hardware: "Energy Storage",
    modelCoverage: "OLB-5.12W & OLB-5.12R Series",
    description:
      "Streamlined black-and-white engineering specification tables for field engineers, installers, and municipal compliance submissions.",
    edition: "Eco Print Edition",
    isEcoPrint: true,
    size: "0.3 MB",
    bytes: 308827,
    pages: "3 Pages",
    updated: "Nov 2026",
    version: "v2.1-Text",
    href: "/downloads/olitec-lfp-battery-datasheet-text.pdf",
    tags: ["Print Friendly", "Field Guide", "Compliance"],
    specs: [
      { label: "Format", value: "Clean Tabular" },
      { label: "Compatibility", value: "OLI-1H / 3H & Tier-1" },
      { label: "Safety Standard", value: "UL9540A Cell Level" },
      { label: "Thermal Runaway", value: "Multi-point Thermal Cutoff" },
    ],
  },
  {
    id: "brochure",
    title: "Olitec Clean Energy Solutions — Complete Systems Brochure",
    category: "Brochures",
    hardware: "Complete Systems",
    modelCoverage: "All Residential, C&I, and Open-Access Products",
    description:
      "Comprehensive illustrated system portfolio showcasing real installation case studies, microgrid architectures, and company manufacturing legacy.",
    edition: "Complete Portfolio Brochure",
    size: "1.9 MB",
    bytes: 1877355,
    pages: "16 Pages",
    updated: "Nov 2026",
    version: "2026 Edition",
    href: "/downloads/olitec-energy-storage-brochure.pdf",
    tags: ["Full Portfolio", "Case Studies", "System Architecture", "Open-Access EPC"],
    specs: [
      { label: "Coverage", value: "Inverters, Batteries & EPC" },
      { label: "Audience", value: "EPCs, Partners & Owners" },
      { label: "Case Studies", value: "Hospital, Factory, Villa" },
      { label: "Warranty", value: "Up to 10 Years Backed" },
    ],
  },
];

export const LOCKED_DOCS = [
  {
    id: "sld-cad",
    title: "Single-Line Wiring Diagrams (SLD in CAD/DWG + PDF)",
    category: "Partner Vault",
    requirement: "Channel Partner Sign-in",
    description: "Full engineering wiring schematics for AC/DC breaker sizing, earthing, and grid synchronization.",
  },
  {
    id: "cea-cert",
    title: "CEA & Central Electricity Authority Compliance Certificate",
    category: "Partner Vault",
    requirement: "Tender / Bidder Access",
    description: "Type test reports and grid compliance certifications for utility interconnection tenders.",
  },
  {
    id: "modbus-spec",
    title: "Modbus RTU & SunSpec Communication Protocol Specification",
    category: "Partner Vault",
    requirement: "Engineering NDA",
    description: "Register mappings for SCADA integration, EMS control, and third-party inverter monitoring.",
  },
  {
    id: "fat-report",
    title: "Factory Acceptance Test (FAT) & Quality Inspection Templates",
    category: "Partner Vault",
    requirement: "Tender / Bidder Access",
    description: "Quality assurance checklists and automated testing logs for industrial deliveries.",
  },
];

export function DownloadsHub() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedHardware, setSelectedHardware] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewDoc, setPreviewDoc] = useState<DownloadDoc | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return DOWNLOAD_DOCS.filter((doc) => {
      // Category filter
      if (selectedCategory !== "All" && doc.category !== selectedCategory) {
        return false;
      }
      // Hardware filter
      if (selectedHardware === "EcoPrint" && !doc.isEcoPrint) {
        return false;
      }
      if (
        selectedHardware !== "All" &&
        selectedHardware !== "EcoPrint" &&
        doc.hardware !== selectedHardware
      ) {
        return false;
      }
      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchesTitle = doc.title.toLowerCase().includes(query);
        const matchesDesc = doc.description.toLowerCase().includes(query);
        const matchesModel = doc.modelCoverage.toLowerCase().includes(query);
        const matchesTags = doc.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDesc && !matchesModel && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [search, selectedCategory, selectedHardware]);

  // Select/Deselect all
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDocs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocs.map((d) => d.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Handle single download click with micro-feedback
  const handleDownload = (doc: DownloadDoc) => {
    setDownloadingId(doc.id);
    const link = document.createElement("a");
    link.href = doc.href;
    link.download = doc.href.split("/").pop() || "document.pdf";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadingId(null);
    }, 1200);
  };

  // Batch download handler
  const handleBatchDownload = () => {
    const targets = DOWNLOAD_DOCS.filter((d) => selectedIds.has(d.id));
    if (targets.length === 0) return;

    setIsBatchDownloading(true);

    targets.forEach((doc, idx) => {
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = doc.href;
        link.download = doc.href.split("/").pop() || "document.pdf";
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 400);
    });

    setTimeout(() => {
      setIsBatchDownloading(false);
    }, targets.length * 400 + 800);
  };

  const totalSelectedBytes = useMemo(() => {
    return DOWNLOAD_DOCS.filter((d) => selectedIds.has(d.id)).reduce(
      (sum, d) => sum + d.bytes,
      0
    );
  }, [selectedIds]);

  const formattedSelectedSize = (totalSelectedBytes / (1024 * 1024)).toFixed(1) + " MB";

  return (
    <div className="relative w-full">
      {/* Interactive Controls Bar: Search, Category, View Switcher */}
      <div className="mb-8 rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Real-time Search Input */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by model, keyword, rating (e.g. OLI-1H, 5.12, IP66)..."
              className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50/70 pl-11 pr-10 text-[14.5px] font-medium text-black placeholder:text-slate-400 transition-all focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-black transition"
                title="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* View Switcher & Selection Count */}
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="text-xs sm:text-sm font-semibold text-slate-500">
              Showing <span className="text-black font-bold">{filteredDocs.length}</span> of {DOWNLOAD_DOCS.length} files
            </span>

            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  viewMode === "grid"
                    ? "bg-white text-black shadow-xs font-bold"
                    : "text-slate-500 hover:text-black"
                )}
                aria-label="Grid view"
              >
                <Grid className="size-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  viewMode === "list"
                    ? "bg-white text-black shadow-xs font-bold"
                    : "text-slate-500 hover:text-black"
                )}
                aria-label="List view"
              >
                <List className="size-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills: Category & Hardware */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "All", label: "All Types" },
              { id: "Datasheets", label: "Datasheets (4)" },
              { id: "Brochures", label: "Brochures (1)" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={cn(
                  "h-9 px-4 rounded-full text-xs sm:text-[13px] font-semibold transition-all cursor-pointer",
                  selectedCategory === tab.id
                    ? "brand-gradient text-black shadow-xs ring-2 ring-brand-400/40"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Hardware Sub-filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
              <SlidersHorizontal className="size-3" />
              Hardware:
            </span>
            {[
              { id: "All", label: "All" },
              { id: "Hybrid Inverters", label: "Inverters" },
              { id: "Energy Storage", label: "Batteries" },
              { id: "Complete Systems", label: "Systems" },
              { id: "EcoPrint", label: "Eco Print" },
            ].map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setSelectedHardware(tag.id)}
                className={cn(
                  "h-7 px-2.5 rounded-lg transition-all cursor-pointer font-medium",
                  selectedHardware === tag.id
                    ? "bg-black text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Select All / Batch Action Toolbar */}
      <div className="mb-4 flex items-center justify-between px-2 text-xs sm:text-sm text-slate-600">
        <label className="flex items-center gap-2.5 cursor-pointer font-medium select-none">
          <input
            type="checkbox"
            checked={filteredDocs.length > 0 && selectedIds.size === filteredDocs.length}
            onChange={toggleSelectAll}
            className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer accent-amber-500"
          />
          <span>Select all visible documents for batch download</span>
        </label>

        {selectedIds.size > 0 && (
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-brand-700 hover:underline font-semibold cursor-pointer"
          >
            Clear selection ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Grid View */}
      {viewMode === "grid" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => {
            const isSelected = selectedIds.has(doc.id);
            const isDownloading = downloadingId === doc.id;

            return (
              <article
                key={doc.id}
                className={cn(
                  "group relative flex flex-col justify-between rounded-3xl border bg-white p-6 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl",
                  isSelected
                    ? "border-amber-400 ring-2 ring-amber-400/30 shadow-md bg-amber-50/10"
                    : "border-slate-200/90 hover:border-slate-300 shadow-xs"
                )}
              >
                {/* Top Badges & Select Checkbox */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-700 border border-slate-200/60">
                        {doc.hardware === "Hybrid Inverters" ? (
                          <Cpu className="size-3 text-amber-600" />
                        ) : doc.hardware === "Energy Storage" ? (
                          <BatteryCharging className="size-3 text-emerald-600" />
                        ) : (
                          <Layers className="size-3 text-brand-600" />
                        )}
                        {doc.category}
                      </span>

                      {doc.isEcoPrint && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                          <Sparkles className="size-2.5" />
                          Eco Print
                        </span>
                      )}
                    </div>

                    {/* Selection Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(doc.id)}
                      className="size-4.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer accent-amber-500 mt-1"
                      title="Select for batch download"
                    />
                  </div>

                  {/* Document Card Title & Coverage */}
                  <h3 className="mt-4 text-[19px] font-bold leading-snug text-black transition-colors duration-200 group-hover:text-brand-600">
                    {doc.title}
                  </h3>

                  <div className="mt-1.5 text-xs font-semibold text-brand-700">
                    {doc.modelCoverage}
                  </div>

                  <p className="mt-3 text-[13.5px] leading-relaxed text-slate-600 line-clamp-3">
                    {doc.description}
                  </p>

                  {/* Key Specifications Snippet Box */}
                  <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-100 p-3 space-y-1.5">
                    {doc.specs.slice(0, 3).map((s) => (
                      <div key={s.label} className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">{s.label}:</span>
                        <span className="text-black font-semibold">{s.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Document Tag Pills */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {doc.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Footer Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-400">
                    <span className="text-black font-bold">{doc.size}</span> • {doc.pages}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quick Preview Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-black cursor-pointer shadow-2xs"
                      title="Inspect document specs & details"
                    >
                      <Eye className="size-3.5 text-slate-500" />
                      Preview
                    </button>

                    {/* Direct Download Button */}
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      disabled={isDownloading}
                      className={cn(
                        "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-all cursor-pointer shadow-xs",
                        isDownloading
                          ? "bg-emerald-600 text-white"
                          : "brand-gradient text-black hover:brightness-105"
                      )}
                    >
                      {isDownloading ? (
                        <>
                          <Check className="size-3.5 stroke-[3]" />
                          Ready
                        </>
                      ) : (
                        <>
                          <ArrowDownToLine className="size-3.5" />
                          Download
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
          <ul className="divide-y divide-slate-100">
            {filteredDocs.map((doc) => {
              const isSelected = selectedIds.has(doc.id);
              const isDownloading = downloadingId === doc.id;

              return (
                <li
                  key={doc.id}
                  className={cn(
                    "group flex flex-wrap items-center justify-between gap-4 p-5 transition-all hover:bg-slate-50/80",
                    isSelected && "bg-amber-50/20"
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-[1_1_400px]">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(doc.id)}
                      className="size-4.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer accent-amber-500 shrink-0"
                    />

                    <div className="size-12 shrink-0 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 transition group-hover:scale-105">
                      <FileText className="size-6" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[17px] font-bold text-black transition group-hover:text-brand-600">
                          {doc.title}
                        </span>
                        {doc.isEcoPrint && (
                          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            Eco
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-brand-700 font-semibold truncate">
                        {doc.modelCoverage}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 line-clamp-1">
                        {doc.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="hidden sm:block text-right text-xs">
                      <div className="font-bold text-black">{doc.size}</div>
                      <div className="text-slate-400">{doc.pages} • {doc.version}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <Eye className="size-3.5" />
                        Preview
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownload(doc)}
                        disabled={isDownloading}
                        className={cn(
                          "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-all cursor-pointer shadow-xs",
                          isDownloading
                            ? "bg-emerald-600 text-white"
                            : "brand-gradient text-black hover:brightness-105"
                        )}
                      >
                        {isDownloading ? (
                          <>
                            <Check className="size-3.5 stroke-[3]" />
                            Ready
                          </>
                        ) : (
                          <>
                            <ArrowDownToLine className="size-3.5" />
                            Download
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Zero State if search returns nothing */}
      {filteredDocs.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileText className="mx-auto size-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-bold text-black">No matching documentation found</h3>
          <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto">
            We couldn't find any files matching &quot;{search}&quot;. Try searching for &quot;inverter&quot;, &quot;battery&quot;, or &quot;brochure&quot;.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory("All");
              setSelectedHardware("All");
            }}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-black px-6 text-xs font-semibold text-white transition hover:bg-neutral-800 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Floating Batch Download Dock (Appears when files are selected) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between gap-4 rounded-full border border-slate-900/10 bg-neutral-900/95 px-5 py-3.5 text-white shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-amber-400 font-bold text-black text-xs">
                {selectedIds.size}
              </span>
              <div>
                <div className="text-xs sm:text-sm font-semibold">
                  {selectedIds.size} {selectedIds.size === 1 ? "document" : "documents"} selected
                </div>
                <div className="text-[11px] text-neutral-400 font-medium">
                  {formattedSelectedSize} total download package
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="hidden sm:inline-flex rounded-full px-3 py-1.5 text-xs text-neutral-300 hover:text-white transition cursor-pointer"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={handleBatchDownload}
                disabled={isBatchDownloading}
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold text-black transition hover:brightness-105 cursor-pointer shadow-md"
              >
                {isBatchDownloading ? (
                  <>
                    <span className="size-3 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="size-3.5 stroke-[2.5]" />
                    Download Batch
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Innovative Restricted Technical Vault Section */}
      <section className="mt-14 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-neutral-900 to-black p-8 text-white shadow-xl sm:p-10">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 border border-amber-400/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
              <ShieldCheck className="size-3.5" />
              Restricted Technical Vault
            </div>

            <h3 className="mt-4 text-2xl sm:text-3xl font-bold text-white">
              Installation Manuals, Schematics & Certificates
            </h3>

            <p className="mt-3 text-sm sm:text-base leading-relaxed text-neutral-300 font-medium">
              Single-line wiring diagrams, Central Electricity Authority (CEA) type tests, and firmware communication protocols are shared exclusively with certified channel partners and for active project tenders.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/channel-partners"
                className="brand-gradient inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-xs sm:text-sm font-bold text-black transition hover:brightness-105"
              >
                Access Partner Portal
              </Link>
              <Link
                href="/service-request"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-neutral-700 bg-white/5 px-6 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Request Tender Documentation
              </Link>
            </div>
          </div>

          {/* Locked Document Previews */}
          <div className="flex-1 max-w-lg w-full">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
              <Lock className="size-3 text-amber-400" />
              Protected Documents Catalogue
            </div>

            <div className="grid gap-2.5">
              {LOCKED_DOCS.map((doc) => (
                <div
                  key={doc.id}
                  className="group flex items-center justify-between gap-3 rounded-2xl bg-white/5 border border-white/10 p-3.5 transition hover:bg-white/10"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors truncate">
                      {doc.title}
                    </div>
                    <div className="text-xs text-neutral-400 truncate">
                      {doc.description}
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                    {doc.requirement}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* In-Browser Document Quick-View Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewDoc(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setPreviewDoc(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-black transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="size-5" />
            </button>

            {/* Document Header */}
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-xs font-bold text-brand-700">
                {previewDoc.category}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {previewDoc.version} • {previewDoc.updated}
              </span>
            </div>

            <h3 className="mt-3 text-xl sm:text-2xl font-bold text-black">
              {previewDoc.title}
            </h3>

            <div className="mt-1 text-sm font-semibold text-brand-700">
              Coverage: {previewDoc.modelCoverage}
            </div>

            <p className="mt-3 text-sm leading-relaxed text-slate-600 font-medium">
              {previewDoc.description}
            </p>

            {/* Key Specifications Grid */}
            <div className="mt-6">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Document Technical Summary
              </div>
              <div className="grid grid-cols-2 gap-2.5 rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs">
                {previewDoc.specs.map((s) => (
                  <div key={s.label}>
                    <div className="text-slate-500 font-medium">{s.label}</div>
                    <div className="text-black font-bold mt-0.5">{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="mt-5 flex flex-wrap gap-2">
              {previewDoc.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-500">
                File Size: <span className="text-black font-bold">{previewDoc.size}</span> ({previewDoc.pages})
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={previewDoc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-xs sm:text-sm font-semibold text-black hover:bg-slate-50 transition"
                >
                  <ExternalLink className="size-4" />
                  Open in New Tab
                </a>

                <button
                  type="button"
                  onClick={() => {
                    handleDownload(previewDoc);
                    setPreviewDoc(null);
                  }}
                  className="brand-gradient inline-flex h-11 items-center gap-2 rounded-full px-6 text-xs sm:text-sm font-bold text-black hover:brightness-105 transition shadow-sm cursor-pointer"
                >
                  <Download className="size-4" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
