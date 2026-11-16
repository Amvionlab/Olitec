"use client";

import { useEffect, useRef, useState } from "react";
import { IconTile, BulletList, headingFont, legacyContainer } from "@/components/legacy/ui";
import type { LegacyIconName } from "@/components/legacy/icons";
import { cn } from "@/lib/cn";

export interface ApplicationItem {
  id: string;
  icon: LegacyIconName;
  title: string;
  tagline: string;
  challenge: string;
  system: readonly string[];
  outcome: readonly string[];
}

interface ApplicationScrollRowProps {
  item: ApplicationItem;
  index: number;
}

export function ApplicationScrollRow({ item, index }: ApplicationScrollRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    let rafId: number | null = null;

    const calculateProgress = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScrollable = containerRef.current.offsetHeight - windowHeight;

      if (totalScrollable <= 0) {
        setProgress(1);
        return;
      }

      // Progress starts when the top of the container reaches the top of the viewport (rect.top <= 0)
      const scrolled = -rect.top;
      const rawProgress = scrolled / totalScrollable;
      const clamped = Math.min(Math.max(rawProgress, 0), 1);
      setProgress(clamped);
    };

    const onScroll = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(calculateProgress);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    calculateProgress();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  // Determine which step is currently unlocked based on scroll progress:
  // 0.00 - 0.22: Step 1 (Challenge arrives)
  // 0.22 - 0.55: Step 2 (The Olitec System arrives)
  // 0.55 - 0.88: Step 3 (The Outcome arrives - row complete)
  // 0.88 - 1.00: Row fully locked in place, continuing scroll advances to next row
  const showBox1 = !isClient || progress >= 0.02;
  const showBox2 = !isClient || progress >= 0.24;
  const showBox3 = !isClient || progress >= 0.58;

  const currentStep = !isClient ? 3 : showBox3 ? 3 : showBox2 ? 2 : 1;

  const scrollToStep = (targetStep: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const containerTop = scrollTop + rect.top;
    const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;

    let targetProgress = 0.05;
    if (targetStep === 2) targetProgress = 0.38;
    if (targetStep === 3) targetProgress = 0.72;

    window.scrollTo({
      top: containerTop + totalScrollable * targetProgress,
      behavior: "smooth",
    });
  };

  const muted = index % 2 === 1;

  return (
    <div
      id={item.id}
      ref={containerRef}
      className={cn(
        "relative min-h-[140vh] md:min-h-[165vh] scroll-mt-16",
        muted ? "bg-[rgb(248_249_250)]" : "bg-white"
      )}
    >
      {/* Sticky presentation viewport */}
      <div className="sticky top-16 md:top-20 z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-center py-8 lg:py-12">
        <div className={cn(legacyContainer, "w-full")}>
          {/* Section Header */}
          <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-slate-200/80 pb-5">
            <div>
              <div className="mb-2.5 flex items-center gap-4">
                <IconTile icon={item.icon} size={52} />
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-600">Application</p>
              </div>
              <h2 className={cn(headingFont, "text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight text-black")}>
                {item.title}
              </h2>
              <p className="mt-1 text-base sm:text-lg font-semibold text-ink">
                {item.tagline}
              </p>
            </div>

            {/* Interactive Step Navigator */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              <button
                type="button"
                onClick={() => scrollToStep(1)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                  currentStep >= 1
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                <span className="flex size-4 items-center justify-center rounded-full bg-white/20 text-[10px]">1</span>
                <span>Challenge</span>
              </button>

              <div
                className={cn(
                  "h-0.5 w-4 sm:w-6 transition-colors duration-500",
                  currentStep >= 2 ? "bg-amber-500" : "bg-slate-200"
                )}
              />

              <button
                type="button"
                onClick={() => scrollToStep(2)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                  currentStep >= 2
                    ? "bg-amber-500 text-black shadow-xs ring-2 ring-amber-300/60"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                <span className="flex size-4 items-center justify-center rounded-full bg-black/15 text-[10px]">2</span>
                <span>The System</span>
              </button>

              <div
                className={cn(
                  "h-0.5 w-4 sm:w-6 transition-colors duration-500",
                  currentStep >= 3 ? "bg-emerald-500" : "bg-slate-200"
                )}
              />

              <button
                type="button"
                onClick={() => scrollToStep(3)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                  currentStep >= 3
                    ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300/60"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                <span className="flex size-4 items-center justify-center rounded-full bg-white/20 text-[10px]">3</span>
                <span>Outcome</span>
              </button>
            </div>
          </div>

          {/* Sequential 3-Box Flow Grid */}
          <div className="grid gap-5 md:grid-cols-3 items-stretch">
            {/* BOX 1: THE CHALLENGE */}
            <div
              className={cn(
                "rounded-[25.528px] border-[0.912px] bg-white p-7 shadow-xs transition-all duration-700 ease-out",
                showBox1
                  ? "opacity-100 translate-y-0 scale-100 border-[#b7b7b7] shadow-sm"
                  : "opacity-20 translate-y-8 scale-95 border-slate-200 pointer-events-none"
              )}
            >
              <h3 className={cn(headingFont, "mb-3 text-[18px] sm:text-[20px] font-semibold text-black")}>
                The challenge
              </h3>
              <p className="text-base text-slate-700 leading-relaxed font-normal">
                {item.challenge}
              </p>
            </div>

            {/* BOX 2: THE OLITEC SYSTEM */}
            <div
              className={cn(
                "rounded-[25.528px] border-[0.912px] p-7 shadow-xs transition-all duration-700 ease-out",
                showBox2
                  ? "opacity-100 translate-y-0 scale-100 border-brand-300 bg-brand-50 shadow-sm"
                  : "opacity-20 translate-y-12 scale-95 border-slate-200 bg-slate-50/60 pointer-events-none"
              )}
            >
              <h3 className={cn(headingFont, "mb-3 text-[18px] sm:text-[20px] font-semibold text-black")}>
                The Olitec system
              </h3>
              <BulletList items={item.system} className="text-base text-slate-800" />
            </div>

            {/* BOX 3: THE OUTCOME */}
            <div
              className={cn(
                "rounded-[25.528px] border-[0.912px] p-7 shadow-xs transition-all duration-700 ease-out",
                showBox3
                  ? "opacity-100 translate-y-0 scale-100 border-leaf/40 bg-leaf/5 shadow-sm"
                  : "opacity-20 translate-y-16 scale-95 border-slate-200 bg-slate-50/60 pointer-events-none"
              )}
            >
              <h3 className={cn(headingFont, "mb-3 text-[18px] sm:text-[20px] font-semibold text-black")}>
                The outcome
              </h3>
              <BulletList items={item.outcome} className="text-base text-slate-800" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
