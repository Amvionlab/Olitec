"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * "Inverters and energy storage" slide: a short story of one day in a home with Olitec.
 *
 *  Day   — the sun is up; solar power flows down into the OLI-1H inverter, which runs the home
 *          and sends the surplus to the OLB-5.12 battery stack (the gauge fills up).
 *  Night — the room dims; the battery takes over and powers the lamp through the inverter.
 *
 * Built from the original 3D product renders, layered in a utility room, with CSS-only motion.
 * Reduced motion: a still daytime scene.
 */

type Phase = "day" | "night";

const PHASE_MS: Record<Phase, number> = { day: 6500, night: 5500 };

const story: Record<Phase, { label: string; text: string }> = {
  day: { label: "Day", text: "Solar runs the loads first and the surplus charges the battery." },
  night: { label: "Night", text: "Stored solar energy from the battery carries the loads." },
};

/** A conduit with power "dots" moving through it. */
function Conduit({
  className,
  vertical,
  flowing,
  reverse,
}: {
  className: string;
  vertical?: boolean;
  flowing: boolean;
  reverse?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "absolute overflow-hidden rounded-full shadow-[2px_2px_6px_rgba(40,30,10,0.28)]",
        vertical ? "w-[10px] bg-gradient-to-r" : "h-[10px] bg-gradient-to-b",
        "from-[#9AA0A6] via-[#E6E9EB] to-[#8A9096]",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-700",
          flowing ? "opacity-100" : "opacity-0",
          vertical ? "scene-flow-y" : "scene-flow-x",
          reverse && "scene-flow-reverse",
        )}
        style={{
          backgroundImage: "radial-gradient(circle at 50% 50%, #FFB938 0 2.6px, transparent 3.2px)",
          backgroundSize: vertical ? "10px 22px" : "22px 10px",
          filter: "drop-shadow(0 0 3px rgba(255,170,40,0.9))",
        }}
      />
    </div>
  );
}

