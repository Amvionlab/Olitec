import { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SlimPageBannerProps {
  title: string;
  accentWords?: string;
  lead: string;
  children?: ReactNode;
  className?: string;
}

export function SlimPageBanner({
  title,
  accentWords,
  lead,
  children,
  className,
}: SlimPageBannerProps) {
  // If accentWords is specified, split title and highlight accentWords
  let beforeAccent = title;
  let accent = "";
  let afterAccent = "";

  if (accentWords && title.includes(accentWords)) {
    const idx = title.indexOf(accentWords);
    beforeAccent = title.slice(0, idx);
    accent = accentWords;
    afterAccent = title.slice(idx + accentWords.length);
  }

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[1440px] px-4 sm:px-8 xl:px-12 pt-4 pb-0 select-none",
        className,
      )}
    >
      <div
        className="relative overflow-hidden rounded-t-[32px] sm:rounded-t-[40px] px-6 py-8 sm:px-10 sm:py-10 xl:px-14 xl:py-12"
        style={{
          background: `
            radial-gradient(ellipse 65% 90% at 95% 85%, #FCBE68 0%, transparent 60%),
            radial-gradient(ellipse 55% 75% at 90% 10%, #B0DCB2 0%, transparent 55%),
            radial-gradient(ellipse 60% 80% at 5% 50%, #FFDDAA 0%, transparent 65%),
            #FFF7EA
          `,
        }}
      >
        {/* Soft fading gradient at the bottom edge so the banner blends seamlessly into the white page */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/60 to-transparent"
          aria-hidden
        />

        {/* Fine wave lines across right half (hidden on small mobile) */}
        <svg
          className="pointer-events-none absolute right-0 top-0 hidden h-full w-1/2 opacity-35 sm:block"
          viewBox="0 0 400 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0 60 C80 20, 160 110, 240 50 C320 -10, 360 80, 400 40"
            stroke="#161E2C"
            strokeWidth="0.75"
            strokeOpacity="0.18"
            fill="none"
          />
          <path
            d="M0 80 C90 40, 170 130, 250 70 C330 10, 370 100, 400 60"
            stroke="#D45C0A"
            strokeWidth="0.75"
            strokeOpacity="0.22"
            fill="none"
          />
          <path
            d="M0 100 C100 60, 180 150, 260 90 C340 30, 380 120, 400 80"
            stroke="#1F7A34"
            strokeWidth="0.75"
            strokeOpacity="0.18"
            fill="none"
          />
          <path
            d="M0 120 C110 80, 190 170, 270 110 C350 50, 390 140, 400 100"
            stroke="#FCBE68"
            strokeWidth="1"
            strokeOpacity="0.3"
            fill="none"
          />
        </svg>

        {/* Two-line clean content: Heading on line 1, single sentence on line 2 */}
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-[840px]">
            <h1 className="text-2xl font-bold tracking-tight text-[#161E2C] sm:text-3xl xl:text-[34px] xl:leading-[1.18]">
              {accent ? (
                <>
                  {beforeAccent}
                  <span className="text-[#D45C0A]">{accent}</span>
                  {afterAccent}
                </>
              ) : (
                title
              )}
            </h1>
            <p className="mt-2 text-sm font-medium leading-relaxed text-[#2A323F] sm:text-base xl:text-[17px]">
              {lead}
            </p>
          </div>

          {children && (
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
