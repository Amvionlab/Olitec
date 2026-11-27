"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Droplets, Factory, Fuel, House, Houses, Plug, SolarPanel, TowerControl, UtilityPole, Van, type LucideIcon } from "lucide-react";
import { applicationsPage } from "@/content/pages";
import { cn } from "@/lib/cn";

/**
 * Item M11: Applications page, built to the Applications sample page.
 * Six pills; clicking one changes the panel in place. Left: name, one-line benefit, the
 * challenge, the outcomes and "Talk to our engineers". Right: a live diagram (not a GIF or a
 * video) with mode buttons and moving dots; clicking a box shows what Olitec supplies there.
 */

type Mode = "day" | "night" | "powercut" | "plugged" | "generator";
type NodeKey = "solar" | "supply" | "inverter" | "battery" | "generator" | "loads";

const modeLabel: Record<Mode, string> = {
  day: "Day",
  night: "Night",
  powercut: "Power cut",
  plugged: "Plugged in",
  generator: "Generator",
};

const caption: Record<Mode, string> = {
  day: "Solar runs the loads first and the surplus charges the battery.",
  night: "Stored solar energy from the battery carries the loads.",
  powercut: "The grid fails. Loads move to battery backup in under 10 ms, with no interruption.",
  plugged: "Shore power from a campsite or depot runs the loads and recharges the battery.",
  generator: "When solar and battery are low, the generator runs the loads and tops up the battery, then switches off.",
};

interface AppDiagram {
  modes: Mode[];
  supply?: { label: string; icon: LucideIcon; detail: string };
  generator?: string;
  solar: string;
  loads: { label: string; icon: LucideIcon; detail: string };
  inverterRender: string;
  inverterHref: string;
  batteryHref: string;
}

const GRID_DETAIL = "Utility supply. The inverter manages import, export and backup automatically.";

const diagrams: Record<string, AppDiagram> = {
  homes: {
    modes: ["day", "night", "powercut"],
    supply: { label: "Grid", icon: UtilityPole, detail: GRID_DETAIL },
    solar: "Solar array sized up to 200 % of the inverter rating",
    loads: { label: "Home loads", icon: House, detail: "Lights, fans, appliances and essential circuits" },
    inverterRender: "/images/models/oli-1h-preview.webp",
    inverterHref: "/products/oli-1h-series-3-6kw",
    batteryHref: "/products/olb-512-lfp-battery-wall",
  },
  remote: {
    modes: ["day", "night", "generator"],
    generator: "Diesel generator retained as a backup source",
    solar: "Solar array sized for the daily load",
    loads: { label: "Site loads", icon: Droplets, detail: "Pumps, lighting, tools and site equipment" },
    inverterRender: "/images/models/oli-1h-preview.webp",
    inverterHref: "/products",
    batteryHref: "/products/olb-512-lfp-battery-wall",
  },
  mobile: {
    modes: ["day", "night", "plugged", "generator"],
    supply: { label: "Shore power", icon: Plug, detail: "Shore supply from a campsite or depot, when available." },
    generator: "Portable generator as backup",
    solar: "Roof-mounted solar panels",
    loads: { label: "Vehicle loads", icon: Van, detail: "Appliances, lighting and on-board equipment" },
    inverterRender: "/images/models/oli-1h-preview.webp",
    inverterHref: "/products/oli-1h-series-3-6kw",
    batteryHref: "/products/olb-512-lfp-battery-wall",
  },
  defence: {
    modes: ["day", "night", "generator"],
    generator: "Diesel generator, integrated with the inverter",
    solar: "Solar array with diesel generator integration",
    loads: { label: "Outpost loads", icon: TowerControl, detail: "Communications, surveillance and living quarters" },
    inverterRender: "/images/models/oli-3h-preview.webp",
    inverterHref: "/products",
    batteryHref: "/products/olb-512-lfp-battery-wall",
  },
  microgrid: {
    modes: ["day", "night", "generator"],
    generator: "Optional generator backup",
    solar: "Ground-mount solar plant",
    loads: { label: "Village loads", icon: Houses, detail: "Homes, schools, health centres and small enterprises" },
    inverterRender: "/images/models/oli-3h-preview.webp",
    inverterHref: "/products/oli-3h-series-15-30kw",
    batteryHref: "/products/olb-512-lfp-battery-wall",
  },
  ci: {
    modes: ["day", "night", "powercut", "generator"],
    supply: { label: "Grid", icon: UtilityPole, detail: GRID_DETAIL },
    generator: "Diesel generator, integrated with the inverter",
    solar: "Rooftop or ground-mount solar",
    loads: { label: "Plant loads", icon: Factory, detail: "Production lines, cold rooms and critical equipment" },
    inverterRender: "/images/models/oli-3h-preview.webp",
    inverterHref: "/products/oli-3h-series-15-30kw",
    batteryHref: "/products/olb-512-lfp-battery-wall",
  },
};

