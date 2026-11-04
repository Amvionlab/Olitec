import Image from "next/image";
import Link from "next/link";
import { legacyHero, legacyLead } from "@/content/legacy";
import { AnimatedIllustration } from "@/components/legacy/AnimatedIllustration";
import { ArrowCircle, ArrowPillLink } from "./primitives";

/** Figma hero layout (rounded 57px panel, dark gradient, glass card) with the HTML design's headline and illustration. */
export function Hero() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 sm:px-8 xl:px-[82px]" aria-labelledby="hero-title">
      <AnimatedIllustration
        src={legacyHero.image}
        alt={legacyHero.imageAlt}
        overlay="hero"
        sizes="(min-width: 1440px) 1277px, 100vw"
        className="rounded-[32px] xl:h-[661px] xl:rounded-[57px]"
        priority
      >
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black from-[14.57%] to-[rgb(37_37_37/0)]" aria-hidden />

        <div className="relative z-[2] px-6 pb-10 pt-14 sm:px-10 xl:px-[60px] xl:pb-0 xl:pt-[121px]">
          <h1
            id="hero-title"
            className="max-w-[720px] text-[40px] font-semibold leading-[44px] text-white sm:text-[56px] sm:leading-[60px] xl:text-[66px] xl:leading-[72px]"
          >
            {legacyHero.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            <span className="block text-[#f9a21d]">{legacyHero.titleAccent}</span>
          </h1>
          <p className="mt-[25px] max-w-[552px] text-base font-medium leading-6 text-white">{legacyLead.statement}</p>
          <div className="mt-[29px]">
            <ArrowPillLink href={legacyHero.cta.href} label={legacyHero.cta.label} width={252} />
          </div>
        </div>

        {/* Glass card, desktop only, in the Figma "projects" card position */}
        <Link
          href={legacyHero.card.href}
          className="glass-card group absolute right-[46px] top-[438px] z-[2] hidden h-[193px] w-[448px] rounded-[12.135px] xl:block"
        >
          <span className="absolute left-[15px] top-[13px] h-[166px] w-[221px] overflow-hidden rounded-[11px]">
            <Image src={legacyHero.card.image} alt="" fill sizes="221px" className="object-cover" />
          </span>
          <span className="absolute left-[258px] top-[24px] w-[175px] text-[21.053px] font-semibold leading-[27.632px] text-black">
            {legacyHero.card.label}
          </span>
          <ArrowCircle className="absolute left-[387px] top-[133px] transition-transform group-hover:scale-105" />
        </Link>
      </AnimatedIllustration>
    </section>
  );
}
