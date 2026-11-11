"use client";

import { useState } from "react";
import { Eye, Download, Maximize2, Sparkles } from "lucide-react";
import { IconTile, BulletList, headingFont } from "@/components/legacy/ui";
import { Product3DViewer } from "./Product3DViewer";
import { Product3DModal } from "./Product3DModal";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { cn } from "@/lib/cn";

interface SeriesItem {
  readonly icon: string;
  readonly tone: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly tagline: string;
  readonly body: string;
  readonly bullets: readonly string[];
  readonly models: readonly string[];
  readonly datasheet: string;
  readonly figures: readonly { readonly label: string; readonly value: string }[];
}

export function ProductSeriesList({ series }: { series: readonly SeriesItem[] }) {
  const [selectedSeries, setSelectedSeries] = useState<SeriesItem | null>(null);

  const getCategory = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("battery") || t.includes("olb")) return "Battery";
    if (t.includes("inverter") || t.includes("oli")) return "Hybrid Inverter";
    if (t.includes("purifier") || t.includes("ro") || t.includes("water")) return "Water Purifier";
    if (t.includes("fan")) return "Smart BLDC Fan";
    if (t.includes("cooler")) return "Air Cooler";
    return "Solar Appliance";
  };

  return (
    <>
      <div className="space-y-12">
        {series.map((item, index) => {
          const category = getCategory(item.title);
          return (
            <ScrollReveal key={item.title} delay={index * 120}>
              <article
                className={cn(
                  "grid gap-6 xl:gap-8 lg:grid-cols-12 border-t border-[#e6e6e6] pt-10 pb-12 items-stretch transition-all duration-300",
                  index === series.length - 1 && "border-b",
                )}
              >
                {/* 1. Left Column: Product Details, Bullets & Models (lg:col-span-4) */}
                <div className="lg:col-span-4 xl:col-span-4 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Eyebrow & Icon */}
                    <div className="flex items-center gap-3">
                      <IconTile icon={item.icon as any} tone={item.tone as any} size={44} />
                      <p
                        className={cn(
                          "text-xs font-bold uppercase tracking-[0.14em]",
                          item.tone === "green" ? "text-leaf" : "text-brand-600",
                        )}
                      >
                        {item.eyebrow}
                      </p>
                    </div>

                    {/* Title & Tagline */}
                    <h2 className={cn(headingFont, "mt-3 text-[26px] sm:text-[30px] xl:text-[32px] font-semibold leading-[1.18] text-slate-900")}>
                      {item.title}
                    </h2>
                    <p className="mt-1.5 text-[15px] sm:text-base font-semibold text-slate-700">
                      {item.tagline}
                    </p>

                    {/* Body description */}
                    <p className="mt-2.5 leading-relaxed text-slate-600 text-xs sm:text-[13.5px]">
                      {item.body}
                    </p>

                    {/* Bullet points */}
                    <div className="mt-3 text-xs sm:text-[13.5px]">
                      <BulletList items={item.bullets} />
                    </div>
                  </div>

                  {/* Models Chips & Actions */}
                  <div className="pt-2">
                    <div className="mb-3">
                      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">Available Models:</p>
                      <ul className="flex flex-wrap gap-1.5" aria-label="Available models">
                        {item.models.map((model) => (
                          <li
                            key={model}
                            className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-bold text-slate-800 shadow-2xs hover:border-brand-400 hover:text-brand-600 transition"
                          >
                            {model}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <a
                        href={item.datasheet}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="brand-gradient group inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-5 text-xs font-bold text-black shadow-sm transition hover:brightness-105 active:scale-95"
                      >
                        <Download className="size-3.5" />
                        <span>Download datasheet</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => setSelectedSeries(item)}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-800 shadow-2xs transition hover:border-black hover:bg-slate-50 active:scale-95"
                      >
                        <Eye className="size-3.5 text-brand-600" />
                        <span>Inspect 3D</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Center Column: Live 3D Hardware Canvas in 1 View (lg:col-span-4) */}
                <div className="lg:col-span-4 xl:col-span-4 flex flex-col">
                  <div className="relative flex-1 min-h-[400px] xl:min-h-[440px] overflow-hidden rounded-[26px] border border-slate-200 bg-white p-2 shadow-[0_8px_30px_rgb(0_0_0/0.03)] transition hover:border-brand-300 hover:shadow-md">
                    <Product3DViewer
                      category={category}
                      name={item.title}
                      modelNumber={item.models[0]}
                      height={420}
                      autoRotateInit={true}
                      showHotspots={false}
                      onExpandModal={() => setSelectedSeries(item)}
                    />
                  </div>
                </div>

                {/* 3. Right Column: Verified Specifications in 1 View (lg:col-span-4) */}
                <div className="lg:col-span-4 xl:col-span-4 flex flex-col">
                  <div className="flex-1 flex flex-col justify-between rounded-[26px] border border-slate-200 bg-white p-5 xl:p-6 shadow-[0_8px_30px_rgb(0_0_0/0.03)]">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="size-4 text-brand-500" />
                          <h3 className={cn(headingFont, "text-base xl:text-lg font-bold text-slate-900")}>
                            Key figures
                          </h3>
                        </div>
                        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-700">
                          Verified Specs
                        </span>
                      </div>

                      {/* Specs Table - All 7 rows fit neatly in single view */}
                      <dl className="grid grid-cols-[minmax(0,1fr)_auto] text-xs xl:text-[13.5px]">
                        {item.figures.map((row) => (
                          <div key={row.label} className="contents">
                            <dt className="border-b border-slate-100 py-2.5 text-slate-500">{row.label}</dt>
                            <dd className="border-b border-slate-100 py-2.5 text-right font-bold text-slate-900">{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-muted">
                      <span>Click 3D full-screen to inspect CAD</span>
                      <button
                        type="button"
                        onClick={() => setSelectedSeries(item)}
                        className="font-bold text-brand-600 hover:underline inline-flex items-center gap-1"
                      >
                        <span>Full Screen</span>
                        <Maximize2 className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </ScrollReveal>
          );
        })}
      </div>

      {/* Full 3D Inspection Suite Modal */}
      {selectedSeries && (
        <Product3DModal
          isOpen={!!selectedSeries}
          onClose={() => setSelectedSeries(null)}
          category={getCategory(selectedSeries.title)}
          name={selectedSeries.title}
          modelNumber={selectedSeries.models[0]}
          description={selectedSeries.tagline}
          figures={selectedSeries.figures}
          datasheet={selectedSeries.datasheet}
          models={selectedSeries.models}
        />
      )}
    </>
  );
}