/** Which links carry power in each mode, and which sources are off. */
function flows(mode: Mode) {
  const active = new Set<string>(["inverter-loads"]);
  const off = new Set<NodeKey>();
  if (mode === "day") active.add("solar-inverter").add("inverter-battery");
  if (mode === "night") {
    active.add("battery-inverter");
    off.add("solar");
  }
  if (mode === "powercut") active.add("solar-inverter").add("battery-inverter");
  if (mode === "plugged") active.add("supply-inverter").add("inverter-battery").add("solar-inverter");
  if (mode === "generator") active.add("generator-inverter").add("inverter-battery");
  return { active, off, gridFailed: mode === "powercut" };
}

/* Diagram geometry in a 520 × 330 box. */
const POS: Record<NodeKey, { x: number; y: number }> = {
  solar: { x: 90, y: 50 },
  supply: { x: 430, y: 50 },
  inverter: { x: 260, y: 150 },
  battery: { x: 90, y: 270 },
  generator: { x: 260, y: 285 },
  loads: { x: 430, y: 270 },
};

function linkPath(a: NodeKey, b: NodeKey) {
  const p = POS[a];
  const q = POS[b];
  const mx = (p.x + q.x) / 2;
  return `M${p.x} ${p.y} C ${mx} ${p.y}, ${mx} ${q.y}, ${q.x} ${q.y}`;
}

