import Image from "next/image";
import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Page-width wrapper matching the Figma grid: content at 113px from the edges on desktop,
 * or 83px for the wide image panels ("wide").
 */
export function HomeContainer({ wide, className, ...props }: HTMLAttributes<HTMLDivElement> & { wide?: boolean }) {
  return <div className={cn("mx-auto w-full max-w-[1440px] px-4 sm:px-8", wide ? "xl:px-[83px]" : "xl:px-[113px]", className)} {...props} />;
}

export function SectionTitle({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <h2 id={id} className={cn("text-[34px] font-semibold leading-[42px] text-black sm:text-[40px] sm:leading-[52px] xl:text-[47.813px] xl:leading-[64px]", className)}>
      {children}
    </h2>
  );
}

/** White circle with the north-east arrow used on the orange buttons and the hero projects card. */
export function ArrowCircle({ className }: { className?: string }) {
  return (
    <span className={cn("flex size-[46px] shrink-0 items-center justify-center rounded-full bg-white", className)} aria-hidden>
      <Image src="/images/home/icons/arrow-right.svg" alt="" width={24} height={18} className="h-[17.53px] w-[23.59px] -rotate-45" />
    </span>
  );
}

interface ArrowPillLinkProps {
  href: string;
  label: string;
  /** Figma widths: 252px (hero) and 270px (call to action). */
  width: 252 | 270;
}

export function ArrowPillLink({ href, label, width }: ArrowPillLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "brand-gradient relative inline-flex h-[58px] max-w-full items-center rounded-[29.5px] text-[14.195px] font-semibold leading-[16.56px] text-black transition hover:brightness-105",
        width === 252 ? "w-[252px] pl-[22px]" : "w-[270px] pl-[30px]",
      )}
    >
      {label}
      <ArrowCircle className="absolute right-[11px] top-[6px]" />
    </Link>
  );
}

interface CarouselControlsProps {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  gap: number;
  label: string;
}

export function CarouselControls({ onPrev, onNext, canPrev, canNext, gap, label }: CarouselControlsProps) {
  const base = "flex size-[43.54px] items-center justify-center rounded-full border-[0.751px] border-[#262626] transition disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="flex shrink-0" style={{ gap }} role="group" aria-label={`${label} navigation`}>
      <button type="button" onClick={onPrev} disabled={!canPrev} className={cn(base, "hover:bg-black/5")} aria-label={`Previous ${label}`}>
        <Image src="/images/home/icons/carousel-prev.svg" alt="" width={23} height={23} className="size-[22.52px]" />
      </button>
      <button type="button" onClick={onNext} disabled={!canNext} className={cn(base, "bg-[#1a1a1a] hover:bg-black")} aria-label={`Next ${label}`}>
        <Image src="/images/home/icons/carousel-next.svg" alt="" width={23} height={23} className="size-[22.52px]" />
      </button>
    </div>
  );
}
