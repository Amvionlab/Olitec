"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Box, Rotate3d } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Product3DViewerProps } from "./Product3DViewer";

const Product3DViewer = dynamic(
  () => import("./Product3DViewer").then((mod) => mod.Product3DViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex size-full flex-col items-center justify-center gap-2">
        <div className="size-7 animate-spin rounded-full border-2 border-[#E8962C]/30 border-t-[#E8962C]" />
        <span className="text-[11px] font-semibold text-slate-500">Loading 3D CAD model…</span>
      </div>
    ),
  },
);

export function getProductPosterSrc(category: string, name: string, modelNumber?: string): string {
  const catLower = category.toLowerCase();
  const nameLower = name.toLowerCase();
  const modelLower = (modelNumber || "").toLowerCase();

  if (catLower.includes("battery") || catLower.includes("storage") || nameLower.includes("battery") || nameLower.includes("olb")) {
    return "/images/models/olb-battery-preview.webp";
  }
  if (nameLower.includes("three") || nameLower.includes("3h") || modelLower.includes("3h")) {
    return "/images/models/oli-3h-preview.webp";
  }
  return "/images/models/oli-1h-preview.webp";
}

interface LazyProduct3DViewerProps extends Product3DViewerProps {
  compactTrigger?: boolean;
}

/**
 * Displays a lightweight WebP render from Olitec's original 3D CAD files on initial load,
 * deferring the 17 MB WebGL Three.js scene until the visitor explicitly asks to interact in 3D.
 */
export function LazyProduct3DViewer({
  compactTrigger = false,
  height = "100%",
  className,
  ...props
}: LazyProduct3DViewerProps) {
  const [activated, setActivated] = useState(false);

  if (activated) {
    return (
      <Product3DViewer
        height={height}
        className={className}
        {...props}
      />
    );
  }

  const posterSrc = getProductPosterSrc(props.category, props.name, props.modelNumber);

  return (
    <div
      className={cn(
        "group relative flex size-full flex-col items-center justify-center overflow-hidden",
        className,
      )}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    >
      <div className={cn("size-full flex items-center justify-center", compactTrigger ? "p-1" : "p-4 sm:p-5")}>
        <div className="relative size-full">
          <Image
            src={posterSrc}
            alt={`${props.name}${props.modelNumber ? ` (${props.modelNumber})` : ""} 3D CAD hardware view`}
            fill
            sizes={compactTrigger ? "96px" : "(min-width: 1024px) 360px, 90vw"}
            className="object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        </div>
      </div>

      {compactTrigger ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setActivated(true);
          }}
          title="Load interactive 3D view"
          aria-label={`Load interactive 3D view of ${props.name}`}
          className="absolute bottom-1 right-1 inline-flex items-center gap-0.5 rounded-full bg-white/95 px-1.5 py-0.5 text-[9px] font-bold text-[#161E2C] shadow-xs ring-1 ring-black/10 transition hover:bg-[#161E2C] hover:text-white cursor-pointer"
        >
          <Box className="size-2.5" aria-hidden="true" />
          <span>3D</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setActivated(true)}
          aria-label={`Load interactive 360° 3D view of ${props.name}`}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-[#161E2C] shadow-sm ring-1 ring-black/10 backdrop-blur-sm transition hover:bg-[#161E2C] hover:text-white cursor-pointer"
        >
          <Rotate3d className="size-3.5 text-[#D45C0A] transition-colors group-hover:text-[#F3BE48]" aria-hidden="true" />
          <span>3D View</span>
        </button>
      )}
    </div>
  );
}
