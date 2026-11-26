import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { legacyHero, legacyLead } from "@/content/legacy";

/**
 * Enterprise Hero matching exact reference in Review (media_1795426227749_f1ffaf21.jpg):
 * - Unified panoramic banner illustration (1024x536) covering the full rounded container.
 * - Upper-left / mid-left text overlay:
 *   - "Building a dependable clean-energy model" in rich navy #161E2C
 *   - "for India" in deep vibrant green #1F7A34
 *   - Clear descriptive paragraph
 *   - Pill button in #1F7A34 with white circle and green up-right arrow (↗)
 * - Sun in center, inverter + battery in lower center-right, transmission towers & skyline on right.
 */
export function Hero() {
  return (
    <section
      className="mx-auto w-full max-w-[1560px] 2xl:max-w-[1640px] px-3 sm:px-6 xl:px-8 pt-2 pb-6"
      aria-labelledby="hero-title"
    >
      <div className="relative flex w-full items-start md:items-center overflow-hidden rounded-[28px] sm:rounded-[36px] xl:rounded-[44px] shadow-[0_12px_40px_rgb(0_0_0/0.06)] border border-[#E6E2D8]/80 min-h-[600px] sm:min-h-[660px] md:min-h-[540px] lg:min-h-[580px] xl:min-h-[620px] md:aspect-[22/10]">
        {/* Mobile Portrait Hero Artwork (Dedicated illustration matching desktop aesthetics with clean upper sky for text) */}
        <Image
          src="/images/legacy/hero-banner-mobile.webp"
          alt={legacyHero.imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-bottom md:hidden pointer-events-none select-none"
        />

        {/* Desktop Panoramic Hero Artwork */}
        <Image
          src="/images/legacy/hero-banner.jpg"
          alt={legacyHero.imageAlt}
          fill
          priority
          sizes="(min-width: 1560px) 1560px, 100vw"
          className="hidden md:block object-cover object-center pointer-events-none select-none"
        />

        {/* Text and CTA Overlay Content */}
        <div className="relative z-10 flex w-full flex-col justify-start md:justify-center px-6 pt-8 pb-[290px] sm:px-10 sm:pt-10 sm:pb-[320px] md:py-10 md:px-14 lg:px-16 xl:px-20 max-w-[560px] lg:max-w-[620px]">
          <h1
            id="hero-title"
            className="text-[30px] sm:text-[40px] md:text-[46px] lg:text-[48px] xl:text-[52px] font-bold leading-[1.12] tracking-tight text-[#161E2C]"
          >
            <span>Building a dependable</span>{" "}
            <span className="block sm:inline lg:block">clean-energy model</span>
            <span className="block text-[#1F7A34] mt-0.5">for India</span>
          </h1>

          <p className="mt-3.5 sm:mt-4 md:mt-5 max-w-[430px] text-[14px] sm:text-[15px] font-medium leading-[1.55] text-[#161E2C]">
            {legacyLead.statement}
          </p>

          <div className="mt-5 sm:mt-6 md:mt-7">
            <Link
              href="/products"
              className="group inline-flex items-center gap-3 rounded-full bg-[#1F7A34] pl-5 pr-2 py-2 text-xs sm:text-[13.5px] font-bold text-white shadow-[0_8px_20px_rgb(31_122_52/0.25)] transition hover:bg-[#186429] hover:shadow-[0_10px_25px_rgb(31_122_52/0.35)] active:scale-95"
            >
              <span>Explore our products</span>
              <span className="flex size-7 sm:size-8 items-center justify-center rounded-full bg-white text-[#1F7A34] shadow-xs transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="size-4 sm:size-4.5" strokeWidth={2.5} />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
