"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { ContentBlock } from "@/types";
import { cn } from "@/utils/format";

/** Homepage banners managed in Admin → Content. Auto-advances, pausable, respects reduced motion. */
export function BannerCarousel({ banners }: { banners: ContentBlock[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (banners.length < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % banners.length), 6000);
    return () => clearInterval(timer);
  }, [banners.length, paused]);

  if (!banners.length) return null;
  const go = (delta: number) => setIndex((value) => (value + delta + banners.length) % banners.length);

  return (
    <section aria-roledescription="carousel" aria-label="Promotions" className="relative overflow-hidden rounded-3xl bg-forest">
      {banners.map((banner, position) => (
        <div
          key={banner.id}
          aria-roledescription="slide"
          aria-label={`${position + 1} of ${banners.length}`}
          aria-hidden={position !== index}
          className={cn("grid min-h-[260px] items-center transition-opacity duration-700 sm:min-h-[340px] md:grid-cols-2", position === index ? "relative opacity-100" : "pointer-events-none absolute inset-0 opacity-0")}
        >
          {banner.imageUrl && (
            <Image src={banner.imageUrl} alt="" fill sizes="(min-width: 1280px) 1216px, 100vw" preload={position === 0} className="object-cover opacity-40 md:opacity-100 md:[mask-image:linear-gradient(to_right,transparent,black_45%)]" />
          )}
          <div className="relative z-10 space-y-4 p-8 text-white sm:p-12">
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl">{banner.title}</h2>
            {banner.subtitle && <p className="max-w-md text-base text-slate-200 sm:text-lg">{banner.subtitle}</p>}
            {banner.linkUrl && (
              <Link href={banner.linkUrl} tabIndex={position === index ? 0 : -1} className="inline-flex h-12 items-center rounded-lg bg-brand-500 px-6 font-semibold text-white hover:bg-brand-600">
                {banner.linkLabel || "Shop now"}
              </Link>
            )}
          </div>
        </div>
      ))}
      {banners.length > 1 && (
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
          <button onClick={() => go(-1)} className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30" aria-label="Previous slide">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={() => setPaused((value) => !value)} className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30" aria-label={paused ? "Play slides" : "Pause slides"}>
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          </button>
          <button onClick={() => go(1)} className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30" aria-label="Next slide">
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </section>
  );
}
