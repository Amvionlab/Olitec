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

/** Figma page grid: content 113px from the edges on desktop. */
export const legacyContainer = "mx-auto box-border w-full max-w-[1440px] px-4 sm:px-8 xl:px-[113px]";

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
    <section className="mx-auto max-w-[1440px] px-4 sm:px-8 xl:px-[82px]">
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
          <h1 className="mt-5 max-w-[760px] text-[36px] font-semibold leading-[42px] text-white sm:text-[48px] sm:leading-[56px] xl:text-[60px] xl:leading-[66px]">
            {title}
          </h1>
          <p className="mt-5 max-w-[640px] text-base font-medium leading-6 text-white sm:text-lg sm:leading-7">{lead}</p>
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
export function IconTile({ icon, tone = "orange", size = 56 }: { icon: LegacyIconName; tone?: keyof typeof tileTones; size?: 44 | 52 | 56 | 90 }) {
  return (
    <div className={cn("flex flex-none items-center justify-center rounded-full", tileTones[tone])} style={{ width: size, height: size }}>
      <LegacyIcon name={icon} size={size === 44 ? 22 : size === 90 ? 40 : 26} />
    </div>
  );
}

/** White card with the thin grey outline of the Figma product cards. */
export function LegacyCard({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-[25.528px] border-[0.912px] border-[#b7b7b7] bg-white p-7", className)}>{children}</div>;
}

/** Grey rounded card (Figma quality / FAQ cards) with an icon, title and description. */
export function FeatureCard({ icon, title, body, step }: { icon: LegacyIconName; title: string; body: string; step?: string }) {
  return (
    <div className="rounded-[30px] bg-[rgb(230_230_230/0.4)] p-7">
      {step && <div className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-brand-600">{step}</div>}
      <IconTile icon={icon} />
      <h3 className="mt-5 text-[22.663px] font-semibold leading-[29.786px] text-black">{title}</h3>
      <p className="mt-2 text-base font-medium leading-[25px] text-black">{body}</p>
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

/** Call-to-action panel in the style of the Figma "Let's Build Your Solar Future" block: clouds and frosted glass. */
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
  return (
    <section className="relative overflow-hidden" aria-label={title}>
      <Image src="/images/home/cta-clouds.jpg" alt="" fill sizes="100vw" className="object-cover object-bottom" />
      <div className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-8 xl:px-[88px] xl:py-[64px]">
        <div className="glass-panel flex flex-col items-center rounded-[40px] px-6 py-12 text-center [backdrop-filter:blur(23.45px)] xl:rounded-[55px] xl:py-[66px]">
          <h2 className="max-w-[760px] text-[40px] font-semibold leading-[46px] text-black sm:text-[56px] sm:leading-[62px] xl:text-[64px] xl:leading-[72px]">
            {title}
          </h2>
          <p className="mt-4 max-w-[640px] text-[20px] font-normal leading-8 text-black">{body}</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:gap-[43px]">
            {secondary && (
              <Link href={secondary.href} className={cn(legacyButtonSecondary, "w-[270px] bg-transparent hover:bg-white/40")}>
                {secondary.label}
              </Link>
            )}
            <ArrowPillLink href={primary.href} label={primary.label} width={270} />
          </div>
        </div>
      </div>
    </section>
  );
}
