import Image from "next/image";
import Link from "next/link";
import { legacyHero, legacyLead } from "@/content/legacy";

/**
 * Enterprise Hero matching Olitec Review Items M1, M3, and M15:
 * Incorporates the official panoramic banner illustration (1024x409 aspect ratio).
 * - Desktop: Full wide panoramic background with soft ambient apricot wash on left for crisp navy typography.
 * - Mobile: Heading, statement and button on top, followed by the framed panoramic banner illustration below.
 */
export function Hero() {
  return (
    <section
      className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1680px] px-4 sm:px-8 xl:px-12 pt-2 pb-6"
      aria-labelledby="hero-title"
    >
      <div
        className="relative overflow-hidden rounded-[32px] sm:rounded-[48px] xl:rounded-[56px] border border-[#FFDDAA]/60 shadow-[0_20px_60px_rgb(0_0_0/0.06)]"
        style={{
          background: `
            radial-gradient(ellipse 65% 85% at 20% 40%, #FFD69C 0%, #FFEBCE 40%, #FFF4E2 70%, #FFF7EA 100%)
          `,
        }}
      >
        {/* ================= DESKTOP LAYOUT (>=768px): Integrated Panoramic Banner ================= */}
        <div className="relative hidden md:flex md:min-h-[540px] lg:min-h-[580px] xl:min-h-[620px] items-center">
          {/* Panoramic background illustration */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <Image
              src="/images/legacy/hero-banner.jpg"
              alt={legacyHero.imageAlt}
              fill
              priority
              sizes="(min-width: 1440px) 1560px, 100vw"
              className="object-cover object-right lg:object-center"
            />
            {/* Soft apricot/cream wash on left to ensure 100% crystal-clear readability of navy text */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#FFF7EA] from-25% via-[#FFF7EA]/85 via-50% to-transparent to-75%"
              aria-hidden
            />
          </div>

          {/* Left Text Content */}
          <div className="relative z-10 max-w-[640px] px-8 py-12 lg:px-16 xl:px-20">
            <h1
              id="hero-title"
              className="text-[38px] font-bold leading-[1.08] tracking-tight text-[#161E2C] lg:text-[50px] xl:text-[58px]"
            >
              {legacyHero.titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <span className="block text-[#1F7A34]">{legacyHero.titleAccent}</span>
            </h1>

            <p className="mt-5 max-w-[520px] text-base font-medium leading-relaxed text-[#2A323F] lg:text-[17px] xl:text-[18px]">
              {legacyLead.statement}
            </p>

            <div className="mt-8">
              <Link
                href="/products"
                className="inline-flex h-[52px] items-center gap-3.5 rounded-full bg-[#1F7A34] pl-7 pr-3 text-sm font-bold text-white shadow-md transition hover:bg-[#186429] active:scale-95"
              >
                <span>{legacyHero.cta.label}</span>
                <span className="flex size-9 items-center justify-center rounded-full bg-white/20 text-white">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* ================= MOBILE LAYOUT (<768px): Stacked Text on Top, Banner Illustration Below ================= */}
        <div className="flex flex-col md:hidden">
          <div className="px-6 pt-10 pb-6">
            <h1 className="text-[32px] font-bold leading-[1.12] tracking-tight text-[#161E2C]">
              {legacyHero.titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <span className="block text-[#1F7A34]">{legacyHero.titleAccent}</span>
            </h1>

            <p className="mt-4 text-sm font-medium leading-relaxed text-[#2A323F]">
              {legacyLead.statement}
            </p>

            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex h-[48px] items-center gap-3 rounded-full bg-[#1F7A34] pl-6 pr-2.5 text-xs font-bold text-white shadow-md"
              >
                <span>{legacyHero.cta.label}</span>
                <span className="flex size-8 items-center justify-center rounded-full bg-white/20 text-white">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>

          {/* Framed 2.5:1 panoramic illustration banner */}
          <div className="p-4 pt-0">
            <div className="relative aspect-[1024/409] w-full overflow-hidden rounded-[20px] shadow-sm">
              <Image
                src="/images/legacy/hero-banner.jpg"
                alt={legacyHero.imageAlt}
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
