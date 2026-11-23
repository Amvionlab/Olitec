"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  ArrowUpRight,
  Sun,
  Zap,
  Fuel,
  Info,
} from "lucide-react";
import { cn } from "@/lib/cn";

export interface ApplicationData {
  id: string;
  title: string;
  shortTitle: string;
  tagline: string;
  challenge: string;
  inverterModel: string;
  inverterSlug: string;
  batteryModel: string;
  batterySlug: string;
  system: readonly string[];
  outcome: readonly string[];
  loadLabel: string;
  loadDetail: string;
  gridType: string;
  gridDescription: string;
  hasGenerator: boolean;
  generatorDesc: string;
}

export const APPLICATIONS: ApplicationData[] = [
  {
    id: "homes",
    title: "Homes and small businesses",
    shortTitle: "Homes & Clinics",
    tagline: "Uninterrupted power for everyday life",
    challenge:
      "Frequent outages, voltage swings and rising tariffs make grid-only supply unreliable and expensive for homes, shops and clinics.",
    inverterModel: "OLI-1H Single-Phase (3 – 6 kW)",
    inverterSlug: "powermax-1100-inverter",
    batteryModel: "OLB-5.12 LFP Battery (5.12 kWh)",
    batterySlug: "tubular-150ah-battery",
    system: [
      "OLI-1H single-phase hybrid inverter, 3 to 6 kW",
      "One to four OLB-5.12 battery packs",
      "Solar array sized up to 200% of inverter rating",
    ],
    outcome: [
      "Essential loads stay on through outages, with switch-over in under 10 ms",
      "Solar powers the day and stored energy covers the evening peak",
      "Monitoring and scheduling from a mobile app",
    ],
    loadLabel: "Home & Clinic Loads",
    loadDetail: "Lighting, Refrigerator, Fans & Air Conditioning",
    gridType: "Utility Grid (230V)",
    gridDescription: "Grid charges battery during off-peak and supplies deficit",
    hasGenerator: true,
    generatorDesc: "Optional portable generator backup",
  },
  {
    id: "remote",
    title: "Remote locations and off-grid sites",
    shortTitle: "Remote & Off-grid",
    tagline: "Reliable power where the grid does not reach",
    challenge:
      "Farms, borewell pumps, eco-resorts, quarries and construction camps often depend on a diesel generator that is costly to run and to refuel.",
    inverterModel: "OLI-1H / OLI-3H Hybrid Inverter",
    inverterSlug: "powermax-1100-inverter",
    batteryModel: "OLB-5.12 Multi-Pack Bank (10 – 30 kWh)",
    batterySlug: "tubular-150ah-battery",
    system: [
      "OLI-1H or OLI-3H hybrid inverter, matched to the load",
      "OLB-5.12 storage sized for overnight and cloudy-day autonomy",
      "Diesel generator retained as a backup source",
    ],
    outcome: [
      "Solar and storage carry the daily load; the generator runs only when needed",
      "Lower fuel use, fewer refuelling trips and quieter sites",
      "Remote monitoring reduces visits by service teams",
    ],
    loadLabel: "Borewells & Field Pumps",
    loadDetail: "Submersible pumps, lighting, refrigeration & power tools",
    gridType: "No Grid Connection",
    gridDescription: "100% autonomous off-grid micro-generation",
    hasGenerator: true,
    generatorDesc: "Automatic generator start/stop on low battery SOC",
  },
  {
    id: "mobile",
    title: "Camper vans and mobile power",
    shortTitle: "Camper Vans & Mobile",
    tagline: "Solar, battery and generator in one compact system",
    challenge:
      "Camper vans, mobile clinics, broadcast vans and outdoor event units need silent, clean power on the move and at remote halts.",
    inverterModel: "Compact OLI-1H (3 to 3.6 kW)",
    inverterSlug: "powermax-1100-inverter",
    batteryModel: "OLB-5.12R Rack-Mount LFP Pack",
    batterySlug: "tubular-150ah-battery",
    system: [
      "Compact OLI-1H hybrid inverter, 3 to 3.6 kW",
      "OLB-5.12R rack-mount batteries in a ventilated compartment",
      "Roof-mounted solar panels with a portable generator or shore supply as backup",
    ],
    outcome: [
      "Silent power for appliances, lighting and equipment while parked",
      "Solar recharges the battery during the day; the generator tops up only when required",
      "Shore power from a campsite or depot charges the system automatically",
    ],
    loadLabel: "Van Living & Equipment",
    loadDetail: "Induction stove, air conditioning, lights & media gear",
    gridType: "Camp / Depot Shore Power",
    gridDescription: "Automatic shore supply hookup whenever plugged in",
    hasGenerator: true,
    generatorDesc: "Compact portable inverter generator",
  },
  {
    id: "defence",
    title: "Defence and border installations",
    shortTitle: "Defence Installations",
    tagline: "Resilient power for critical outposts",
    challenge:
      "Forward posts, border outposts and surveillance stations need dependable power in harsh climates, with minimal fuel logistics and maintenance.",
    inverterModel: "OLI-1H / OLI-3H Rugged IP66 Inverter",
    inverterSlug: "powermax-1100-inverter",
    batteryModel: "OLB-5.12 Extreme-Temp LFP Array",
    batterySlug: "tubular-150ah-battery",
    system: [
      "OLI-1H or OLI-3H hybrid inverters, IP66 rated for outdoor mounting",
      "OLB-5.12 storage installed in a protected shelter",
      "Solar array with diesel generator integration",
    ],
    outcome: [
      "Continuous power for communications, surveillance and living quarters",
      "Reduced dependence on fuel convoys to remote locations",
      "Wide operating temperature range from minus 20 to 60 °C on the inverter",
    ],
    loadLabel: "Surveillance & Living Quarters",
    loadDetail: "Thermal imaging, radar, tactical comms & base heating",
    gridType: "Tactical Supply / Standalone",
    gridDescription: "Hardened isolated infrastructure without civilian feeder",
    hasGenerator: true,
    generatorDesc: "Integrated military diesel genset",
  },
  {
    id: "microgrid",
    title: "Microgrids for hill and remote settlements",
    shortTitle: "Remote Microgrids",
    tagline: "Community power for villages beyond the grid",
    challenge:
      "Hill hamlets, island communities and remote settlements are often served by long, unreliable feeder lines or by no grid at all.",
    inverterModel: "Parallel OLI-3H Cluster (up to 180 kW)",
    inverterSlug: "powermax-1100-inverter",
    batteryModel: "High-Capacity Community LFP Bank",
    batterySlug: "tubular-150ah-battery",
    system: [
      "Three-phase OLI-3H hybrid inverters in parallel, up to 180 kW",
      "Battery bank sized for community night-time demand",
      "Ground-mount solar plant with optional generator backup",
    ],
    outcome: [
      "Round-the-clock power for homes, schools, health centres and small enterprises",
      "Local generation removes the losses and faults of long feeder lines",
      "A system that can grow as the settlement grows",
    ],
    loadLabel: "Village & Health Centre",
    loadDetail: "Streetlights, vaccine chillers, classrooms & community grain mills",
    gridType: "Isolated Community Grid",
    gridDescription: "Shared local AC mini-grid reticulated to all households",
    hasGenerator: true,
    generatorDesc: "Central community emergency genset",
  },
  {
    id: "ci",
    title: "Commercial and industrial sites",
    shortTitle: "Commercial & Industrial",
    tagline: "Lower demand charges and protected operations",
    challenge:
      "Factories, hospitals, cold stores and commercial buildings face peak demand charges and costly downtime when the supply fails.",
    inverterModel: "OLI-3H Three-Phase Inverter (15 – 30 kW)",
    inverterSlug: "powermax-1100-inverter",
    batteryModel: "High-Voltage Industrial LFP Storage",
    batterySlug: "tubular-150ah-battery",
    system: [
      "OLI-3H three-phase hybrid inverters, 15 to 30 kW each",
      "High-voltage battery storage",
      "Rooftop or ground-mount solar with generator integration",
    ],
    outcome: [
      "Peak shaving to stay within contracted demand",
      "Critical equipment protected through outages",
      "Reduced generator run hours and fuel costs",
    ],
    loadLabel: "Machinery & Cold Stores",
    loadDetail: "CNC mills, cooling compressors, diagnostic labs & elevators",
    gridType: "3-Phase HT / LT Grid (415V)",
    gridDescription: "Synchronized dual-feed grid with peak demand shaving",
    hasGenerator: true,
    generatorDesc: "High-kva industrial diesel backup system",
  },
];

