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
      className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 xl:px-12 pt-2 pb-6"
      aria-labelledby="hero-title"
    >
      <div className="relative w-full overflow-hidden rounded-[28px] sm:rounded-[36px] xl:rounded-[44px] shadow-[0_12px_40px_rgb(0_0_0/0.06)] border border-[#E6E2D8]/80 min-h-[480px] sm:min-h-[520px] md:min-h-[540px] lg:aspect-[1024/536] lg:min-h-0">
        {/* Full-bleed Panoramic Banner Illustration */}
        <Image
          src="/images/legacy/hero-banner.jpg"
          alt={legacyHero.imageAlt}
          fill
          priority
          sizes="(min-width: 1440px) 1360px, 100vw"
          className="object-cover object-[65%_center] sm:object-center pointer-events-none select-none"
        />

        {/* Ambient subtle soft wash on left on smaller screens to ensure flawless contrast */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#FFF7EA]/95 via-[#FFF7EA]/80 to-transparent sm:via-[#FFF7EA]/50 sm:to-transparent lg:opacity-0"
          aria-hidden
        />

        {/* Text and CTA Overlay Content */}
        <div className="relative z-10 flex h-full flex-col justify-center px-6 py-10 sm:px-10 md:px-14 lg:px-16 xl:px-20 max-w-[560px] lg:max-w-[620px]">
          <h1
            id="hero-title"
            className="text-[32px] sm:text-[42px] md:text-[46px] lg:text-[48px] xl:text-[52px] font-bold leading-[1.12] tracking-tight text-[#161E2C]"
          >
            <span>Building a dependable</span>{" "}
            <span className="block sm:inline lg:block">clean-energy model</span>
            <span className="block text-[#1F7A34] mt-0.5">for India</span>
          </h1>

          <p className="mt-4 sm:mt-5 max-w-[430px] text-[14px] sm:text-[15px] font-medium leading-[1.55] text-[#161E2C]">
            {legacyLead.statement}
          </p>

          <div className="mt-6 sm:mt-7">
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
