"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/cn";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
      setScrollProgress(progress);

      // Show button after scrolling down 280px
      if (scrollY > 280) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Circular progress math (radius: 20 -> circumference = 2 * PI * 20 ≈ 125.66)
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-40 transition-all duration-400 ease-out",
        visible
          ? "translate-y-0 opacity-100 scale-100 pointer-events-auto"
          : "translate-y-6 opacity-0 scale-75 pointer-events-none",
      )}
    >
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top of page"
        className="group relative flex size-12 items-center justify-center rounded-full bg-black text-white shadow-[0_10px_25px_rgb(0_0_0/0.25)] transition-all duration-300 hover:scale-110 hover:shadow-[0_14px_30px_rgb(249_159_30/0.35)] active:scale-95"
      >
        {/* SVG Circular Scroll Progress Ring */}
        <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 48 48">
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="2.5"
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="#f99f1e"
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-150 ease-out"
          />
        </svg>

        {/* Up Arrow Icon with hover animation */}
        <span className="relative z-10 transition-transform duration-300 group-hover:-translate-y-1">
          <ArrowUp className="size-5 text-white group-hover:text-brand-300 transition-colors" strokeWidth={2.5} />
        </span>

        {/* Tooltip on hover */}
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-0.5 text-[11px] font-semibold text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 pointer-events-none">
          Back to Top
        </span>
      </button>
    </div>
  );
}
