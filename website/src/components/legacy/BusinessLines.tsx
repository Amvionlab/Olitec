"use client";

import { useEffect, useRef, useState } from "react";
import { businessLines, businessLinesIntro } from "@/content/legacy";
import { CarouselControls, HomeContainer, SectionTitle } from "@/components/home/primitives";
import { cn } from "@/lib/cn";
import { AnimatedIllustration } from "./AnimatedIllustration";

const LAST = businessLines.length - 1;

function EpcIcon() {
  return (
    <svg aria-hidden width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      {[0, 7, 14].map((x) => (
        <g key={x} transform={`translate(${x} 0)`}>
          <path d="M1.5 14.5L6.5 10L7.8 11.3L2.8 15.8Z" fill="currentColor" fillOpacity="0.18" />
          <path d="M3.3 15.4V19.5M6.6 12.4V19.5" strokeWidth="1.2" />
          <path d="M3.2 13L4.5 14.2M4.9 11.5L6.2 12.7" strokeWidth="0.8" />
        </g>
      ))}
      <path d="M1 19.5H23" />
      <circle cx="19.5" cy="4.8" r="1.6" />
      <path
        d="M22.10 4.80L23.10 4.80 M21.34 6.64L22.05 7.35 M19.50 7.40L19.50 8.40 M17.66 6.64L16.95 7.35 M16.90 4.80L15.90 4.80 M17.66 2.96L16.95 2.25 M19.50 2.20L19.50 1.20 M21.34 2.96L22.05 2.25"
        strokeWidth="1"
      />
    </svg>
  );
}

function StorageIcon() {
  return (
    <svg aria-hidden width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="10" height="18" rx="1.5" />
      <path d="M4.5 7h5" />
      <path d="M4 13c.8-2 1.6-2 2.4 0s1.6 2 2.4 0" />
      <rect x="14.5" y="7" width="7.5" height="14" rx="1.5" />
      <path d="M16.5 5h3.5M16.8 11h3M16.8 14.5h3M16.8 18h3" />
    </svg>
  );
}

function TurnkeyIcon() {
  return (
    <svg aria-hidden width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6.5" cy="9.5" r="4" />
      <circle cx="6.5" cy="9.5" r="1.2" />
      <path d="M10.5 9.5H20M17 9.5v3M14 9.5v2" />
      <circle cx="17" cy="18" r="4" />
      <path d="M15.2 18l1.3 1.3 2.4-2.6" />
    </svg>
  );
}

const icons = { epc: EpcIcon, storage: StorageIcon, turnkey: TurnkeyIcon };

/**
 * "What Olitec does": Scroll-driven 3-slide presentation.
 * As the user scrolls vertically down, it pins in place and slides smoothly through:
 * 1. Ground-mount open-access EPC
 * 2. Inverters and energy storage
 * 3. Turnkey solutions
 * Once the 3rd slide is complete, continuing scroll naturally moves to the next section below.
 */
