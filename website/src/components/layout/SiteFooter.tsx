"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin, Building2, ExternalLink } from "lucide-react";
import { footerColumns, siteConfig } from "@/lib/site";

const tel = (phone: string) => `tel:${phone.replace(/\s/g, "")}`;

export function SiteFooter() {
  const factoryMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    "No. 127/2, Vallimalai Ring Road, Perumalkuppam, Katpadi Taluk, Vellore, Tamil Nadu 632 520",
  )}`;
  const corporateMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    "No. 5/63, Gateway House, House of Hiranandani, Egattur, OMR, Chennai, Tamil Nadu 600 130",
  )}`;

  return (
    <footer className="relative mt-20 bg-[#FFFFFF] border-t-2 border-[#E8962C] text-[#3C424C]">
      {/* Main Footer Body */}
      <div className="mx-auto max-w-[1600px] 2xl:max-w-[1680px] px-4 pt-14 pb-10 sm:px-8 xl:px-12 2xl:px-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.25fr_0.85fr_0.85fr_0.85fr_1.55fr] xl:gap-8">
          {/* Column 1: Brand & Identity */}
          <div className="flex flex-col justify-between space-y-5">
            <div>
              <Link href="/" aria-label={`${siteConfig.name} Home`} className="inline-block transition-transform hover:scale-[1.02]">
                <Image
                  src="/images/home/olitec-logo.png"
                  alt={siteConfig.name}
                  width={200}
                  height={60}
                  className="h-[46px] w-auto"
                />
              </Link>
              <p className="mt-4 max-w-[310px] text-sm font-semibold leading-relaxed text-[#161E2C]">
                {siteConfig.tagline}
              </p>
              <p className="mt-2 max-w-[310px] text-xs font-normal leading-relaxed text-[#3C424C]">
                {siteConfig.description}
              </p>
            </div>
          </div>

          {/* Navigation Columns */}
          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="flex flex-col">
              <p className="font-sans text-xs sm:text-sm font-bold tracking-wider uppercase text-[#C46E0E]">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#161E2C] transition-all hover:text-[#C46E0E] hover:translate-x-1"
                    >
                      <span className="size-1 rounded-full bg-[#E8962C] transition-colors group-hover:scale-125" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Column 5: Facilities & Direct Contact Hub */}
          <div className="flex flex-col space-y-4">
            <p className="font-sans text-xs sm:text-sm font-bold tracking-wider uppercase text-[#C46E0E]">
              Operations & Facilities
            </p>

            {/* Direct Email */}
            <div>
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="group inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#161E2C] hover:text-[#C46E0E] transition-colors"
              >
                <Mail className="size-4 text-[#E8962C] shrink-0" />
                <span className="group-hover:underline">{siteConfig.supportEmail}</span>
              </a>
            </div>

            {/* Single Phone Number (Item 4): 8501 800 800 */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#161E2C]">
              <Phone className="size-4 text-[#E8962C] shrink-0" />
              <a
                href={tel(siteConfig.supportPhone)}
                className="font-bold text-sm tracking-wide text-[#161E2C] hover:text-[#C46E0E] transition-colors"
              >
                {siteConfig.supportPhone}
              </a>
            </div>

            {/* Factory Address (Item 18) */}
            <div className="pt-3 border-t border-[#E6E2D8]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#161E2C]">
                  <MapPin className="size-3.5 text-[#E8962C] shrink-0" />
                  Factory and R&D Plant
                </span>
                <a
                  href={factoryMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C46E0E] hover:underline"
                >
                  <span>Map</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#3C424C]">
                {siteConfig.factoryAddress}
              </p>
            </div>

            {/* Corporate Address (Item 18) */}
            <div className="pt-3 border-t border-[#E6E2D8]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#161E2C]">
                  <Building2 className="size-3.5 text-[#E8962C] shrink-0" />
                  Corporate Headquarters
                </span>
                <a
                  href={corporateMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C46E0E] hover:underline"
                >
                  <span>Map</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
              <p className="mt-1 text-[11.5px] font-semibold text-[#161E2C]">
                {siteConfig.legalName}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#3C424C]">
                {siteConfig.corporateAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Divider line (Item M8) */}
        <div className="mt-12 h-[1px] w-full bg-[#E6E2D8]" />

        {/* Bottom Bar: Copyright Only (Item M8) */}
        <div className="flex flex-col gap-2 pt-6 sm:flex-row sm:items-center sm:justify-between text-xs text-[#3C424C]">
          <p className="font-sans font-medium">
            © {new Date().getFullYear()} {siteConfig.legalName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