type FlowMode = "day" | "night" | "outage" | "generator";

/**
 * Authentic application SVGs directly matching Olitec HTML specification.
 */
function ApplicationSvgIcon({ id, className }: { id: string; className?: string }) {
  switch (id) {
    case "homes":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M3 11l9-8 9 8v10H3z" />
          <path d="M9 21v-6h6v6" />
        </svg>
      );
    case "remote":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      );
    case "mobile":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M2 16V7a2 2 0 012-2h11l5 5v6" />
          <path d="M2 16h20" />
          <circle cx="7" cy="17.5" r="2" />
          <circle cx="17" cy="17.5" r="2" />
          <path d="M5 5V3h8v2M15 5v5h5" />
        </svg>
      );
    case "defence":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "microgrid":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M2 20l7-12 4 7 3-4 6 9z" />
          <path d="M7 11l2 2 2-2" />
          <circle cx="18" cy="5" r="2" />
        </svg>
      );
    case "ci":
    default:
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M2 21V10l6 4V10l6 4V6h8v15z" />
          <path d="M6 17h2M11 17h2M17 17h2" />
        </svg>
      );
  }
}

export function InteractiveApplicationExplorer() {
  const [activeAppId, setActiveAppId] = useState("homes");
  const [mode, setMode] = useState<FlowMode>("day");
  const [selectedBox, setSelectedBox] = useState<string | null>("inverter");

  const app = APPLICATIONS.find((a) => a.id === activeAppId) || APPLICATIONS[0];

  return (
    <div className="w-full space-y-8">
      {/* 1. Six-Pill Selector Row (Item M11) */}
      <div className="flex items-center justify-start overflow-x-auto pb-2 scrollbar-none sm:justify-center">
        <nav
          aria-label="Application categories"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white p-1.5 shadow-[0_4px_16px_rgb(0_0_0/0.04)]"
        >
          {APPLICATIONS.map((item) => {
            const isSelected = item.id === activeAppId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveAppId(item.id);
                  setSelectedBox("inverter");
                }}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-xs sm:text-[13.5px] font-semibold transition-all duration-200",
                  isSelected
                    ? "bg-[#121C28] text-white shadow-sm"
                    : "text-[#2B3645] hover:bg-[#FFF6EA] hover:text-[#B85E0E]",
                )}
              >
                <ApplicationSvgIcon
                  id={item.id}
                  className={cn("size-4 shrink-0", isSelected ? "text-[#E0761B]" : "text-slate-500")}
                />
                <span>{item.shortTitle}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 2. Unified Master Details Panel (Item M11: Details in one panel, no long scroll) */}
      <div className="relative overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-[0_12px_44px_rgb(0_0_0/0.05)]">
        <div className="grid lg:grid-cols-12 items-stretch divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* Left Column: Specifications, Challenge & Outcomes */}
          <div className="lg:col-span-5 p-6 sm:p-8 xl:p-10 flex flex-col justify-between bg-gradient-to-b from-white to-[#FDFBF7]">
            <div>
              {/* Category Eyebrow */}
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#FFF1DF] text-[#B85E0E]">
                  <ApplicationSvgIcon id={app.id} className="size-4.5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#B85E0E]">
                  Application Scenario
                </span>
              </div>

              {/* Title & Green Benefit Statement */}
              <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-[#121C28] leading-[1.18]">
                {app.title}
              </h2>
              <p className="mt-1.5 text-[15px] sm:text-base font-semibold text-[#1F7A34]">
                {app.tagline}
              </p>

              {/* The Challenge Box */}
              <div className="mt-6 rounded-2xl border border-[#F1D7B5] bg-[#FFFBF4] p-4.5 sm:p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#B85E0E] flex items-center gap-1.5 mb-1.5">
                  <Info className="size-3.5" />
                  <span>The Real-World Challenge</span>
                </h3>
                <p className="text-[13.5px] sm:text-[14px] leading-relaxed text-slate-700">
                  {app.challenge}
                </p>
              </div>

              {/* Olitec System Specification */}
              <div className="mt-6 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Engineered Hardware Configuration
                </h4>
                <ul className="space-y-2.5">
                  {app.system.map((spec, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-slate-700">
                      <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[#B85E0E] text-[10px] font-bold">
                        {i + 1}
                      </span>
                      <span className="font-medium leading-snug">{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Proven Outcomes */}
              <div className="mt-6 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Reliability Outcomes
                </h4>
                <ul className="space-y-2.5">
                  {app.outcome.map((outc, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-slate-800">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#1F7A34]" />
                      <span className="font-medium leading-snug">{outc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Talk to our engineers CTA */}
            <div className="mt-8 pt-6 border-t border-slate-200/80">
              <Link
                href="/homes-and-businesses"
                className="group inline-flex w-full items-center justify-between rounded-full bg-[#1F7A34] px-6 py-3.5 text-xs sm:text-[14px] font-bold text-white shadow-[0_8px_20px_rgb(31_122_52/0.22)] transition hover:bg-[#186429] hover:shadow-[0_10px_25px_rgb(31_122_52/0.32)] active:scale-98"
              >
                <span>Talk to our engineers for your site</span>
                <span className="flex size-7 items-center justify-center rounded-full bg-white text-[#1F7A34] transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowUpRight className="size-4" strokeWidth={2.5} />
                </span>
              </Link>
            </div>
          </div>

          {/* Right Column: Live Interactive Animated Power Flow Diagram (Item M11) */}
          <div className="lg:col-span-7 p-6 sm:p-8 xl:p-10 flex flex-col justify-between bg-gradient-to-br from-[#FAFCFF] via-white to-[#F5F8FC]">
            {/* Diagram Header & Mode Buttons */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex size-2.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      Live Power Flow Topology
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click mode to view real-time energy routing and load dispatch
                  </p>
                </div>

                {/* 4 Mode Buttons */}
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setMode("day")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                      mode === "day"
                        ? "bg-[#121C28] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60",
                    )}
                    title="Solar generating and charging storage"
                  >
                    Day
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("night")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                      mode === "night"
                        ? "bg-[#121C28] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60",
                    )}
                    title="Battery supplying evening load"
                  >
                    Night
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("outage")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                      mode === "outage"
                        ? "bg-[#121C28] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60",
                    )}
                    title="Zero grid, instant battery UPS"
                  >
                    {activeAppId === "mobile" ? "Unplugged" : "Power Cut"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("generator")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                      mode === "generator"
                        ? "bg-[#121C28] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60",
                    )}
                    title="Generator supplement on high demand"
                  >
                    Genset
                  </button>
                </div>
              </div>

              {/* Mode Description Banner */}
              <div className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5 border border-slate-200/80 text-[12px] flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800">
                  {mode === "day" && "Day Mode: Solar PV generation powers active loads and stores surplus into the LFP battery bank."}
                  {mode === "night" && "Night Mode: Stored energy from the Olitec battery bank powers evening loads silently."}
                  {mode === "outage" && "Power Cut / Backup: Sub-10ms UPS switchover guarantees zero flicker or reset for connected loads."}
                  {mode === "generator" && "Genset Hybrid: Backup generator supplements peak demand; inverter optimizes fuel efficiency."}
                </span>
                <span className="shrink-0 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Active
                </span>
              </div>

              {/* Animated Interactive Diagram Canvas */}
              <div className="relative mt-6 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-inner min-h-[380px] flex flex-col justify-between overflow-hidden">
                {/* SVG Flow Arrows & Animated Moving Dots */}
                <svg
                  className="pointer-events-none absolute inset-0 size-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="flowGradActive" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#E0761B" />
                      <stop offset="100%" stopColor="#1F7A34" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Flow lines with animated dashes */}
                  {/* Solar -> Inverter */}
                  <line
                    x1="22%"
                    y1="22%"
                    x2="50%"
                    y2="48%"
                    stroke={mode === "day" ? "#F59E0B" : "#E2E8F0"}
                    strokeWidth={mode === "day" ? "3" : "1.5"}
                    strokeDasharray={mode === "day" ? "6 6" : "none"}
                    className={mode === "day" ? "animate-flow" : ""}
                  />

                  {/* Supply / Grid -> Inverter */}
                  <line
                    x1="78%"
                    y1="22%"
                    x2="50%"
                    y2="48%"
                    stroke={mode === "day" || mode === "night" ? "#0284C7" : "#E2E8F0"}
                    strokeWidth={mode === "day" || mode === "night" ? "2.5" : "1.5"}
                    strokeDasharray={mode === "day" || mode === "night" ? "6 6" : "none"}
                    className={mode === "day" || mode === "night" ? "animate-flow" : ""}
                  />

                  {/* Inverter -> Battery (Bidirectional) */}
                  <line
                    x1="50%"
                    y1="52%"
                    x2="24%"
                    y2="82%"
                    stroke={mode === "day" || mode === "night" || mode === "outage" ? "#10B981" : "#E2E8F0"}
                    strokeWidth={mode !== "generator" ? "3" : "1.5"}
                    strokeDasharray="6 6"
                    className="animate-flow"
                  />

                  {/* Inverter -> Loads */}
                  <line
                    x1="50%"
                    y1="52%"
                    x2="76%"
                    y2="82%"
                    stroke="#EA580C"
                    strokeWidth="3"
                    strokeDasharray="6 6"
                    className="animate-flow"
                  />

                  {/* Generator -> Inverter */}
                  <line
                    x1="50%"
                    y1="12%"
                    x2="50%"
                    y2="42%"
                    stroke={mode === "generator" ? "#D97706" : "#E2E8F0"}
                    strokeWidth={mode === "generator" ? "3" : "1"}
                    strokeDasharray={mode === "generator" ? "6 6" : "none"}
                    className={mode === "generator" ? "animate-flow" : ""}
                  />
                </svg>

                {/* Top Row: Solar PV, Generator & Supply */}
                <div className="relative z-10 grid grid-cols-3 gap-3 items-start">
                  {/* Solar PV Node */}
                  <button
                    type="button"
                    onClick={() => setSelectedBox("solar")}
                    className={cn(
                      "flex flex-col items-center rounded-xl p-2.5 transition text-center border",
                      selectedBox === "solar"
                        ? "border-[#121C28] bg-slate-50 shadow-sm ring-1 ring-[#121C28]/20"
                        : "border-slate-200/90 bg-white hover:border-slate-400",
                    )}
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                      <Sun className="size-5" />
                    </div>
                    <span className="mt-1 text-xs font-bold text-slate-900">Solar PV Array</span>
                    <span className="text-[10px] text-slate-600 font-medium mt-0.5">
                      {mode === "day" ? "Generating (Active)" : "Idle (Zero Lux)"}
                    </span>
                  </button>

                  {/* Generator Node */}
                  <button
                    type="button"
                    onClick={() => setSelectedBox("generator")}
                    className={cn(
                      "flex flex-col items-center rounded-xl p-2.5 transition text-center border",
                      selectedBox === "generator"
                        ? "border-[#121C28] bg-slate-50 shadow-sm ring-1 ring-[#121C28]/20"
                        : "border-slate-200/90 bg-white hover:border-slate-400",
                    )}
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                      <Fuel className="size-5" />
                    </div>
                    <span className="mt-1 text-xs font-bold text-slate-900">Backup Genset</span>
                    <span className="text-[10px] text-slate-600 font-medium mt-0.5">
                      {mode === "generator" ? "Running · Sync" : "Standby"}
                    </span>
                  </button>

                  {/* Supply / Grid Node (Adapts to application) */}
                  <button
                    type="button"
                    onClick={() => setSelectedBox("grid")}
                    className={cn(
                      "flex flex-col items-center rounded-xl p-2.5 transition text-center border",
                      selectedBox === "grid"
                        ? "border-[#121C28] bg-slate-50 shadow-sm ring-1 ring-[#121C28]/20"
                        : "border-slate-200/90 bg-white hover:border-slate-400",
                    )}
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                      <Zap className="size-5" />
                    </div>
                    <span className="mt-1 text-xs font-bold text-slate-900">{app.gridType}</span>
                    <span className="text-[10px] text-slate-600 font-medium mt-0.5">
                      {mode === "outage" ? "Disconnected (0V)" : "Connected"}
                    </span>
                  </button>
                </div>

                {/* Middle Center: The Olitec Hybrid Inverter (Item M11: 3D-rendered product image) */}
                <div className="relative z-10 flex justify-center py-4">
                  <div
                    onClick={() => setSelectedBox("inverter")}
                    className={cn(
                      "cursor-pointer group flex flex-col items-center rounded-2xl border p-4 bg-white transition shadow-sm max-w-[240px] w-full text-center",
                      selectedBox === "inverter"
                        ? "border-[#121C28] ring-2 ring-slate-200 shadow-md"
                        : "border-slate-300 hover:border-slate-500",
                    )}
                  >
                    <div className="relative size-20 sm:size-24 mb-1">
                      <Image
                        src="/images/products/inverter-render.png"
                        alt="Olitec Hybrid Inverter"
                        fill
                        className="object-contain transition-transform group-hover:scale-105"
                      />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Core Converter
                    </span>
                    <h4 className="text-xs sm:text-[13px] font-bold text-slate-900">
                      {app.inverterModel.split("(")[0]}
                    </h4>
                    <span className="text-[10px] text-slate-500">
                      Pure Sine Wave · Sub-10ms UPS
                    </span>
                    <Link
                      href={`/products`}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#E0761B] hover:text-[#B85E0E] underline"
                    >
                      <span>View product</span>
                      <ArrowUpRight className="size-3" />
                    </Link>
                  </div>
                </div>

                {/* Bottom Row: Olitec Battery & Targeted Loads */}
                <div className="relative z-10 grid grid-cols-2 gap-4 items-end">
                  {/* Olitec Battery Node (Item M11: 3D-rendered product image) */}
                  <div
                    onClick={() => setSelectedBox("battery")}
                    className={cn(
                      "cursor-pointer group flex flex-col items-center rounded-2xl border p-3.5 bg-white transition shadow-sm text-center",
                      selectedBox === "battery"
                        ? "border-[#121C28] ring-2 ring-slate-200 shadow-md"
                        : "border-slate-300 hover:border-slate-500",
                    )}
                  >
                    <div className="relative size-16 sm:size-18 mb-1">
                      <Image
                        src="/images/products/battery-render.png"
                        alt="Olitec LFP Battery"
                        fill
                        className="object-contain transition-transform group-hover:scale-105"
                      />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      LFP Storage
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">
                      {app.batteryModel.split("(")[0]}
                    </h4>
                    <span className="text-[10px] text-slate-600 font-medium">
                      {mode === "day" ? "Charging (+1.8 kW)" : mode === "night" ? "Discharging (92% SOC)" : "UPS Active"}
                    </span>
                    <Link
                      href={`/products`}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-[#E0761B] hover:text-[#B85E0E] underline"
                    >
                      <span>View product</span>
                      <ArrowUpRight className="size-3" />
                    </Link>
                  </div>

                  {/* Application-Specific Load Node */}
                  <button
                    type="button"
                    onClick={() => setSelectedBox("loads")}
                    className={cn(
                      "flex flex-col items-center rounded-2xl border p-3.5 transition text-center",
                      selectedBox === "loads"
                        ? "border-[#121C28] bg-slate-50 shadow-sm ring-1 ring-[#121C28]/20"
                        : "border-slate-200/90 bg-white hover:border-slate-400",
                    )}
                  >
                    <div className="flex size-14 items-center justify-center rounded-xl bg-slate-100 text-slate-800 mb-1">
                      <ApplicationSvgIcon id={app.id} className="size-8" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Application Loads
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{app.loadLabel}</h4>
                    <span className="text-[10px] text-slate-500 line-clamp-1">
                      {app.loadDetail}
                    </span>
                    <span className="mt-1 text-[10px] font-bold text-slate-700">
                      230V / 415V Powered 24/7
                    </span>
                  </button>
                </div>
              </div>

              {/* Bottom Details Chip (Item M11: Clicking a box shows what Olitec supplies there) */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all duration-200">
                <div className="flex items-start gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#121C28] text-white text-xs font-bold">
                    ✓
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">
                      {selectedBox === "inverter" && `Olitec Supplies: ${app.inverterModel}`}
                      {selectedBox === "battery" && `Olitec Supplies: ${app.batteryModel}`}
                      {selectedBox === "solar" && "Olitec Supplies: Tier-1 High-Efficiency Mono-PERC / TOPCon Solar PV Modules"}
                      {selectedBox === "grid" && `Grid Interface: ${app.gridDescription}`}
                      {selectedBox === "generator" && `Generator Sync: ${app.generatorDesc}`}
                      {selectedBox === "loads" && `Load Protection: Continuous clean power delivered to ${app.loadDetail}`}
                    </p>
                    <p className="mt-0.5 text-slate-600 leading-relaxed">
                      {selectedBox === "inverter" &&
                        "Engineered for harsh Indian grid dynamics: supports wide input range, fast MPPT tracking, full phase-imbalance tolerance, and silent convection cooling."}
                      {selectedBox === "battery" &&
                        "Prismatic Lithium Iron Phosphate (LiFePO4) chemistry with intelligent active BMS protection against thermal runaway, short-circuit, and deep discharge."}
                      {selectedBox === "solar" &&
                        "Certified solar arrays matched precisely to inverter DC oversizing limits (up to 200%), maximizing power harvest in early morning and cloudy weather."}
                      {selectedBox === "grid" &&
                        "Anti-islanding and bidirectional synchronization ensure zero feedback during line maintenance and seamless energy arbitrage during time-of-use tariffs."}
                      {selectedBox === "generator" &&
                        "Smart dry-contact trigger automatically starts the generator during low battery reserve or extreme loads, shutting it down as soon as solar or battery recovers."}
                      {selectedBox === "loads" &&
                        "Sensitive electronics, clinical diagnostic machinery, induction equipment, and motors run without voltage drops, harmonics, or sudden interruptions."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
