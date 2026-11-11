"use client";

import { useEffect, useState } from "react";
import { X, Box, Download, FileText, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import { Product3DViewer } from "./Product3DViewer";
import { cn } from "@/lib/cn";

interface Product3DModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  name: string;
  modelNumber?: string;
  description?: string;
  figures?: readonly { readonly label: string; readonly value: string }[];
  datasheet?: string;
  models?: readonly string[];
}

export function Product3DModal({
  isOpen,
  onClose,
  category,
  name,
  modelNumber,
  description,
  figures,
  datasheet,
  models,
}: Product3DModalProps) {
  const [showSpecs, setShowSpecs] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 backdrop-blur-md bg-black/65 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-6xl max-h-[94vh] overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 sm:px-7 py-3.5 sm:py-4 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Box className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">{name}</h3>
                {modelNumber && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                    {modelNumber}
                  </span>
                )}
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  {category}
                </span>
              </div>
              <p className="text-xs text-muted">WebGL 3D CAD Inspection Suite · Rotate 360°, Zoom & Measure</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {datasheet && (
              <a
                href={datasheet}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-brand-400 hover:text-brand-600 transition"
              >
                <Download className="size-3.5 text-brand-500" />
                <span>Datasheet</span>
              </a>
            )}

            {figures && figures.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSpecs((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <FileText className="size-3.5 text-brand-500" />
                <span>{showSpecs ? "Hide Specs" : "Show Specs"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body: 3D Canvas + Optional Specs Split */}
        <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-3 sm:p-5">
          <div className={cn("grid gap-4", figures && showSpecs ? "lg:grid-cols-12" : "grid-cols-1")}>
            {/* 3D Canvas Container */}
            <div className={cn("w-full", figures && showSpecs ? "lg:col-span-8" : "w-full")}>
              <Product3DViewer
                category={category}
                name={name}
                modelNumber={modelNumber}
                height={520}
                autoRotateInit={true}
                showHotspots={true}
              />
            </div>

            {/* Specifications & Details Sidebar */}
            {figures && showSpecs && (
              <div className="lg:col-span-4 flex flex-col gap-4">
                {/* Verified Specs Table */}
                <div className="rounded-[22px] border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Sparkles className="size-4 text-brand-500" />
                    <h4 className="text-sm font-bold text-slate-900">Verified Specifications</h4>
                  </div>
                  <dl className="mt-3 divide-y divide-slate-100 text-xs">
                    {figures.map((fig) => (
                      <div key={fig.label} className="flex items-center justify-between py-2">
                        <dt className="text-slate-500">{fig.label}</dt>
                        <dd className="font-semibold text-slate-900">{fig.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Available Models */}
                {models && models.length > 0 && (
                  <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-xs">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Available Models</p>
                    <div className="flex flex-wrap gap-1.5">
                      {models.map((m) => (
                        <span key={m} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Datasheet Action */}
                {datasheet && (
                  <a
                    href={datasheet}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brand-gradient group flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-black shadow-xs transition hover:brightness-105"
                  >
                    <Download className="size-4" />
                    <span>Download Engineering Datasheet</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Description */}
        {description && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-3 text-xs text-muted shrink-0">
            <span className="line-clamp-1">{description}</span>
            <span className="font-semibold text-brand-600 shrink-0 ml-4 hidden sm:inline">
              ● Left click to orbit · Right click to pan · Scroll to zoom
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
