
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

interface CrossfadeImageSlideshowProps {
  images: string[];
  alt: string;
  className?: string;
}

const INTERVAL = 5000;
const FADE_DURATION = 1200;

export function CrossfadeImageSlideshow({
  images,
  alt,
  className,
}: CrossfadeImageSlideshowProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [fadeIn, setFadeIn] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [resetTimer, setResetTimer] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const updateMotionPreference = () => {
      setReducedMotion(mediaQuery.matches);
    };

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || images.length <= 1) return;

    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    let fadeFrame1 = 0;
    let fadeFrame2 = 0;

    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % images.length;

      setPreviousIndex(activeIndex);
      setActiveIndex(nextIndex);
      setFadeIn(false);

      fadeFrame1 = requestAnimationFrame(() => {
        fadeFrame2 = requestAnimationFrame(() => {
          setFadeIn(true);
        });
      });

      fadeTimer = setTimeout(() => {
        setPreviousIndex(null);
        setFadeIn(false);
      }, FADE_DURATION);
    }, INTERVAL);

    return () => {
      clearInterval(interval);
      if (fadeTimer) clearTimeout(fadeTimer);
      cancelAnimationFrame(fadeFrame1);
      cancelAnimationFrame(fadeFrame2);
    };
  }, [activeIndex, images.length, reducedMotion, resetTimer]);

  const showImage = (index: number) => {
    if (index === activeIndex) return;

    setPreviousIndex(null);
    setFadeIn(false);
    setActiveIndex(index);
    setResetTimer((current) => current + 1);
  };

  if (!images.length) return null;

  return (
    <div
      className={cn("relative isolate h-full w-full overflow-hidden", className)}
      role="region"
      aria-label="Project images"
      aria-roledescription="carousel"
    >
      {previousIndex !== null && (
        <Image
          src={images[previousIndex]}
          alt=""
          fill
          sizes="(min-width: 1280px) 1200px, 100vw"
          className="z-0 object-cover"
          aria-hidden="true"
        />
      )}

      <Image
        src={images[activeIndex]}
        alt={alt}
        fill
        loading="lazy"
        sizes="(min-width: 1280px) 1200px, 100vw"
        className="z-[1] object-cover transition-opacity ease-in-out"
        style={{
          opacity: previousIndex === null || fadeIn ? 1 : 0,
          transitionDuration: `${FADE_DURATION}ms`,
        }}
      />

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Show image ${index + 1}`}
            aria-current={activeIndex === index ? "true" : undefined}
            onClick={() => showImage(index)}
            className={cn(
              "h-2.5 w-2.5 rounded-full border border-white transition-colors",
              activeIndex === index ? "bg-white" : "bg-white/35"
            )}
          />
        ))}
      </div>
    </div>
  );
}
