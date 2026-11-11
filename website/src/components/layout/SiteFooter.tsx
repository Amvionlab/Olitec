"use client";

import Image from "next/image";
import Link from "next/link";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Clock, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Award
} from "lucide-react";
import { footerColumns, siteConfig } from "@/lib/site";

const socials = [
  { key: "facebook", label: "Facebook", icon: "/images/home/icons/facebook.svg" },
  { key: "instagram", label: "Instagram", icon: "/images/home/icons/instagram.svg" },
  { key: "linkedin", label: "LinkedIn", icon: "/images/home/icons/linkedin.svg" },
  { key: "youtube", label: "YouTube", icon: "/images/home/icons/youtube.svg" },
] as const;

const tel = (phone: string) => `tel:${phone.replace(/\s/g, "")}`;

export function SiteFooter() {
  const factoryMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    "127/2 Vallimalai ring road Perumalkuppam Katpadi Vellore Tamil Nadu 632520",
  )}`;
  const corporateMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    "House of Hiranandani Gateway House Egattur OMR Chennai 600130",
  )}`;

  return (
    <footer className="relative mt-24 bg-[#0B1E17] text-slate-200">
      {/* Golden accent hairline on top boundary */}
      <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#f99f1e] to-transparent opacity-90" />

      {/* 1. Pre-Footer Enterprise Trust Banner */}
      <div className="border-b border-white/[0.08] bg-black/25 py-7 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1600px] 2xl:max-w-[1680px] flex-col gap-5 px-4 sm:px-8 xl:flex-row xl:items-center xl:justify-between xl:px-12 2xl:px-16">
          <div className="flex items-center gap-3">
            
            <div>
              <p className="font-nav text-sm sm:text-base font-bold text-white">
                Powering India&apos;s Clean Energy Transition
              </p>
              <p className="text-xs font-normal text-slate-400">
                Turnkey solar plants, advanced hybrid inverters & certified lithium storage built for Indian operating conditions.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-slate-300">
              <ShieldCheck className="size-3.5 text-brand-400" />
              <span>BIS & UN 38.3 Certified</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-slate-300">
              <Award className="size-3.5 text-brand-400" />
              <span>ISO 9001:2015 Standards</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-slate-300">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              <span>Make in India</span>
            </div>
            <Link
              href="/homes-and-businesses"
              className="brand-gradient group inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-black shadow-xs transition hover:brightness-105 active:scale-95"
            >
              <span>Speak to an Engineer</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Body */}
      <div className="mx-auto max-w-[1600px] 2xl:max-w-[1680px] px-4 pt-12 pb-10 sm:px-8 xl:px-12 2xl:px-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.25fr_0.85fr_0.85fr_0.85fr_1.55fr] xl:gap-8">
          {/* Column 1: Brand & Identity */}
          <div className="flex flex-col justify-between space-y-6">
            <div>
              <Link href="/" aria-label={`${siteConfig.name} Home`} className="inline-block transition-transform hover:scale-[1.02]">
                <div className="inline-block rounded-2xl bg-white/95 px-3 py-1.5 shadow-xs">
                  <Image
                    src="/images/home/olitec-logo.png"
                    alt={siteConfig.name}
                    width={200}
                    height={60}
                    className="h-[46px] w-auto"
                  />
                </div>
              </Link>
              <p className="mt-4 max-w-[310px] text-sm font-semibold leading-relaxed text-slate-200">
                {siteConfig.tagline}
              </p>
              <p className="mt-2 max-w-[310px] text-xs font-normal leading-relaxed text-slate-400">
                {siteConfig.description}
              </p>
            </div>

            <div className="border-t border-white/[0.08] pt-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <Clock className="size-4 text-brand-400 shrink-0" />
                <span>Support Hours: {siteConfig.supportHours}</span>
              </div>
            </div>
          </div>

          {/* Navigation Columns */}
          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="flex flex-col">
              <p className="font-nav text-xs sm:text-sm font-bold tracking-wider uppercase text-brand-400">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-300 transition-all hover:text-white hover:translate-x-1"
                    >
                      <span className="size-1 rounded-full bg-slate-600 transition-colors group-hover:bg-brand-400" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Column 5: Facilities & Direct Contact Hub (Clean Typography, No Heavy Boxes) */}
          <div className="flex flex-col space-y-4">
            <p className="font-nav text-xs sm:text-sm font-bold tracking-wider uppercase text-brand-400">
              Operations & Facilities
            </p>

            {/* Direct Email */}
            <div>
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="group inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-200 hover:text-brand-300 transition-colors"
              >
                <Mail className="size-4 text-brand-400 shrink-0" />
                <span className="group-hover:underline">{siteConfig.supportEmail}</span>
              </a>
            </div>

            {/* Direct Phones */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-1.5">
                <Phone className="size-3.5 text-brand-400 shrink-0" />
                <a href={tel(siteConfig.supportPhone)} className="font-semibold text-slate-200 hover:text-brand-300 transition-colors">
                  {siteConfig.supportPhone}
                </a>
              </div>
              {siteConfig.carePhones.map((phone) => (
                <div key={phone} className="flex items-center gap-2">
                  <span className="text-white/20">·</span>
                  <a href={tel(phone)} className="text-slate-300 hover:text-brand-300 transition-colors">
                    {phone}
                  </a>
                </div>
              ))}
            </div>

            {/* Factory Address (Clean Line Item) */}
            <div className="pt-3 border-t border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-100">
                  <MapPin className="size-3.5 text-brand-400 shrink-0" />
                  Factory & R&D Plant
                </span>
                <a
                  href={factoryMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-400 hover:underline"
                >
                  <span>Map</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {siteConfig.factoryAddress}
              </p>
            </div>

            {/* Corporate Address (Clean Line Item) */}
            <div className="pt-3 border-t border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-100">
                  <Building2 className="size-3.5 text-brand-400 shrink-0" />
                  Corporate Headquarters
                </span>
                <a
                  href={corporateMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-400 hover:underline"
                >
                  <span>Map</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
              <p className="mt-1 text-[11.5px] font-medium text-slate-300">
                {siteConfig.legalName}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                {siteConfig.corporateAddress}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Gold Accent Divider */}
        <div className="mt-10 h-[1px] w-full bg-gradient-to-r from-transparent via-[#f99f1e]/60 to-transparent" />

        {/* 4. Bottom Legal & Social Bar */}
        <div className="flex flex-col-reverse gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between pr-14 sm:pr-24">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
            <p className="font-nav text-xs font-medium text-slate-400">
              © {new Date().getFullYear()} {siteConfig.legalName}. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <Link href="/warranties/register" className="hover:text-slate-300 transition-colors">
                Warranty Terms
              </Link>
              <span>·</span>
              <Link href="/downloads" className="hover:text-slate-300 transition-colors">
                Compliance Docs
              </Link>
              <span>·</span>
              <Link href="/service-request" className="hover:text-slate-300 transition-colors">
                Service Desk
              </Link>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2.5">
            {socials.map(({ key, label, icon }) => {
              const href = siteConfig.social[key];
              const buttonContent = (
                <div className="flex size-8.5 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] transition-all hover:bg-white/15 hover:border-brand-400 hover:scale-110">
                  <Image src={icon} alt={label} width={18} height={18} className="size-4.5" />
                </div>
              );
              return href ? (
                <a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                  {buttonContent}
                </a>
              ) : (
                <span key={key} aria-label={label}>
                  {buttonContent}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
