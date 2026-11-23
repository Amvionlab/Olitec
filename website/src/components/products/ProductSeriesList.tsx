"use client";

import Image from "next/image";
import { Download } from "lucide-react";
import { IconTile, BulletList, headingFont } from "@/components/legacy/ui";
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
  return (
    <>
      <div className="space-y-12">
        {series.map((item, index) => {
          const isGreen =
            item.tone === "green" ||
            item.title.toLowerCase().includes("battery") ||
            item.title.toLowerCase().includes("olb");
          const isThreePhase =
            item.title.toLowerCase().includes("three") ||
            item.title.toLowerCase().includes("3h") ||
            item.eyebrow.toLowerCase().includes("three");

          // Real 3D CAD rendered images
          const imageSrc = isGreen
            ? "/images/products/battery-lfp-3d.png"
            : isThreePhase
              ? "/images/products/inverter-three-3d.png"
              : "/images/products/inverter-single-3d.png";

          return (
            <ScrollReveal key={item.title} delay={index * 120}>
              <article
                className={cn(
                  "group grid gap-6 xl:gap-8 lg:grid-cols-12 border-t border-[#e6e6e6] pt-10 pb-12 items-stretch transition-all duration-300",
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
                    </div>
                  </div>
                </div>

                {/* 2. Center Column: Verified Specifications in 1 View (lg:col-span-4) */}
                <div className="lg:col-span-4 xl:col-span-4 flex flex-col">
                  <div className="flex-1 flex flex-col justify-between rounded-[26px] border border-slate-200 bg-white p-5 xl:p-6 shadow-[0_8px_30px_rgb(0_0_0/0.03)]">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                        <div className="flex items-center gap-2">
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
                      <span>Real 3D Hardware Render</span>
                      <span className="font-semibold text-brand-600">3D CAD Model</span>
                    </div>
                  </div>
                </div>

                {/* 3. Right Column: Real 3D Hardware Model Showcase (lg:col-span-4) */}
                <div className="lg:col-span-4 xl:col-span-4 flex flex-col">
                  <div className="relative flex-1 h-full min-h-[380px] w-full flex flex-col items-center justify-center overflow-hidden rounded-[26px] border border-slate-200 bg-gradient-to-b from-[#f9fafb] via-white to-[#f4f5f7] shadow-[0_8px_30px_rgb(0_0_0/0.03)] p-6 transition">
                    <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
                      <span className="glass-panel rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-800 shadow-2xs">
                        3D Hardware Model
                      </span>
                    </div>

                    <div className="relative size-full flex-1 flex items-center justify-center p-4 min-h-[300px]">
                      <Image
                        src={imageSrc}
                        alt={item.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 420px"
                        className="object-contain p-4 drop-shadow-[0_20px_35px_rgba(0,0,0,0.14)] transition-transform duration-300 group-hover:scale-105"
                        priority={index === 0}
                      />
                    </div>
                  </div>
                </div>
              </article>
            </ScrollReveal>
          );
        })}
      </div>
    </>
  );
}
