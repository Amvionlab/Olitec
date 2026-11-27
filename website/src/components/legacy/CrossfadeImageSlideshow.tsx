"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

interface CrossfadeImageSlideshowProps {
  images: string[];
  alt: string;
  className?: string;
  /** Pause cycling (e.g. while the slide is not the visible one). */
  paused?: boolean;
}

/** Item M14: about 5 seconds per image, 1.2 second crossfade, looping. */
const INTERVAL = 5000;
const FADE_DURATION = 1200;

/**
 * Crossfade without a washed-out look: every image stays mounted (so the next one is already
 * decoded), the incoming image fades in ON TOP of the current one, and the current image stays
 * fully visible underneath until the fade has finished. Reduced motion → first image only.
 */
export function CrossfadeImageSlideshow({ images, alt, className, paused = false }: CrossfadeImageSlideshowProps) {
  const [active, setActive] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  // The 2nd and 3rd images are only added once the page has settled, so they never
  // compete with the first paint (they are needed 5 seconds later at the earliest).
  const [primed, setPrimed] = useState(false);

  useEffect(() => {
    if (paused) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const t = setTimeout(() => {
      if (w.requestIdleCallback) w.requestIdleCallback(() => setPrimed(true), { timeout: 2000 });
      else setPrimed(true);
    }, 1500);
    return () => clearTimeout(t);
  }, [paused]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion || paused || !primed || images.length <= 1) return;
    const timer = setTimeout(() => {
      setPrevious(active);
      setActive((active + 1) % images.length);
    }, INTERVAL);
    return () => clearTimeout(timer);
  }, [active, images.length, reducedMotion, paused, primed]);

  // Once the fade is complete the old image can drop to the back of the stack.
  useEffect(() => {
    if (previous === null) return;
    const timer = setTimeout(() => setPrevious(null), FADE_DURATION + 50);
    return () => clearTimeout(timer);
  }, [previous]);

  const showImage = (index: number) => {
    if (index === active) return;
    setPrevious(active);
    setActive(index);
  };

  if (!images.length) return null;
  const shown = reducedMotion ? 0 : active;

  return (
    <div
      className={cn("relative isolate h-full w-full overflow-hidden", className)}
      role="region"
      aria-label="Project images"
      aria-roledescription="carousel"
    >
      {images.map((src, index) => {
        const isActive = index === shown;
        const isPrevious = index === previous && !isActive;
        if (index !== 0 && !primed && !isActive) return null;
        const small = src.replace(/\.webp$/, "-720.webp");
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            srcSet={`${small} 720w, ${src} 1280w`}
            sizes="(min-width: 1280px) 1200px, (min-width: 768px) 92vw, calc(100vw - 32px)"
            alt={isActive ? alt : ""}
            aria-hidden={isActive ? undefined : true}
            width={1280}
            height={720}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover object-center"
            style={{
              opacity: isActive || isPrevious ? 1 : 0,
              zIndex: isActive ? 2 : isPrevious ? 1 : 0,
              transition: isActive ? `opacity ${FADE_DURATION}ms ease-in-out` : "none",
            }}
          />
        );
      })}

      {images.length > 1 && !reducedMotion && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 md:left-auto md:right-6 md:translate-x-0">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Show image ${index + 1} of ${images.length}`}
              aria-current={active === index ? "true" : undefined}
              onClick={() => showImage(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                active === index ? "w-5 bg-white" : "w-2 bg-white/45 hover:bg-white/70",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
