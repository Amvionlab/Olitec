"use client";

import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

interface HomeProductCardProps {
  item: {
    icon: string;
    tone: string;
    eyebrow: string;
    title: string;
    tagline: string;
    models: readonly string[];
  };
  index: number;
}

export function HomeProductCard({ item, index }: HomeProductCardProps) {
  const isGreen = item.tone === "green";
  const headingColor = isGreen ? "#1F7A34" : "#C46E0E";
  const boxGradient = isGreen
    ? "bg-gradient-to-b from-[#E7F1E5] to-[#D6E9D4]"
    : "bg-gradient-to-b from-[#ECA23F] to-[#F3BE48]";

  const imageSrc =
    index === 0
      ? "/images/products/inverter-single.png"
      : index === 1
      ? "/images/products/inverter-three.png"
      : "/images/products/battery-render.png";

  return (
    <li className="w-full max-w-[382px]">
      <ScrollReveal delay={index * 140}>
        <div className="group flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-[#e6e2d8] bg-white p-6 shadow-xs transition-all duration-300 ease-out hover:-translate-y-2 hover:border-[#E8962C] hover:shadow-xl hover:shadow-[#E8962C]/10">
          {/* Eyebrow Heading above product box */}
          <p
            className="mb-3.5 text-center text-xs sm:text-[13px] font-bold uppercase tracking-[0.14em]"
            style={{ color: headingColor }}
          >
            {item.eyebrow}
          </p>

          {/* Authentic 3D Render from Product Page inside the coloured box */}
          <div
            className={`relative h-60 sm:h-64 w-full rounded-[22px] ${boxGradient} flex items-center justify-center overflow-hidden p-4 sm:p-5 shadow-inner`}
          >
            <div className="relative size-full transition-transform duration-300 group-hover:scale-105">
              <Image
                src={imageSrc}
                alt={item.eyebrow}
                fill
                className="object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.18)]"
                sizes="(max-width: 768px) 100vw, 360px"
                priority={index === 0}
              />
            </div>
          </div>

          {/* Title & Tagline */}
          <h3 className="mt-6 text-center text-[21px] sm:text-[22px] font-extrabold leading-[1.3] text-[#161E2C] transition-colors duration-300 group-hover:text-[#D45C0A]">
            {item.title}
          </h3>
          <p className="mx-auto mt-2 max-w-[280px] flex-1 text-center text-[14px] font-medium leading-[22px] text-slate-600">
            {item.tagline}
          </p>

          {/* "Know More" orange gradient button (M5 style) */}
          <div className="mb-1 mt-7 flex justify-center">
            <Link
              href="/products"
              className="inline-flex h-[48px] items-center justify-center gap-3.5 rounded-full bg-gradient-to-r from-[#E8962C] to-[#F3BE48] px-7 text-sm sm:text-[15px] font-extrabold text-[#161E2C] shadow-[0_8px_20px_rgb(232_150_44/0.28)] transition hover:brightness-105 active:scale-95"
              aria-label={`Know more about the ${item.title}`}
            >
              <span>Know More</span>
              <span className="flex size-7 items-center justify-center rounded-full bg-white text-[#161E2C] shadow-xs">
                <svg
                  width="14"
                  height="14"
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
      </ScrollReveal>
    </li>
  );
}
