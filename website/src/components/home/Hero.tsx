import Image from "next/image";
import Link from "next/link";
import { legacyHero, legacyLead } from "@/content/legacy";
import { AnimatedIllustration } from "@/components/legacy/AnimatedIllustration";
import { ArrowCircle, ArrowPillLink } from "./primitives";

/**
 * Enterprise Hero matching the Figma design layout with original Olitec copy and assets.
 * Wide and spacious container, original headline, subtitle, and connected lines of business card.
 */
export function Hero() {
  return (
    <section className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1680px] px-4 sm:px-8 xl:px-12" aria-labelledby="hero-title">
      <AnimatedIllustration
        src={legacyHero.image}
        alt={legacyHero.imageAlt}
        overlay="hero"
        sizes="(min-width: 1600px) 1560px, 100vw"
        className="rounded-[36px] sm:rounded-[48px] xl:rounded-[56px] min-h-[640px] xl:h-[680px] xl:min-h-0 shadow-[0_20px_60px_rgb(0_0_0/0.12)]"
        priority
      >
        {/* Soft dark gradient on left for crystal-clear text readability */}
        <div
          className="absolute inset-0 z-[1] bg-gradient-to-r from-black from-[15%] via-black/45 to-transparent to-[75%]"
          aria-hidden
        />

        <div className="relative z-[2] flex h-full flex-col justify-between px-6 pb-12 pt-14 sm:px-12 sm:pt-16 xl:px-[72px] xl:pt-[105px]">
          <div className="max-w-[780px]">
            <h1
              id="hero-title"
              className="text-[40px] font-semibold leading-[1.08] tracking-tight text-white sm:text-[56px] md:text-[64px] xl:text-[72px]"
            >
              {legacyHero.titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <span className="block text-[#f9a21d]">{legacyHero.titleAccent}</span>
            </h1>

            <p className="mt-6 max-w-[560px] text-base font-medium leading-relaxed text-white/95 sm:text-lg xl:text-[19px]">
              {legacyLead.statement}
            </p>

            <div className="mt-8">
              <ArrowPillLink href={legacyHero.cta.href} label={legacyHero.cta.label} width={252} />
            </div>
          </div>
        </div>

        {/* Glass card in the Figma "projects" card position */}
        <Link
          href={legacyHero.card.href}
          className="glass-card group absolute bottom-[40px] right-[40px] z-[2] hidden h-[195px] w-[460px] rounded-[18px] p-3.5 shadow-[0_20px_45px_rgb(0_0_0/0.18)] transition-all duration-300 hover:scale-[1.02] xl:block"
        >
          <div className="relative flex h-full items-center gap-4">
            <div className="relative h-[166px] w-[215px] shrink-0 overflow-hidden rounded-[13px] shadow-sm">
              <Image src={legacyHero.card.image} alt="" fill sizes="215px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="flex flex-1 flex-col justify-between py-1">
              <span className="text-[20px] font-semibold leading-[26px] text-black">
                {legacyHero.card.label}
              </span>
              <div className="flex justify-end pt-2">
                <ArrowCircle className="transition-transform duration-300 group-hover:scale-110" />
              </div>
            </div>
          </div>
        </Link>
      </AnimatedIllustration>
    </section>
  );
}
