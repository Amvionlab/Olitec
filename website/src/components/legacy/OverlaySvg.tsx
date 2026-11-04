"use client";

import { useEffect, useRef } from "react";

/**
 * Animated SVG layer of an illustration. Animations are paused while the illustration is off screen,
 * so pages with several illustrations do not keep the browser busy (see `.olx[data-paused]` in globals.css).
 */
export function OverlaySvg({ viewBox, markup }: { viewBox: string; markup: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) svg.removeAttribute("data-paused");
      else svg.setAttribute("data-paused", "");
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      className="olx pointer-events-none absolute inset-0 size-full"
      aria-hidden
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid slice"
      // Static markup from our own design file, not user input.
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
