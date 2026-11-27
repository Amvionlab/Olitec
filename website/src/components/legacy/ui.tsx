/**
 * Layout pieces for the pages whose content comes from the Olitec HTML design.
 * Styling follows the Figma design: Figtree, black section titles, gradient pill buttons,
 * rounded image panels with a dark gradient, frosted-glass chips and grey rounded cards.
 */
import Image from "next/image";
import Link from "next/link";
import { ArrowPillLink } from "@/components/home/primitives";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { legacyOverlays } from "@/content/legacy-overlays";
import { AnimatedIllustration } from "./AnimatedIllustration";
import { LegacyIcon, type LegacyIconName } from "./icons";

/** Figma expansive page grid: wide and spacious. */
export const legacyContainer = "mx-auto box-border w-full max-w-[1600px] 2xl:max-w-[1680px] px-4 sm:px-8 xl:px-12 2xl:px-16";

/** Figma orange gradient pill. */
export const legacyButton =
  "brand-gradient inline-flex h-[58px] items-center justify-center gap-2 rounded-[29.5px] px-8 text-[14.195px] font-semibold leading-[16.56px] text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60";
/** Figma outline pill. */
export const legacyButtonSecondary =
  "inline-flex h-[58px] items-center justify-center gap-2 rounded-[29.5px] border border-black bg-white px-8 text-[14.195px] font-semibold leading-[16.56px] text-black transition hover:bg-black/5";

export const headingFont = "text-black";

/** Figma body text: Figtree, medium weight, black. */
export function LegacyPage({ children }: { children: ReactNode }) {
  return <div className="bg-white text-base font-medium leading-[1.65] text-black">{children}</div>;
}

export interface SubNavItem {
  href: string;
  label: string;
}

const ART_IMAGES: Record<keyof typeof legacyOverlays, string> = {
  hero: "/images/legacy/hero.webp",
  groundMount: "/images/legacy/ground-mount-epc.webp",
  inverters: "/images/legacy/inverters-storage.webp",
  turnkey: "/images/legacy/turnkey.webp",
  synergy: "/images/legacy/synergy.webp",
  values: "/images/legacy/values.webp",
};

/** Page banner in the style of the Figma hero: rounded illustration panel, dark gradient, white text. */
export function PageHero({
  eyebrow,
  title,
  lead,
  art = "hero",
  subnav,
  current,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  art?: keyof typeof legacyOverlays;
  subnav?: readonly SubNavItem[];
  current?: string;
  children?: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-[1600px] 2xl:max-w-[1680px] px-4 sm:px-8 xl:px-12">
      <AnimatedIllustration
        src={ART_IMAGES[art]}
        alt=""
        overlay={art}
        sizes="(min-width: 1440px) 1277px, 100vw"
        className="rounded-[32px] xl:rounded-[57px]"
        priority
      >
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black from-[14.57%] to-[rgb(37_37_37/0.15)]" aria-hidden />
        <div className="relative z-[2] px-6 py-12 sm:px-10 xl:px-[60px] xl:py-[72px]">
          <p className="glass-chip inline-flex rounded-full px-4 py-1.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-white">{eyebrow}</p>
          <h1 className="motion-rise mt-5 max-w-[760px] text-[36px] font-semibold leading-[42px] text-white sm:text-[48px] sm:leading-[56px] xl:text-[60px] xl:leading-[66px]">
            {title}
          </h1>
          <p className="motion-rise motion-rise-delay-1 mt-5 max-w-[640px] text-base font-medium leading-6 text-white sm:text-lg sm:leading-7">{lead}</p>
          {subnav && (
            <nav aria-label="Section" className="mt-8 flex flex-wrap gap-3">
              {subnav.map((item) => {
                const active = item.href === current;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold transition",
                      active ? "brand-gradient text-black" : "glass-chip text-white hover:bg-white/15",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
          {children}
        </div>
      </AnimatedIllustration>
    </section>
  );
}

export function Section({
  muted,
  id,
  className,
  innerClassName,
  children,
}: {
  muted?: boolean;
  id?: string;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn(muted ? "bg-[rgb(217_217_217/0.44)]" : "bg-white", id && "scroll-mt-6", className)}>
      <div className={cn(legacyContainer, "py-16 xl:py-[86px]", innerClassName)}>{children}</div>
    </section>
  );
}

/** Figma section title. */
export function SectionHeading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        "mb-4 text-[34px] font-semibold leading-[42px] text-black sm:text-[40px] sm:leading-[52px] xl:text-[47.813px] xl:leading-[64px]",
        className,
      )}
    >
      {children}
    </h2>
  );
}

const tileTones = {
  orange: "bg-brand-500 text-white",
  green: "bg-leaf text-white",
} as const;