export function InstallationScene({ className, playing = true }: { className?: string; playing?: boolean }) {
  const [phase, setPhase] = useState<Phase>("day");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!playing || reduced) return;
    const t = setTimeout(() => setPhase((p) => (p === "day" ? "night" : "day")), PHASE_MS[phase]);
    return () => clearTimeout(t);
  }, [phase, playing, reduced]);

  const night = !reduced && phase === "night";
  const moving = playing && !reduced;
  const now = story[night ? "night" : "day"];

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      role="img"
      aria-label="An Olitec OLI-1H hybrid inverter on a utility-room wall, wired to an Olitec OLB-5.12 battery stack. By day solar power runs the home and charges the battery; at night the battery powers the home."
    >
      {/* Wall: warm plaster lit from the window */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 90% at 30% 20%, #FFF6E6 0%, #F3E6D0 38%, #DCC9AC 72%, #BFA987 100%)",
        }}
      />

      {/* Window, upper left: the sky changes from day to night */}
      <div aria-hidden className="absolute left-[28%] top-[9%] hidden h-[34%] w-[13%] lg:block">
        <div className="absolute inset-0 overflow-hidden rounded-[10px] shadow-[inset_0_0_0_6px_#F7F0E4,0_10px_24px_rgba(60,40,15,0.25)]">
          <div
            className="absolute inset-0 transition-opacity duration-[1500ms]"
            style={{ opacity: night ? 0 : 1, background: "linear-gradient(180deg, #A9D8F2 0%, #D8EEF6 55%, #FFF1D6 100%)" }}
          >
            <div
              className="absolute left-[58%] top-[22%] size-[30%] rounded-full"
              style={{
                background: "radial-gradient(circle, #FFE58A 0%, #FFC23A 60%, #F7961C 100%)",
                boxShadow: "0 0 24px 8px rgba(255,200,80,0.6)",
              }}
            />
          </div>
          <div
            className="absolute inset-0 transition-opacity duration-[1500ms]"
            style={{ opacity: night ? 1 : 0, background: "linear-gradient(180deg, #121A33 0%, #22305A 100%)" }}
          >
            <div className="absolute left-[30%] top-[20%] size-[20%] rounded-full bg-[#F4F1E6] shadow-[0_0_16px_4px_rgba(244,241,230,0.35)]" />
            <div className="absolute left-[24%] top-[16%] size-[20%] rounded-full bg-[#121A33]" />
            {[
              [70, 18],
              [80, 42],
              [58, 62],
              [18, 70],
              [85, 76],
              [42, 44],
            ].map(([x, y]) => (
              <span key={`${x}-${y}`} className="absolute size-[3px] rounded-full bg-white/80" style={{ left: `${x}%`, top: `${y}%` }} />
            ))}
          </div>
          <div className="absolute inset-y-0 left-1/2 w-[6px] -translate-x-1/2 bg-[#F7F0E4]" />
          <div className="absolute inset-x-0 top-1/2 h-[6px] -translate-y-1/2 bg-[#F7F0E4]" />
        </div>
      </div>
      {/* Sunlight falling from the window */}
      <div
        aria-hidden
        className="absolute left-[26%] top-[40%] hidden h-[40%] w-[24%] transition-opacity duration-[1500ms] lg:block"
        style={{
          opacity: night ? 0 : 0.5,
          background: "linear-gradient(170deg, rgba(255,243,214,0.95) 0%, rgba(255,243,214,0) 75%)",
          clipPath: "polygon(8% 0, 62% 0, 100% 100%, 30% 100%)",
        }}
      />

      {/* Floor */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[62%] lg:h-[22%]"
        style={{
          background: "linear-gradient(180deg, #A89478 0%, #8C7A62 30%, #6F604D 100%)",
          boxShadow: "inset 0 10px 18px -8px rgba(40,30,10,0.45)",
        }}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{ backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)", backgroundSize: "120px 100%" }}
        />
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-[62%] h-[10px] bg-[#EFE4D2] shadow-[0_2px_4px_rgba(40,30,10,0.25)] lg:bottom-[22%]" />

      {/* Night falls over the room */}
      <div aria-hidden className="absolute inset-0 bg-[#0F1529] transition-opacity duration-[1500ms]" style={{ opacity: night ? 0.5 : 0 }} />

      {/* Pool of lamp light at night */}
      <div
        aria-hidden
        className="absolute left-[30%] top-[18%] hidden h-[75%] w-[36%] transition-opacity duration-700 lg:block"
        style={{
          opacity: night ? 1 : 0,
          background: "radial-gradient(ellipse 50% 60% at 50% 0%, rgba(255,214,140,0.6) 0%, rgba(255,214,140,0) 70%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Pendant lamp: the home's loads, lit at night by the battery */}
      <div aria-hidden className="absolute left-[44%] top-0 hidden h-[30%] w-[7%] lg:block">
        <div className="absolute left-1/2 top-0 h-[60%] w-[2px] -translate-x-1/2 bg-[#5B5348]" />
        <div
          className="absolute left-1/2 top-[56%] h-[24%] w-full -translate-x-1/2 bg-gradient-to-b from-[#2A323F] to-[#161E2C]"
          style={{ clipPath: "polygon(24% 0, 76% 0, 100% 100%, 0 100%)" }}
        />
        <div
          className="absolute left-1/2 top-[76%] aspect-square w-[40%] -translate-x-1/2 rounded-full transition-all duration-700"
          style={{
            background: night ? "radial-gradient(circle, #FFF6D8 0%, #FFD36E 70%)" : "#E9E2D3",
            boxShadow: night ? "0 0 24px 12px rgba(255,205,110,0.75)" : "none",
          }}
        />
      </div>

      {/* Conduits with power moving through them (desktop) */}
      <div className="hidden lg:block">
        {/* from the rooftop solar array down into the inverter: daytime only */}
        <Conduit vertical className="left-[62%] top-0 h-[15%]" flowing={moving && !night} />
        {/* inverter → lamp, always carrying the load */}
        <Conduit vertical className="left-[55.5%] top-[4%] h-[11%]" flowing={moving} reverse />
        <Conduit className="left-[47.5%] top-[4%] w-[8.6%]" flowing={moving} reverse />
        {/* inverter ↔ battery: charging by day, discharging at night */}
        <Conduit vertical className="left-[60%] top-[64%] h-[8%]" flowing={moving} reverse={night} />
        <Conduit className="left-[60%] top-[71%] w-[13%]" flowing={moving} reverse={night} />
      </div>

      {/* Phones and tablets: a compact version of the same story */}
      <div className="lg:hidden">
        {/* rooftop solar feed into the inverter (day) */}
        <Conduit vertical className="left-[23%] top-0 h-[6%]" flowing={moving && !night} />
        {/* inverter <-> battery: charging by day, discharging at night */}
        <Conduit className="left-[36%] top-[22%] w-[24%]" flowing={moving} reverse={night} />
        {/* pendant lamp between them, lit at night by the battery */}
        <div aria-hidden className="absolute left-[42%] top-0 h-[15%] w-[9%]">
          <div className="absolute left-1/2 top-0 h-[55%] w-[2px] -translate-x-1/2 bg-[#5B5348]" />
          <div
            className="absolute left-1/2 top-[52%] h-[26%] w-full -translate-x-1/2 bg-gradient-to-b from-[#2A323F] to-[#161E2C]"
            style={{ clipPath: "polygon(24% 0, 76% 0, 100% 100%, 0 100%)" }}
          />
          <div
            className="absolute left-1/2 top-[74%] aspect-square w-[42%] -translate-x-1/2 rounded-full transition-all duration-700"
            style={{
              background: night ? "radial-gradient(circle, #FFF6D8 0%, #FFD36E 70%)" : "#E9E2D3",
              boxShadow: night ? "0 0 18px 8px rgba(255,205,110,0.8)" : "none",
            }}
          />
        </div>
        <div
          aria-hidden
          className="absolute left-[28%] top-[10%] h-[30%] w-[40%] transition-opacity duration-700"
          style={{
            opacity: night ? 1 : 0,
            background: "radial-gradient(ellipse 50% 60% at 50% 0%, rgba(255,214,140,0.55) 0%, rgba(255,214,140,0) 70%)",
            mixBlendMode: "screen",
          }}
        />
        {/* status chip with the battery level */}
        <div
          aria-hidden
          className="absolute right-[3%] top-2.5 z-[3] w-[38%] min-w-[128px] rounded-xl bg-[#161E2C]/80 px-2.5 py-1.5 text-white shadow-[0_6px_14px_rgba(12,17,26,0.3)] backdrop-blur-md"
        >
          <p className="flex items-center gap-1.5 text-[10.5px] font-semibold leading-tight">
            <span
              className={cn(
                "size-2 shrink-0 rounded-full transition-colors duration-700",
                night ? "bg-[#9DB4FF] shadow-[0_0_6px_#9DB4FF]" : "bg-[#FFC23A] shadow-[0_0_6px_#FFC23A]",
              )}
            />
            <span>
              <strong className="text-[#FCBC62]">{now.label}</strong> · {night ? "Battery powers home" : "Solar charging"}
            </span>
          </p>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#41A145] to-[#7CC96E]"
              style={{
                width: reduced ? "80%" : night ? "38%" : "96%",
                transition: `width ${night ? PHASE_MS.night : PHASE_MS.day}ms linear`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Inverter on the wall, with a live waveform on its screen */}
      <div className="absolute left-[10%] top-[5%] h-[27%] lg:left-[52%] lg:top-[14%] lg:h-[52%]">
        <div className="relative h-full">
          <Image
            src="/images/models/oli-1h-preview.webp"
            alt=""
            width={401}
            height={555}
            sizes="(min-width: 768px) 280px, 160px"
            className="h-full w-auto"
            style={{ filter: "drop-shadow(14px 18px 16px rgba(60,40,15,0.38))" }}
          />
          <div aria-hidden className="absolute left-[47%] top-[31.5%] h-[13%] w-[30%] overflow-hidden">
            <svg viewBox="0 0 200 40" preserveAspectRatio="none" className={cn("h-full w-[200%]", moving && "scene-wave")}>
              <path
                d="M0 20 Q 12.5 4 25 20 T 50 20 T 75 20 T 100 20 T 125 20 T 150 20 T 175 20 T 200 20"
                fill="none"
                stroke="#7CF3A6"
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Battery stack on the floor, with its charge gauge */}
      <div className="absolute bottom-[62%] right-[8%] h-[24%] lg:bottom-[22%] lg:right-[7%] lg:h-[58%]">
        <div className="relative h-full">
          <Image
            src="/images/models/olb-battery-stack-preview.webp"
            alt=""
            width={508}
            height={580}
            sizes="(min-width: 768px) 340px, 180px"
            className="h-full w-auto"
            style={{ filter: "drop-shadow(10px 6px 10px rgba(40,25,10,0.35))" }}
          />
          <div
            aria-hidden
            className="absolute -top-11 left-1/2 hidden w-[160px] -translate-x-1/2 rounded-xl border border-white/70 bg-white/85 px-3 py-2 shadow-[0_6px_16px_rgba(40,30,10,0.18)] backdrop-blur-sm lg:block"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-[#161E2C]">
              <span>Battery</span>
              <span className={night ? "text-[#C46E0E]" : "text-[#1F7A34]"}>{night ? "Powering home" : "Charging"}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E6E2D8]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#41A145] to-[#7CC96E]"
                style={{
                  width: reduced ? "80%" : night ? "38%" : "96%",
                  transition: `width ${night ? PHASE_MS.night : PHASE_MS.day}ms linear`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        aria-hidden
        className="absolute bottom-[60.5%] right-[6%] h-[3%] w-[40%] rounded-[50%] bg-black/35 blur-md lg:bottom-[20.5%] lg:right-[6%] lg:w-[26%]"
      />

      {/* Story caption, top right */}
      <div
        aria-live="polite"
        className="absolute left-5 top-5 z-[3] hidden max-w-[300px] items-start gap-2.5 rounded-2xl bg-[#161E2C]/75 px-4 py-3 text-white shadow-[0_10px_24px_rgba(12,17,26,0.3)] backdrop-blur-md lg:flex xl:left-8 xl:top-7"
      >
        <span
          className={cn(
            "mt-1 size-2.5 shrink-0 rounded-full transition-colors duration-700",
            night ? "bg-[#9DB4FF] shadow-[0_0_8px_#9DB4FF]" : "bg-[#FFC23A] shadow-[0_0_8px_#FFC23A]",
          )}
        />
        <p className="text-[13px] leading-snug">
          <strong className="font-bold text-[#FCBC62]">{now.label}. </strong>
          {now.text}
        </p>
      </div>
    </div>
  );
}
