"use client";

import { useState } from "react";
import { Eye, Image as ImageIcon, Sparkles } from "lucide-react";
import { ProductImage } from "./ProductImage";
import { Product3DViewer } from "./Product3DViewer";
import type { ProductCategory } from "@/lib/types";
import { cn } from "@/lib/cn";

interface ProductMediaViewerProps {
  category: ProductCategory;
  name: string;
  model: string;
  className?: string;
}

export function ProductMediaViewer({ category, name, model, className }: ProductMediaViewerProps) {
  const [viewMode, setViewMode] = useState<"3d" | "photo">("3d");

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
          <div className="flex h-[380px] w-full items-center justify-center rounded-[20px] bg-slate-50/50 p-6">
            <ProductImage category={category} name={name} size="lg" className="size-48" />
          </div>
        )}
      </div>
    </div>
  );
}
