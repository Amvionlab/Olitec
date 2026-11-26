"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Eye, Image as ImageIcon } from "lucide-react";
import { ProductImage } from "./ProductImage";
import { getProductPosterSrc } from "./LazyProduct3DViewer";
import type { ProductCategory } from "@/lib/types";
import { cn } from "@/lib/cn";

const Product3DViewer = dynamic(
  () => import("./Product3DViewer").then((mod) => mod.Product3DViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[380px] flex-col items-center justify-center gap-2">
        <div className="size-7 animate-spin rounded-full border-2 border-[#E8962C]/30 border-t-[#E8962C]" />
        <span className="text-xs font-semibold text-slate-500">Loading 3D CAD viewer…</span>
      </div>
    ),
  },
);

interface ProductMediaViewerProps {
  category: ProductCategory;
  name: string;
  model: string;
  className?: string;
  viewerHeight?: number;
}

export function ProductMediaViewer({
  category,
  name,
  model,
  className,
  viewerHeight = 380,
}: ProductMediaViewerProps) {
  const [viewMode, setViewMode] = useState<"photo" | "3d">("photo");
  const [batteryVariant, setBatteryVariant] = useState<"wall" | "stack">("wall");

  const isBattery =
    category.toLowerCase().includes("battery") ||
    category.toLowerCase().includes("storage") ||
    name.toLowerCase().includes("olb");

  return (
    <div className={cn("overflow-hidden rounded-[25.528px] border border-slate-200 bg-white p-3 sm:p-4 shadow-sm", className)}>
      {/* View Switcher Tabs */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-1.5 rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setViewMode("3d")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer",
              viewMode === "3d" ? "brand-gradient text-black font-bold shadow-sm" : "text-slate-600 hover:text-black",
            )}
          >
            <Eye className="size-3.5" />
            <span>3D View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("photo")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer",
              viewMode === "photo" ? "bg-white text-black font-bold shadow-sm" : "text-slate-600 hover:text-black",
            )}
          >
            <ImageIcon className="size-3.5" />
            <span>Photo</span>
          </button>
        </div>

        {isBattery && (
          <div className="flex items-center gap-1 rounded-full bg-emerald-50/80 p-1 border border-emerald-200/70">
            <button
              type="button"
              onClick={() => setBatteryVariant("wall")}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-bold transition-all cursor-pointer",
                batteryVariant === "wall"
                  ? "bg-[#1F7A34] text-white shadow-xs"
                  : "text-[#161E2C] hover:bg-white/70",
              )}
            >
              Wall Mount
            </button>
            <button
              type="button"
              onClick={() => setBatteryVariant("stack")}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-bold transition-all cursor-pointer",
                batteryVariant === "stack"
                  ? "bg-[#1F7A34] text-white shadow-xs"
                  : "text-[#161E2C] hover:bg-white/70",
              )}
            >
              Stack
            </button>
          </div>
        )}
      </div>

      {/* Main Display Area */}
      <div className="relative w-full" style={{ minHeight: `${viewerHeight}px` }}>
        {viewMode === "3d" ? (
          <Product3DViewer
            category={category}
            name={name}
            modelNumber={model}
            batteryVariant={isBattery ? batteryVariant : undefined}
            height={viewerHeight}
            autoRotateInit={true}
            showHotspots={false}
          />
        ) : (
          <div
            className="relative flex w-full flex-col items-center justify-center rounded-[20px] bg-gradient-to-b from-[#FAFBFD] to-[#F3F5F8] p-5"
            style={{ height: `${viewerHeight}px` }}
          >
            {category.toLowerCase().includes("inverter") || isBattery ? (
              <div className="relative size-full max-w-[340px]">
                <Image
                  src={getProductPosterSrc(category, name, model, isBattery ? batteryVariant : undefined)}
                  alt={`${name}${isBattery ? (batteryVariant === "stack" ? " (Battery Stack)" : " (Wall Mount)") : ""} (${model})`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 380px, 90vw"
                  className="object-contain"
                />
              </div>
            ) : (
              <ProductImage category={category} name={name} size="lg" className="size-48" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