function Tick() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1F7A34" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mt-[3px] shrink-0">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function ApplicationExplorer() {
  const items = applicationsPage.items;
  const [activeId, setActiveId] = useState<string>(items[0].id);
  const [mode, setMode] = useState<Mode>("day");
  const [selected, setSelected] = useState<NodeKey>("inverter");

  const choose = (id: string) => {
    setActiveId(id);
    setMode("day");
    setSelected("inverter");
  };

  const item = items.find((i) => i.id === activeId) ?? items[0];
  const d = diagrams[item.id];
  const { active, off, gridFailed } = flows(mode);

  const nodes: NodeKey[] = ["solar", ...(d.supply ? (["supply"] as NodeKey[]) : []), "inverter", "battery", ...(d.generator ? (["generator"] as NodeKey[]) : []), "loads"];
  const links: [NodeKey, NodeKey][] = [
    ["solar", "inverter"],
    ...(d.supply ? ([["supply", "inverter"]] as [NodeKey, NodeKey][]) : []),
    ["inverter", "battery"],
    ...(d.generator ? ([["generator", "inverter"]] as [NodeKey, NodeKey][]) : []),
    ["inverter", "loads"],
  ];

  const detail: Record<NodeKey, { label: string; text: string; href?: string }> = {
    solar: { label: "Solar", text: d.solar },
    supply: { label: "Supply", text: d.supply?.detail ?? "" },
    inverter: { label: "Olitec inverter", text: item.system[0], href: d.inverterHref },
    battery: { label: "Olitec battery", text: item.system[1], href: d.batteryHref },
    generator: { label: "Generator", text: d.generator ?? "" },
    loads: { label: "Loads", text: d.loads.detail },
  };
  const shown = detail[selected];

  const nodeLabel: Record<NodeKey, string> = {
    solar: "Solar",
    supply: d.supply?.label ?? "",
    inverter: "Olitec hybrid inverter",
    battery: "Olitec battery",
    generator: "Generator",
    loads: d.loads.label,
  };

  const renderNodeArt = (k: NodeKey) => {
    const cls = "size-6 text-[#161E2C]";
    if (k === "solar") return <SolarPanel className={cls} aria-hidden />;
    if (k === "supply") {
      const Icon = d.supply!.icon;
      return <Icon className={cls} aria-hidden />;
    }
    if (k === "generator") return <Fuel className={cls} aria-hidden />;
    if (k === "loads") {
      const Icon = d.loads.icon;
      return <Icon className={cls} aria-hidden />;
    }
    if (k === "inverter")
      return <Image src={d.inverterRender} alt="" width={401} height={555} className="h-9 w-auto sm:h-[52px]" sizes="40px" />;
    return <Image src="/images/models/olb-battery-preview.webp" alt="" width={313} height={597} className="h-9 w-auto sm:h-[52px]" sizes="30px" />;
  };

  return (
    <div>
      {/* Six application pills */}
      <div className="flex flex-wrap gap-2.5" role="tablist" aria-label="Applications">
        {items.map((i) => {
          const on = i.id === activeId;
          return (
            <button
              key={i.id}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`app-panel-${i.id}`}
              onClick={() => choose(i.id)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[13.5px] font-medium transition",
                on ? "border-[#161E2C] bg-[#161E2C] text-white" : "border-[#E2DED5] bg-white text-[#161E2C] hover:border-[#161E2C]",
              )}
            >
              <span className={cn("size-1.5 rounded-full", on ? "bg-[#F3BE48]" : "bg-[#E8962C]")} aria-hidden />
              {i.title}
            </button>
          );
        })}
      </div>

      {/* Details in one panel */}
      <div className="mt-6 rounded-[28px] border border-[#ECE7DD] bg-white p-5 shadow-[0_18px_44px_rgb(22_30_44/0.06)] sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-10">
          {/* Left: the text of every application is in the page (inactive ones hidden), so it is readable without the diagram */}
          <div>
            {items.map((i) => (
              <div key={i.id} id={`app-panel-${i.id}`} role="tabpanel" hidden={i.id !== activeId}>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#D45C0A]">Application</p>
                <h2 className="mt-2 text-[26px] font-bold leading-tight text-[#161E2C] sm:text-[30px]">{i.title}</h2>
                <p className="mt-1.5 text-[15px] font-semibold text-[#1F7A34]">{i.tagline}</p>

                <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-[#4B5563]">The challenge</p>
                <p className="mt-2 text-[15px] leading-relaxed text-[#2A323F]">{i.challenge}</p>

                <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-[#4B5563]">The outcome</p>
                <ul className="mt-3 space-y-2.5">
                  {i.outcome.map((o) => (
                    <li key={o} className="flex gap-2.5 text-[15px] leading-relaxed text-[#2A323F]">
                      <Tick />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>

                <p className="sr-only">
                  What Olitec supplies: {i.system.join("; ")}.
                </p>

                <Link
                  href="/homes-and-businesses"
                  className="mt-8 inline-flex h-[52px] items-center gap-4 rounded-full bg-gradient-to-r from-[#E8962C] to-[#F3BE48] pl-6 pr-2 text-[15px] font-bold text-[#161E2C] shadow-[0_8px_20px_rgb(232_150_44/0.28)] transition hover:brightness-105"
                >
                  Talk to our engineers
                  <span className="flex size-9 items-center justify-center rounded-full bg-white">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M7 17L17 7M8 7h9v9" />
                    </svg>
                  </span>
                </Link>
              </div>
            ))}
          </div>

          {/* Right: the interactive animated diagram */}
          <div className="rounded-[22px] bg-gradient-to-b from-[#FFF7EA] to-[#FFEFD9] p-4 sm:p-6">
            <div className="flex justify-center">
              <div className="inline-flex rounded-full border border-[#ECE2CF] bg-white p-1" role="radiogroup" aria-label="Operating mode">
                {d.modes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={mode === m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition sm:px-4",
                      mode === m ? "bg-gradient-to-r from-[#E8962C] to-[#F3BE48] text-[#161E2C]" : "text-[#4B5563] hover:text-[#161E2C]",
                    )}
                  >
                    {modeLabel[m]}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mx-auto mt-4 aspect-[520/560] w-full max-w-[520px] sm:aspect-[520/330]">
              <svg viewBox="0 0 520 330" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
                {links.map(([a, b]) => {
                  const key = `${a}-${b}`;
                  const reverseKey = `${b}-${a}`;
                  const on = active.has(key) || active.has(reverseKey);
                  const reverse = active.has(reverseKey);
                  const dead = off.has(a) || off.has(b) || (gridFailed && (a === "supply" || b === "supply"));
                  const path = linkPath(a, b);
                  return (
                    <g key={key}>
                      <path d={path} fill="none" stroke={dead ? "#E7DFD2" : "#E3D6C2"} strokeWidth="3" vectorEffect="non-scaling-stroke" />
                      {on && !dead && (
                        <path
                          d={path}
                          fill="none"
                          stroke="#E8962C"
                          strokeWidth="3.5"
                          vectorEffect="non-scaling-stroke"
                          strokeLinecap="round"
                          strokeDasharray="2 12"
                          className={reverse ? "app-flow-rev" : "app-flow"}
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              {nodes.map((k) => {
                const p = POS[k];
                const isOff = off.has(k) || (gridFailed && k === "supply");
                const isSel = selected === k;
                const isCentre = k === "inverter";
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSelected(k)}
                    aria-pressed={isSel}
                    className={cn(
                      "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-2xl border bg-white text-center shadow-[0_6px_16px_rgb(22_30_44/0.06)] transition",
                      isCentre ? "w-[30%] min-w-[96px] px-2 py-2" : "w-[24%] min-w-[78px] px-1.5 py-2",
                      isSel ? "border-[#161E2C] ring-1 ring-[#161E2C]" : "border-[#E6E2D8] hover:border-[#E8962C]",
                      isOff && "opacity-45",
                    )}
                    style={{ left: `${(p.x / 520) * 100}%`, top: `${(p.y / 330) * 100}%` }}
                  >
                    {renderNodeArt(k)}
                    <span className="mt-1 text-[11.5px] font-semibold leading-tight text-[#161E2C] sm:text-[12.5px]">{nodeLabel[k]}</span>
                    {isOff && k === "supply" && (
                      <span className="absolute right-1.5 top-1 text-sm font-bold text-[#E8962C]" aria-label="Grid down">
                        ✕
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="mt-3 min-h-[44px] text-center text-[14px] font-medium leading-snug text-[#2A323F]" aria-live="polite">
              {caption[mode]}
            </p>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[#ECE7DD] bg-white px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#D45C0A]">{shown.label}</p>
                <p className="mt-0.5 text-[14.5px] font-semibold leading-snug text-[#161E2C]">{shown.text}</p>
              </div>
              {shown.href && (
                <Link
                  href={shown.href}
                  className="inline-flex h-9 shrink-0 items-center rounded-full border border-[#161E2C] px-4 text-[13px] font-semibold text-[#161E2C] transition hover:bg-[#161E2C] hover:text-white"
                >
                  View product
                </Link>
              )}
            </div>
            <p className="mt-2 text-center text-xs text-slate-500">Click any box in the diagram to see what Olitec supplies there.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
