"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconTile, BulletList, headingFont, legacyContainer } from "@/components/legacy/ui";
import type { LegacyIconName } from "@/components/legacy/icons";
import { cn } from "@/lib/cn";
import { ArrowRight, CheckCircle2, ChevronDown, Sparkles } from "lucide-react";

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
        "relative min-h-[190vh] md:min-h-[220vh] scroll-mt-16",
        muted ? "bg-[rgb(248_249_250)]" : "bg-white"
      )}
    >
      {/* Sticky presentation viewport */}
      <div className="sticky top-16 md:top-20 z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-center py-8 lg:py-12">
        <div className={cn(legacyContainer, "w-full")}>
          {/* Section Header */}
          <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-slate-200/80 pb-5">
            <div>
              <div className="mb-2.5 flex items-center gap-3">
                <IconTile icon={item.icon} size={44} />
                <span className="rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-700">
                  Application 0{index + 1}
                </span>
              </div>
              <h2 className={cn(headingFont, "text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-slate-900")}>
                {item.title}
              </h2>
              <p className="mt-1 text-base sm:text-lg font-semibold text-slate-600">
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
          <div className="grid gap-5 md:grid-cols-3 items-stretch relative">
            {/* ==============================================================
                BOX 1: THE CHALLENGE
               ============================================================== */}
            <div
              className={cn(
                "relative flex flex-col justify-between rounded-3xl border bg-white p-6 sm:p-7 shadow-xs transition-all duration-700 ease-out",
                showBox1
                  ? "opacity-100 translate-y-0 scale-100 border-slate-300 shadow-md ring-1 ring-slate-200"
                  : "opacity-20 translate-y-8 scale-95 border-slate-200 pointer-events-none"
              )}
            >
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-700">
                    Step 01 · The Challenge
                  </span>
                  {showBox1 && (
                    <span className="size-2 rounded-full bg-slate-400 animate-ping" />
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                  The Challenge
                </h3>
                <p className="text-base text-slate-600 leading-relaxed font-normal">
                  {item.challenge}
                </p>
              </div>

              {/* Connecting prompt to next box on desktop */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Problem identified</span>
                <span className={cn("transition-colors duration-500", showBox2 ? "text-amber-600 font-bold" : "text-slate-300")}>
                  {showBox2 ? "Solved by Olitec →" : "Scroll to solve →"}
                </span>
              </div>
            </div>

            {/* ==============================================================
                BOX 2: THE OLITEC SYSTEM
               ============================================================== */}
            <div
              className={cn(
                "relative flex flex-col justify-between rounded-3xl border p-6 sm:p-7 shadow-xs transition-all duration-700 ease-out",
                showBox2
                  ? "opacity-100 translate-y-0 scale-100 border-amber-400 bg-amber-50/50 shadow-lg ring-2 ring-amber-400/40"
                  : "opacity-20 translate-y-12 scale-95 border-slate-200 bg-slate-50/60 pointer-events-none"
              )}
            >
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-900">
                    <Sparkles size={13} className="text-amber-600" />
                    Step 02 · The Olitec System
                  </span>
                  {showBox2 && (
                    <span className="flex size-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                  The Olitec System
                </h3>
                <BulletList items={item.system} className="text-base text-slate-800 font-medium" />
              </div>

              {/* Connecting prompt to outcome */}
              <div className="mt-6 pt-4 border-t border-amber-200/60 flex items-center justify-between text-xs font-semibold text-amber-800">
                <span>Integrated Engineering</span>
                <span className={cn("transition-colors duration-500", showBox3 ? "text-emerald-700 font-bold" : "text-amber-600/70")}>
                  {showBox3 ? "Delivers Results →" : "Scroll for results →"}
                </span>
              </div>
            </div>

            {/* ==============================================================
                BOX 3: THE OUTCOME
               ============================================================== */}
            <div
              className={cn(
                "relative flex flex-col justify-between rounded-3xl border p-6 sm:p-7 shadow-xs transition-all duration-700 ease-out",
                showBox3
                  ? "opacity-100 translate-y-0 scale-100 border-emerald-500 bg-emerald-50/40 shadow-lg ring-2 ring-emerald-400/40"
                  : "opacity-20 translate-y-16 scale-95 border-slate-200 bg-slate-50/60 pointer-events-none"
              )}
            >
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-900">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    Step 03 · The Outcome
                  </span>
                  {showBox3 && (
                    <span className="flex size-2 rounded-full bg-emerald-500" />
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                  The Outcome
                </h3>
                <BulletList items={item.outcome} className="text-base text-slate-800 font-medium" />
              </div>

              {/* Completion notice */}
              <div className="mt-6 pt-4 border-t border-emerald-200/60 flex items-center justify-between text-xs font-bold text-emerald-800">
                <span>Guaranteed Performance</span>
                <span className="text-emerald-700">✓ Row Complete</span>
              </div>
            </div>
          </div>

          {/* Bottom Scroll Cue Bar */}
          <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/80 backdrop-blur-xs border border-slate-200/80 px-4 py-2.5 text-xs text-slate-500 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">
                {currentStep === 1 && "Step 1 of 3: Scroll to reveal the Olitec System"}
                {currentStep === 2 && "Step 2 of 3: Scroll to reveal the Proven Outcome"}
                {currentStep === 3 && (
                  <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    This row is complete! Keep scrolling to explore the next application
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-20 sm:w-28 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <ChevronDown
                size={16}
                className={cn(
                  "transition-transform duration-300",
                  currentStep === 3 ? "text-emerald-600 animate-bounce" : "text-slate-400"
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