/** Round icon badge, as the orange circles in the Figma "Why Choose" list. */
export function IconTile({
  icon,
  tone = "orange",
  size = 56,
  className,
}: {
  icon: LegacyIconName;
  tone?: keyof typeof tileTones;
  size?: 44 | 52 | 56 | 90;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-none items-center justify-center rounded-full transition-all duration-300 ease-out shadow-xs",
        "group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md",
        tone === "orange"
          ? "group-hover:shadow-amber-500/25 group-hover:bg-gradient-to-tr group-hover:from-amber-500 group-hover:to-orange-400"
          : "group-hover:shadow-emerald-500/25",
        tileTones[tone],
        className,
      )}
      style={{ width: size, height: size }}
    >
      <div className="transition-transform duration-300 ease-out group-hover:scale-105">
        <LegacyIcon name={icon} size={size === 44 ? 22 : size === 90 ? 40 : 26} />
      </div>
    </div>
  );
}

/** White card with the thin grey outline of the Figma product cards. */
export function LegacyCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "group rounded-[25.528px] border-[0.912px] border-[#b7b7b7] bg-white p-7 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-brand-400 hover:shadow-lg hover:shadow-brand-500/5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Grey rounded card (Figma quality / FAQ cards) with an icon, title and description. */
export function FeatureCard({ icon, title, body, step }: { icon: LegacyIconName; title: string; body: string; step?: string }) {
  return (
    <div className="group relative rounded-[30px] border border-transparent bg-[rgb(230_230_230/0.4)] p-7 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-brand-300 hover:bg-white hover:shadow-xl hover:shadow-brand-500/8">
      {step && (
        <div className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-brand-600 transition-colors duration-300 group-hover:text-brand-700">
          {step}
        </div>
      )}
      <IconTile icon={icon} />
      <h3 className="mt-5 text-[22.663px] font-semibold leading-[29.786px] text-black transition-colors duration-300 group-hover:text-brand-950">
        {title}
      </h3>
      <p className="mt-2 text-base font-medium leading-[25px] text-black/85 transition-colors duration-300">
        {body}
      </p>
    </div>
  );
}

export function BulletList({ items, ordered, className }: { items: readonly string[]; ordered?: boolean; className?: string }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={cn("pl-[22px] marker:font-semibold marker:text-brand-500", ordered ? "list-decimal" : "list-disc", className)}>
      {items.map((item) => (
        <li key={item} className={ordered ? "mb-3" : "mb-2"}>
          {item}
        </li>
      ))}
    </Tag>
  );
}