export function BusinessLines() {
  const containerRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    setIsClient(true);
    let rafId: number | null = null;

    const handleScroll = () => {
      if (isNavigatingRef.current) return;
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScrollable = containerRef.current.offsetHeight - windowHeight;

      if (totalScrollable <= 0) return;

      const scrolled = -rect.top;
      const rawProgress = scrolled / totalScrollable;
      const clamped = Math.min(Math.max(rawProgress, 0), 1);
      setProgress(clamped);

      // Map progress to active slide (0, 1, 2)
      let nextIndex = 0;
      if (clamped >= 0.68) {
        nextIndex = 2;
      } else if (clamped >= 0.32) {
        nextIndex = 1;
      } else {
        nextIndex = 0;
      }

      setActive(nextIndex);
    };

    const onScroll = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const goToSlide = (targetIndex: number) => {
    const nextIdx = Math.max(0, Math.min(LAST, targetIndex));
    setActive(nextIdx);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const containerTop = scrollTop + rect.top;
    const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;

    // Slide 0: ~15%, Slide 1: ~50%, Slide 2: ~85%
    const progressOffsets = [0.15, 0.50, 0.85];
    const targetScroll = containerTop + totalScrollable * progressOffsets[nextIdx];

    isNavigatingRef.current = true;
    window.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });

    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 600);
  };

  return (
    <section
      id="services"
      ref={containerRef}
      className="relative min-h-[150vh] md:min-h-[175vh] scroll-mt-6 bg-[rgb(217_217_217/0.44)]"
      aria-labelledby="business-lines-title"
    >
      {/* Sticky presentation viewport */}
      <div className="sticky top-16 md:top-20 z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-center py-8 xl:py-12">
        <HomeContainer>
          <SectionTitle id="business-lines-title">{businessLinesIntro.title}</SectionTitle>
          <p className="mt-2.5 max-w-[811px] text-base font-medium leading-6 text-black">
            {businessLinesIntro.subtitle}
          </p>

          {/* Interactive Pill Tabs */}
          <div className="mt-6 flex flex-wrap gap-2.5 sm:gap-3" role="group" aria-label="Lines of business">
            {businessLines.map((line, index) => {
              const Icon = icons[line.key];
              const isActive = index === active;
              return (
                <button
                  key={line.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "inline-flex h-[52px] sm:h-[58px] items-center gap-2.5 sm:gap-3 rounded-[29.5px] pl-2 pr-5 sm:pr-6 text-[13.5px] sm:text-[14.195px] font-semibold transition-all cursor-pointer shadow-xs",
                    isActive
                      ? "brand-gradient text-black ring-2 ring-brand-400/40"
                      : "bg-white text-black hover:bg-black/5"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-[38px] sm:size-[44px] items-center justify-center rounded-full transition-colors",
                      isActive ? "bg-white" : "bg-[rgb(217_217_217/0.6)]"
                    )}
                  >
                    <Icon />
                  </span>
                  <span>{line.title}</span>
                </button>
              );
            })}
          </div>

          {/* Animated Horizontal Slide Deck */}
          <div className="mt-6 sm:mt-8 overflow-hidden rounded-[25.528px]">
            <div
              className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ transform: `translateX(-${active * 100}%)` }}
            >
              {businessLines.map((line, idx) => (
                <article
                  key={line.key}
                  className="flex min-w-full w-full flex-shrink-0 flex-wrap items-center gap-6 sm:gap-8 rounded-[25.528px] border-[0.912px] border-[#b7b7b7] bg-white p-5 sm:p-8 xl:gap-12 shadow-sm"
                >
                  <div className="min-w-0 flex-[1_1_320px] xl:pl-4">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700">
                      <span>Business Line 0{idx + 1} of 03</span>
                    </div>
                    <h3 className="text-[26px] sm:text-[33px] font-semibold leading-[1.2] text-black xl:text-[40px]">
                      {line.title}
                    </h3>
                    <p className="mt-4 max-w-[520px] text-base sm:text-lg font-medium leading-relaxed text-black">
                      {line.body}
                    </p>
                  </div>
                  <div className="min-w-0 flex-[1.3_1_420px]">
                    <AnimatedIllustration
                      src={line.image}
                      alt={line.imageAlt}
                      overlay={line.overlay}
                      sizes="(min-width: 1280px) 640px, 100vw"
                      className="aspect-[16/10] sm:aspect-[16/11] w-full rounded-[16.411px] xl:rounded-[25px]"
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Bottom Navigation & Controls */}
          <div className="mt-8 flex items-center justify-between border-t-[0.751px] border-[#262626]/20 pt-4">
            <p className="font-sans text-[15.013px] font-medium leading-[1.5] text-[#999]" aria-live="polite">
              <span className="font-bold text-black">{String(active + 1).padStart(2, "0")}</span> of{" "}
              {String(businessLines.length).padStart(2, "0")}
            </p>

            <CarouselControls
              label="line of business"
              gap={7.5}
              canPrev={active > 0}
              canNext={active < LAST}
              onPrev={() => goToSlide(active - 1)}
              onNext={() => goToSlide(active + 1)}
            />
          </div>
        </HomeContainer>
      </div>
    </section>
  );
}
