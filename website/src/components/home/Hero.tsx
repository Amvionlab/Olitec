import Image from "next/image";
import Link from "next/link";
import { legacyHero, legacyLead } from "@/content/legacy";

/**
 * Enterprise Hero matching Olitec Review Items M1, M3, and M15:
 * Warm apricot radial glow, rich navy copy, deep green "for India" accent,
 * deep green "Explore our products" button, no dark left tint, no projects glass card.
 * Responsive: on mobile (<768px), text & button on top, framed illustration below.
 */
export function Hero() {
  return (
    <section
      className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1680px] px-4 sm:px-8 xl:px-12 pt-2 pb-6"
      aria-labelledby="hero-title"
    >
      <div
        className="relative overflow-hidden rounded-[32px] sm:rounded-[48px] xl:rounded-[56px] border border-[#FFDDAA]/50 shadow-[0_20px_60px_rgb(0_0_0/0.06)]"
        style={{
          background: `
            radial-gradient(ellipse 65% 85% at 20% 40%, #FFD69C 0%, #FFEBCE 40%, #FFF4E2 70%, #FFF7EA 100%)
          `,
        }}
      >
        {/* Layout: Split / Overlay */}
        <div className="relative flex flex-col justify-between md:min-h-[580px] xl:min-h-[640px] md:flex-row md:items-center">
          {/* Left Text Column */}
          <div className="relative z-10 flex flex-col justify-center px-6 py-10 sm:px-12 md:max-w-[58%] lg:max-w-[52%] xl:px-16 xl:py-16">
            <h1
              id="hero-title"
              className="text-[34px] font-bold leading-[1.1] tracking-tight text-[#161E2C] sm:text-[46px] md:text-[52px] xl:text-[62px]"
            >
              {legacyHero.titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <span className="block text-[#1F7A34]">{legacyHero.titleAccent}</span>
            </h1>

            <p className="mt-5 max-w-[540px] text-base font-medium leading-relaxed text-[#2A323F] sm:text-lg xl:text-[18px]">
              {legacyLead.statement}
            </p>

            <div className="mt-8">
              <Link
                href="/products"
                className="inline-flex h-[52px] items-center gap-3.5 rounded-full bg-[#1F7A34] pl-7 pr-3 text-sm font-bold text-white shadow-md transition hover:bg-[#186429] active:scale-95"
              >
                <span>{legacyHero.cta.label}</span>
                <span className="flex size-9 items-center justify-center rounded-full bg-white/20 text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>

          {/* Right Illustration Column */}
          <div className="relative h-[280px] w-full sm:h-[360px] md:absolute md:inset-y-0 md:right-0 md:h-full md:w-[48%] lg:w-[50%]">
            <div className="relative h-full w-full overflow-hidden p-4 md:p-6 lg:p-8">
              <div className="relative h-full w-full overflow-hidden rounded-[24px] sm:rounded-[36px] shadow-sm">
                <Image
                  src={legacyHero.image}
                  alt={legacyHero.imageAlt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
