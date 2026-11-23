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
  hero: "/images/legacy/hero.jpg",
  groundMount: "/images/legacy/ground-mount-epc.jpg",
  inverters: "/images/legacy/inverters-storage.jpg",
  turnkey: "/images/legacy/turnkey.jpg",
  synergy: "/images/legacy/synergy.jpg",
  values: "/images/legacy/values.jpg",
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
      <p className="mb-4 text-base font-normal leading-[25px] text-white/85">Our customer care team is available Monday to Saturday, 9:30 am to 6:30 pm.</p>
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

  return (
    <section className="relative overflow-hidden bg-[#161E2C] py-16 xl:py-20" aria-label={title}>
      {/* Sunrise glow in lower right corner */}
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 size-[520px] rounded-full opacity-80 blur-3xl"
        style={{
          background: "radial-gradient(circle, #FFD04A 0%, #F7961C 50%, transparent 75%)",
        }}
        aria-hidden
      />
      {/* Faint concentric orbit rings */}
      <svg
        className="pointer-events-none absolute -bottom-16 -right-16 size-[600px] opacity-25"
        viewBox="0 0 600 600"
        fill="none"
        aria-hidden
      >
        <circle cx="500" cy="500" r="220" stroke="#FFD69C" strokeWidth="1.2" />
        <circle cx="500" cy="500" r="320" stroke="#FFD69C" strokeWidth="1" strokeDasharray="6 6" />
        <circle cx="500" cy="500" r="440" stroke="#FFD69C" strokeWidth="0.8" />
      </svg>

      <div className="relative mx-auto max-w-[1440px] px-6 sm:px-10 xl:px-[88px]">
        <div className="flex flex-col items-center text-center">
          <h2 className="max-w-[820px] text-[36px] font-bold leading-[1.14] text-white sm:text-[48px] xl:text-[58px]">
            {accent ? (
              <>
                {beforeAccent}
                <span className="text-[#FCBC62]">{accent}</span>
              </>
            ) : (
              title
            )}
          </h2>
          <p className="mt-5 max-w-[640px] text-base font-normal leading-relaxed text-white/80 sm:text-lg xl:text-[19px]">
            {body}
          </p>

          <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            {secondary && (
              <Link
                href={secondary.href}
                className="inline-flex h-12 min-w-[220px] items-center justify-center rounded-full border-2 border-white/80 bg-transparent px-7 text-xs font-bold text-white transition hover:bg-white hover:text-[#161E2C] active:scale-95"
              >
                {secondary.label}
              </Link>
            )}
            <Link
              href={primary.href}
              className="inline-flex h-12 min-w-[240px] items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#E8962C] to-[#F3BE48] px-7 text-xs font-bold text-[#161E2C] shadow-lg transition hover:brightness-105 active:scale-95"
            >
              <span>{primary.label}</span>
              <span className="flex size-7 items-center justify-center rounded-full bg-[#161E2C]/10">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
