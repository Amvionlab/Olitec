"use client";

import { useEffect, useRef, useState } from "react";
import { businessLines, businessLinesIntro } from "@/content/legacy";
import { CarouselControls, HomeContainer, SectionTitle } from "@/components/home/primitives";
import { cn } from "@/lib/cn";
import { InstallationScene } from "./InstallationScene";
import { CrossfadeImageSlideshow } from "./CrossfadeImageSlideshow";
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
 * "What Olitec does": three slides, switched by the tabs, the arrows or a swipe.
 * The section scrolls with the page like every other section (no pinning or scroll-jacking),
 * so the page never sticks or jumps while scrolling past it.
 */
export function BusinessLines() {
  const containerRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [loadAllSlides, setLoadAllSlides] = useState(false);
  const [inView, setInView] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setLoadAllSlides(true);
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setLoadAllSlides(true);
      },
      { rootMargin: "350px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const goToSlide = (targetIndex: number) => {
    setLoadAllSlides(true);
    setActive(Math.max(0, Math.min(LAST, targetIndex)));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    goToSlide(active + (dx < 0 ? 1 : -1));
  };

  return (
    <section
      id="services"
      ref={containerRef}
      className="relative scroll-mt-24 bg-[rgb(217_217_217/0.44)]"
      aria-labelledby="business-lines-title"
    >
      <div className="py-14 xl:py-20">
        <HomeContainer>
          {/* Title & 3 Tab Buttons in the Same Row */}
          <div className="flex flex-col gap-3.5 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <SectionTitle id="business-lines-title">{businessLinesIntro.title}</SectionTitle>
              <p className="mt-1.5 max-w-[620px] text-sm sm:text-base font-medium leading-relaxed text-black">
                {businessLinesIntro.subtitle}
              </p>
            </div>

            {/* Interactive Pill Tabs */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0" role="group" aria-label="Lines of business">
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
                      "inline-flex h-[44px] sm:h-[48px] items-center gap-2 sm:gap-2.5 rounded-[28px] pl-1.5 pr-4 sm:pr-5 text-[13px] sm:text-[13.5px] font-semibold transition-all cursor-pointer shadow-xs",
                      isActive
                        ? "brand-gradient text-black ring-2 ring-brand-400/40"
                        : "bg-white text-black hover:bg-black/5"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-[32px] sm:size-[36px] items-center justify-center rounded-full transition-colors",
                        isActive ? "bg-white" : "bg-[rgb(217_217_217/0.6)]"
                      )}
                    >
                      <Icon />
                    </span>
                    <span className="whitespace-nowrap">{line.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Animated Horizontal Slide Deck */}
          <div
            className="mt-6 sm:mt-7 overflow-hidden rounded-[25.528px] touch-pan-y"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ transform: `translateX(-${active * 100}%)` }}
            >
              {businessLines.map((line, idx) => (
                
<article
  key={line.key}
  inert={active !== idx}
  className="relative isolate min-w-full w-full shrink-0 min-h-[460px] sm:min-h-[500px] xl:min-h-[520px] overflow-hidden rounded-[25px] bg-[#0C111A]"
>
  {/* Background image — defer slides 1 & 2 until #services nears viewport */}
  <div className="absolute inset-0 z-0">
    {(idx === 0 || loadAllSlides || active === idx) &&
      (line.key === "storage" ? (
        <InstallationScene playing={inView && active === idx} />
      ) : (
        <CrossfadeImageSlideshow
          images={[...line.images]}
          alt={line.imageAlt}
          paused={!inView || active !== idx}
          className="h-full w-full"
        />
      ))}
  </div>

  {/* Text readability gradient */}
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 z-[1]
      bg-[linear-gradient(to_top,rgba(12,17,26,0.8)_0%,rgba(12,17,26,0.62)_30%,rgba(12,17,26,0.22)_52%,transparent_68%)]
      md:bg-[radial-gradient(circle_at_bottom_left,rgba(12,17,26,0.8)_0%,rgba(12,17,26,0.62)_30%,rgba(12,17,26,0.22)_52%,transparent_68%)]"
  />

  {/* Text directly on image */}
  <div className="relative z-[2] flex min-h-[460px] sm:min-h-[500px] xl:min-h-[520px] items-end p-6 sm:p-10 xl:p-14">
    <div className="max-w-[650px]">
      <p
        className="mb-3 text-xs sm:text-sm font-bold uppercase tracking-[0.16em] text-[#FCBC62]"
        style={{ textShadow: "0 2px 10px rgba(0,0,0,0.55)" }}
      >
        Business Line 0{idx + 1} of 03
      </p>

      <h3
        className="text-[27px] sm:text-[36px] xl:text-[42px] font-bold leading-[1.15] text-white"
        style={{ textShadow: "0 2px 10px rgba(0,0,0,0.55)" }}
      >
        {line.title}
      </h3>

      <p
        className="mt-4 max-w-[600px] text-[15px] sm:text-lg font-medium leading-relaxed text-[#F4F1EA]"
        style={{ textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}
      >
        {line.body}
      </p>
    </div>
  </div>
</article>

              ))}
            </div>
          </div>

          {/* Bottom Navigation & Controls */}
          <div className="mt-7 sm:mt-8 flex items-center justify-between border-t-[0.751px] border-[#262626]/20 pt-4">
            <p className="font-sans text-[15.013px] font-medium leading-[1.5] text-[#525252]" aria-live="polite">
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
