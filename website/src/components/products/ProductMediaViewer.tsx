"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Eye, Image as ImageIcon, Rotate3d, Sparkles } from "lucide-react";
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
}

export function ProductMediaViewer({ category, name, model, className }: ProductMediaViewerProps) {
  const [viewMode, setViewMode] = useState<"photo" | "3d">("photo");

  return (
    <div className={cn("overflow-hidden rounded-[25.528px] border border-slate-200 bg-white p-3 sm:p-4 shadow-sm", className)}>
      {/* View Switcher Tabs */}
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-1.5 rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setViewMode("3d")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
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
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
              viewMode === "photo" ? "bg-white text-black font-bold shadow-sm" : "text-slate-600 hover:text-black",
            )}
          >
            <ImageIcon className="size-3.5" />
            <span>Photo</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
            <Sparkles className="size-3 text-brand-500" />
            {viewMode === "3d" ? "360° Zoomable" : "Product Illustration"}
          </span>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="relative min-h-[380px] w-full">
        {viewMode === "3d" ? (
          <Product3DViewer
            category={category}
            name={name}
            modelNumber={model}
            height={380}
            autoRotateInit={true}
            showHotspots={false}
          />
        ) : (
          <div className="relative flex h-[380px] w-full flex-col items-center justify-center rounded-[20px] bg-slate-50/70 p-6">
            {category.toLowerCase().includes("inverter") ||
            category.toLowerCase().includes("battery") ||
            category.toLowerCase().includes("storage") ? (
              <>
                <div className="relative size-full max-w-[340px]">
                  <Image
                    src={getProductPosterSrc(category, name, model)}
                    alt={`${name} (${model}) hardware CAD render`}
                    fill
                    priority
                    sizes="(min-width: 1024px) 380px, 90vw"
                    className="object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode("3d")}
                  className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-xs font-bold text-[#161E2C] shadow-sm ring-1 ring-black/10 transition hover:bg-[#161E2C] hover:text-white cursor-pointer"
                >
                  <Rotate3d className="size-4 text-[#D45C0A]" aria-hidden="true" />
                  <span>Load 3D Model</span>
                </button>
              </>
            ) : (
              <ProductImage category={category} name={name} size="lg" className="size-48" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
