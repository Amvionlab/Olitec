"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}

/**
 * 100% Hydration-Safe Scroll Reveal Component.
 * Animates elements into view as the user scrolls down.
 * Initial state is identical on SSR and client (zero hydration mismatch).
 */
export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getInitialTransform = () => {
    switch (direction) {
      case "up":
        return "translate-y-10";
      case "down":
        return "-translate-y-10";
      case "left":
        return "translate-x-10";
      case "right":
        return "-translate-x-10";
      default:
        return "translate-y-10";
    }
  };

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: "800ms",
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className={cn(
        "transition-all will-change-[opacity,transform]",
        isVisible
          ? "opacity-100 translate-x-0 translate-y-0"
          : cn("opacity-0", getInitialTransform()),
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ScrollRevealProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
