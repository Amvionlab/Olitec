"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { businessLines, businessLinesIntro } from "@/content/legacy";
import { CarouselControls, HomeContainer, SectionTitle } from "@/components/home/primitives";
import { cn } from "@/lib/cn";
import { AnimatedIllustration } from "./AnimatedIllustration";

const SLIDE_GAP = 32;
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
 * "What Olitec does": the HTML design's three business lines, in the Figma products-band layout
 * (grey band, pill tabs, "01 of 03" counter and round carousel buttons). Slides scroll-snap.
 */
export function BusinessLines() {
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const step = useCallback(() => {
    const first = railRef.current?.querySelector("article");
    return first ? first.getBoundingClientRect().width + SLIDE_GAP : 0;
  }, []);

  const currentIndex = useCallback(() => {
    const s = step();
    return s && railRef.current ? Math.max(0, Math.min(LAST, Math.round(railRef.current.scrollLeft / s))) : 0;
  }, [step]);

  const go = (index: number) => {
    railRef.current?.scrollTo({ left: Math.max(0, Math.min(LAST, index)) * step(), behavior: "smooth" });
  };

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const sync = () => setActive(currentIndex());
    rail.addEventListener("scroll", sync, { passive: true });
    return () => rail.removeEventListener("scroll", sync);
  }, [currentIndex]);

  return (
    <section id="services" className="mt-16 scroll-mt-6 bg-[rgb(217_217_217/0.44)] py-12 xl:mt-[86px] xl:py-[56px]" aria-labelledby="business-lines-title">
      <HomeContainer>
        <SectionTitle id="business-lines-title">{businessLinesIntro.title}</SectionTitle>
        <p className="mt-3 max-w-[811px] text-base font-medium leading-6 text-black">{businessLinesIntro.subtitle}</p>

        <div className="mt-8 flex flex-wrap gap-3" role="group" aria-label="Lines of business">
          {businessLines.map((line, index) => {
            const Icon = icons[line.key];
            const isActive = index === active;
            return (
              <button
                key={line.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => go(index)}
                className={cn(
                  "inline-flex h-[58px] items-center gap-3 rounded-[29.5px] pl-2 pr-6 text-[14.195px] font-semibold transition",
                  isActive ? "brand-gradient text-black" : "bg-white text-black hover:bg-black/5",
                )}
              >
                <span className={cn("flex size-[44px] items-center justify-center rounded-full", isActive ? "bg-white" : "bg-[rgb(217_217_217/0.6)]")}>
                  <Icon />
                </span>
                {line.title}
              </button>
            );
          })}
        </div>

        <div
          ref={railRef}
          className="mt-8 flex snap-x snap-mandatory gap-8 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {businessLines.map((line) => (
            <article
              key={line.key}
              className="flex min-w-0 flex-[0_0_100%] snap-start flex-wrap items-center gap-8 rounded-[25.528px] border-[0.912px] border-[#b7b7b7] bg-white p-5 sm:p-8 xl:gap-12"
            >
              <div className="min-w-0 flex-[1_1_320px] xl:pl-4">
                <h3 className="text-[33.173px] font-semibold leading-[1.2] text-black xl:text-[40px]">{line.title}</h3>
                <p className="mt-5 max-w-[520px] text-lg font-medium leading-7 text-black">{line.body}</p>
              </div>
              <div className="min-w-0 flex-[1.3_1_420px]">
                <AnimatedIllustration
                  src={line.image}
                  alt={line.imageAlt}
                  overlay={line.overlay}
                  sizes="(min-width: 1280px) 640px, 100vw"
                  className="aspect-[16/11] rounded-[16.411px] xl:rounded-[25px]"
                />
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex items-start justify-between border-t-[0.751px] border-[#262626] pt-[15px]">
          <p className="font-nav text-[15.013px] font-medium leading-[1.5] text-[#999]" aria-live="polite">
            <span className="text-black">{String(active + 1).padStart(2, "0")}</span> of {String(businessLines.length).padStart(2, "0")}
          </p>
          <CarouselControls
            label="line of business"
            gap={7.5}
            canPrev={active > 0}
            canNext={active < LAST}
            onPrev={() => go(currentIndex() - 1)}
            onNext={() => go(currentIndex() + 1)}
          />
        </div>
      </HomeContainer>
    </section>
  );
}