export function DefinitionRows({ rows }: { rows: readonly { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-[minmax(0,1fr)_auto] text-base">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="border-b border-[#e6e6e6] py-3 text-muted">{row.label}</dt>
          <dd className="border-b border-[#e6e6e6] py-3 text-right font-semibold text-black">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Customer care contact card on the Figma dark-green band colour. */
export function HelpCard({ phones, children }: { phones: readonly string[]; children?: ReactNode }) {
  return (
    <div className="rounded-[30px] bg-forest p-7 text-white">
      <h3 className="mb-2.5 text-[22.663px] font-semibold">Need help?</h3>
      <p className="mb-4 text-base font-normal leading-[25px] text-white/85">Call the Olitec customer care team.</p>
      {phones.map((phone, i) => (
        <p key={phone} className={cn("text-lg font-semibold", i === phones.length - 1 ? "mb-5" : "mb-1.5")}>
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-brand-300">
            {phone}
          </a>
        </p>
      ))}
      {children}
    </div>
  );
}

/** Call-to-action panel matching Review Item M7: Dark navy, sunrise glow, orange & outline CTA buttons. */
export function CtaPanel({
  title,
  body,
  primary,
  secondary,
}: {
  title: string;
  body: string;
  primary: SubNavItem;
  secondary?: SubNavItem;
}) {
  let beforeAccent = title;
  let accent = "";
  if (title.includes("in mind?")) {
    const idx = title.indexOf("in mind?");
    beforeAccent = title.slice(0, idx);
    accent = "in mind?";
  }

  const rings = [1.45, 1.95, 2.55, 3.25, 4.05];

  return (
    <section
      className="relative isolate overflow-hidden bg-[#161E2C] pb-[160px] pt-14 md:pb-24 md:pt-20 xl:pb-28 xl:pt-24"
      aria-label={title}
    >
      {/* Item M7, Option A "Clean sun": a crisp sunrise disc with only a thin halo, lower right
          on desktop and bottom centre on mobile, with faint rings around it. Orange never fades
          straight into the navy; the disc edge stays crisp. */}
      {/* Heat filters for the sun (SVG turbulence, animated) */}
      <svg aria-hidden width="0" height="0" className="absolute">
        <defs>
          {/* rising hot air: bends whatever is behind it, flowing upward */}
          <filter id="cta-heat" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.01 0.05" numOctaves="2" seed="7" result="noise">
              <animate attributeName="baseFrequency" dur="11s" values="0.01 0.05;0.013 0.065;0.01 0.05" repeatCount="indefinite" />
            </feTurbulence>
            <feOffset in="noise" result="rising">
              <animate attributeName="dy" dur="2.6s" values="0;-80" repeatCount="indefinite" />
            </feOffset>
            <feDisplacementMap in="SourceGraphic" in2="rising" scale="9" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          {/* burning plasma for the sun's surface */}
          <filter id="cta-plasma" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="4" seed="3">
              <animate attributeName="baseFrequency" dur="14s" values="0.022;0.03;0.022" repeatCount="indefinite" />
            </feTurbulence>
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1   0 0 0 0 0.86   0 0 0 0 0.45   1.6 0 0 0 -0.55"
            />
          </filter>
        </defs>
      </svg>

      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 z-0 size-[230px] -translate-x-1/2 translate-y-[50%] md:left-[76%] md:size-[320px] md:translate-y-[64%] xl:size-[360px]"
      >
        <div className="cta-sun-rise absolute inset-0">
          {/* faint rings around the sun (Item M7) */}
          <svg className="absolute left-1/2 top-1/2 size-[420%] -translate-x-1/2 -translate-y-1/2 overflow-visible" viewBox="-210 -210 420 420" fill="none">
            {rings.map((r, i) => (
              <circle key={r} cx="0" cy="0" r={r * 50} stroke="#FFD69C" strokeOpacity={0.16 - i * 0.025} strokeWidth="0.45" />
            ))}
          </svg>
          {/* radiating heat glow (light-additive so it never turns brown on navy) */}
          <div
            className="cta-heat-glow absolute inset-[-55%] rounded-full mix-blend-screen"
            style={{ background: "radial-gradient(circle, rgb(255 214 110 / 0.42) 0%, rgb(255 200 90 / 0.16) 38%, rgb(255 200 90 / 0) 66%)" }}
          />

          {/* the disc with a live burning surface, its outline wavering through rising hot air */}
          <div className="absolute inset-[-12%] p-[9.68%]" style={{ filter: "url(#cta-heat)" }}>
          <div
            className="cta-sun-disc relative size-full overflow-hidden rounded-full"
            style={{ background: "radial-gradient(circle at 50% 50%, #FFD04A 0%, #FFC23A 42%, #FBAA2A 74%, #F7961C 100%)" }}
          >
            <svg className="absolute inset-0 size-full mix-blend-soft-light" viewBox="0 0 200 200" preserveAspectRatio="none">
              <rect width="200" height="200" filter="url(#cta-plasma)" />
            </svg>
            <span
              className="absolute inset-0 rounded-full"
              style={{ background: "radial-gradient(circle at 50% 45%, rgb(255 246 200 / 0.45) 0%, rgb(255 246 200 / 0) 55%)" }}
            />
          </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-5 sm:px-10 xl:px-[88px]">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-[34px] font-bold leading-[1.18] text-white sm:text-[44px] md:whitespace-nowrap xl:text-[52px]">
            {accent ? (
              <>
                <span className="block md:inline">{beforeAccent.trim()}</span>{" "}
                <span className="block text-[#FCBC62] md:inline">{accent}</span>
              </>
            ) : (
              title
            )}
          </h2>
          <p className="mt-4 max-w-[600px] text-[15px] font-normal leading-relaxed text-white/80 sm:text-base xl:text-lg">
            {body}
          </p>

          <div className="mt-8 flex w-full max-w-[420px] flex-col gap-3.5 md:w-auto md:max-w-none md:flex-row-reverse md:gap-5">
            <Link
              href={primary.href}
              className="inline-flex h-[52px] w-full items-center justify-between gap-4 rounded-full bg-gradient-to-r from-[#E8962C] to-[#F3BE48] pl-7 pr-2 text-[15px] font-bold text-[#161E2C] shadow-[0_8px_22px_rgb(232_150_44/0.3)] transition hover:brightness-105 active:scale-[0.98] md:w-auto md:min-w-[250px]"
            >
              <span>{primary.label}</span>
              <span className="flex size-9 items-center justify-center rounded-full bg-white text-[#161E2C]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M7 17L17 7M8 7h9v9" />
                </svg>
              </span>
            </Link>
            {secondary && (
              <Link
                href={secondary.href}
                className="inline-flex h-[52px] w-full items-center justify-center rounded-full border-[1.5px] border-white/85 bg-transparent px-8 text-[15px] font-semibold text-white transition hover:bg-white hover:text-[#161E2C] active:scale-[0.98] md:w-auto md:min-w-[220px]"
              >
                {secondary.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
