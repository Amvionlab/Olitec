"use client";

import { useEffect, useRef, useState } from "react";

const rings = [1.45, 1.95, 2.55, 3.25, 4.05];

/**
 * Item M7, Option A "Clean sun" for the "Have an application in mind?" band, with live heat:
 * the outline wavers through rising hot air, the surface burns and a golden glow radiates.
 * The heat filters are costly to compute, so they only run while the band is on screen;
 * off screen (and for reduced motion) the sun is a still image.
 */
export function CtaSun() {
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { rootMargin: "100px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (live) svg.unpauseAnimations();
    else svg.pauseAnimations();
  }, [live]);

  return (
    <div ref={ref} className={`pointer-events-none absolute inset-0 overflow-hidden ${live ? "cta-sun-live" : "cta-sun-still"}`}>
      {/* Heat filters for the sun (SVG turbulence, animated) */}
      <svg ref={svgRef} aria-hidden width="0" height="0" className="absolute">
        <defs>
          {/* rising hot air: bends whatever is behind it, flowing upward */}
          <filter id="cta-heat" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.01 0.05" numOctaves="2" seed="7" result="noise">
              <animate attributeName="baseFrequency" dur="11s" values="0.01 0.05;0.013 0.065;0.01 0.05" repeatCount="indefinite" />
            </feTurbulence>
            <feOffset in="noise" result="rising">
              <animate attributeName="dy" dur="2.6s" values="0;-80" repeatCount="indefinite" />
            </feOffset>
            <feDisplacementMap in="SourceGraphic" in2="rising" scale="9" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          {/* burning plasma for the sun's surface */}
          <filter id="cta-plasma" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="4" seed="3">
              <animate attributeName="baseFrequency" dur="14s" values="0.022;0.03;0.022" repeatCount="indefinite" />
            </feTurbulence>
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1   0 0 0 0 0.86   0 0 0 0 0.45   1.6 0 0 0 -0.55"
            />
          </filter>
        </defs>
      </svg>

      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 z-0 size-[230px] -translate-x-1/2 translate-y-[50%] md:left-[76%] md:size-[320px] md:translate-y-[64%] xl:size-[360px]"
      >
        <div className="cta-sun-rise absolute inset-0">
          {/* faint rings around the sun (Item M7) */}
          <svg className="absolute left-1/2 top-1/2 size-[420%] -translate-x-1/2 -translate-y-1/2 overflow-visible" viewBox="-210 -210 420 420" fill="none">
            {rings.map((r, i) => (
              <circle key={r} cx="0" cy="0" r={r * 50} stroke="#FFD69C" strokeOpacity={0.16 - i * 0.025} strokeWidth="0.45" />
            ))}
          </svg>
          {/* radiating heat glow (light-additive so it never turns brown on navy) */}
          <div
            className="cta-heat-glow absolute inset-[-55%] rounded-full mix-blend-screen"
            style={{ background: "radial-gradient(circle, rgb(255 214 110 / 0.42) 0%, rgb(255 200 90 / 0.16) 38%, rgb(255 200 90 / 0) 66%)" }}
          />

          {/* the disc with a live burning surface, its outline wavering through rising hot air */}
          <div className="absolute inset-[-12%] p-[9.68%]" style={{ filter: live ? "url(#cta-heat)" : undefined }}>
          <div
            className="cta-sun-disc relative size-full overflow-hidden rounded-full"
            style={{ background: "radial-gradient(circle at 50% 50%, #FFD04A 0%, #FFC23A 42%, #FBAA2A 74%, #F7961C 100%)" }}
          >
            <svg className="absolute inset-0 size-full mix-blend-soft-light" viewBox="0 0 200 200" preserveAspectRatio="none">
              {live && <rect width="200" height="200" filter="url(#cta-plasma)" />}
            </svg>
            <span
              className="absolute inset-0 rounded-full"
              style={{ background: "radial-gradient(circle at 50% 45%, rgb(255 246 200 / 0.45) 0%, rgb(255 246 200 / 0) 55%)" }}
            />
          </div>
          </div>
        </div>
      </div>

    </div>
  );
}
