"use client";

import { useState } from "react";
import Image from "next/image";
import { Sun, X, ZoomIn } from "lucide-react";
import { cn } from "@/utils/format";

/** Product images: thumbnails, hover-to-magnify on desktop, and a full-screen zoom view (click/tap). */
export function Gallery({ images, name }: { images: { url: string; alt: string }[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [origin, setOrigin] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const current = images[index];

  if (!images.length) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-slate-100 text-slate-300" aria-label="No image available">
        <Sun className="size-20" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200 bg-white"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setOrigin(`${((event.clientX - rect.left) / rect.width) * 100}% ${((event.clientY - rect.top) / rect.height) * 100}%`);
        }}
        onMouseLeave={() => setOrigin(null)}
        onClick={() => setFullscreen(true)}
        aria-label={`Zoom image ${index + 1} of ${name}`}
      >
        <Image
          src={current.url}
          alt={current.alt}
          fill
          preload
          sizes="(min-width: 1024px) 560px, 100vw"
          className="object-contain p-4 transition-transform duration-200"
          style={origin ? { transform: "scale(2)", transformOrigin: origin } : undefined}
        />
        <span className="absolute bottom-3 right-3 rounded-full bg-white/90 p-2 shadow ring-1 ring-slate-200">
          <ZoomIn className="size-4 text-slate-600" aria-hidden />
        </span>
      </button>
      {images.length > 1 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto">
          {images.map((image, position) => (
            <button
              key={image.url}
              onClick={() => setIndex(position)}
              aria-label={`Show image ${position + 1}`}
              aria-current={position === index}
              className={cn("relative size-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white", position === index ? "border-brand-500" : "border-slate-200 hover:border-slate-300")}
            >
              <Image src={image.url} alt="" fill sizes="80px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}
      {fullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label={`${name} images`} onKeyDown={(event) => event.key === "Escape" && setFullscreen(false)}>
          <button autoFocus onClick={() => setFullscreen(false)} className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close">
            <X className="size-6" />
          </button>
          <div className="relative h-full w-full max-w-5xl">
            <Image src={current.url} alt={current.alt} fill sizes="100vw" className="object-contain" />
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-6 flex gap-2">
              {images.map((image, position) => (
                <button key={image.url} onClick={() => setIndex(position)} className={cn("size-3 rounded-full", position === index ? "bg-white" : "bg-white/40")} aria-label={`Image ${position + 1}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
