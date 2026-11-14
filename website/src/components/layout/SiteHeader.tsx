"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Menu,
  X,
  ArrowUpRight,
  PhoneCall,
  Sparkles,
  UserRound,
} from "lucide-react";
import { mainNav, siteConfig, type NavItem } from "@/lib/site";
import { cn } from "@/lib/cn";

function matchesPath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isActive(pathname: string, item: NavItem) {
  const paths = [item.href, ...(item.match ?? []), ...(item.children?.map((child) => child.href) ?? [])];
  return paths.some((href) => matchesPath(pathname, href));
}

function PendingBar() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 -bottom-1 h-[2px] origin-left rounded-full bg-brand-500 transition-transform duration-300",
        pending ? "scale-x-100 animate-pulse" : "scale-x-0",
      )}
    />
  );
}

function ProfileAvatar({ pathname }: { pathname: string }) {
  const [customerName, setCustomerName] = useState<string | null>(null);

  useEffect(() => {
    const API_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://localhost:4000/api";

    let isMounted = true;

    async function fetchCustomer() {
      try {
        const response = await fetch(
          `${API_URL}/ecommerce/auth/me`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (isMounted && response.ok && result.success && result.data) {
          setCustomerName(result.data.name || null);
        } else if (isMounted) {
          setCustomerName(null);
        }
      } catch (error) {
        console.error("Unable to fetch logged-in customer:", error);

        if (isMounted) {
          setCustomerName(null);
        }
      }
    }

    fetchCustomer();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const initial = customerName?.trim().charAt(0).toUpperCase();

  return (
    <Link
      href={customerName ? "/profile" : "/login"}
      aria-label={customerName ? `${customerName} profile` : "Login"}
      title={customerName || "Login"}
      className="flex size-10 items-center justify-center rounded-full
                 border border-slate-200 bg-white text-slate-700
                 font-bold text-base
                 hover:bg-brand-50 hover:text-brand-600
                 hover:border-brand-200 transition-all"
    >
      {initial || <UserRound className="size-5" />}
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isFixedVisible, setIsFixedVisible] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const fixedNavRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Track scroll position: smoothly reveal fixed sticky header after scrolling past the hero section
  useEffect(() => {
    const handleScroll = () => {
      // On homepage, hero is ~680px tall; on subpages, hero is ~300px.
      const threshold = pathname === "/" ? 500 : 240;
      if (window.scrollY > threshold) {
        setIsFixedVisible(true);
      } else {
        setIsFixedVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  return (
    <>
      {/* 1. Normal In-Flow Header (Hero Top) */}
      <header className="relative z-30 w-full bg-white py-3 sm:py-4 xl:py-5 border-b border-slate-100">
        <div className="mx-auto flex max-w-[1600px] 2xl:max-w-[1680px] items-center justify-between px-4 sm:px-8 xl:px-12 2xl:px-16">
          {/* Brand Logo */}
          <Link href="/" aria-label={`${siteConfig.name} home`} className="shrink-0 transition-transform hover:scale-[1.02]">
            <Image
              src="/images/home/olitec-logo.png"
              alt={siteConfig.name}
              width={220}
              height={66}
              priority
              className="h-[44px] xl:h-[58px] w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav ref={navRef} className="hidden items-center gap-7 font-nav text-[14.5px] leading-6 xl:flex xl:gap-[32px]" aria-label="Main Navigation">
            {mainNav.map((item) => {
              const active = isActive(pathname, item);
              if (!item.children) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex items-center gap-1.5 whitespace-nowrap transition-colors py-1.5 px-1",
                      active ? "font-bold text-brand-500" : "font-semibold text-ink hover:text-brand-500",
                    )}
                  >
                    {item.label}
                    <PendingBar />
                  </Link>
                );
              }
              return (
                <div key={item.label} className="group relative">
                  <Link
                    href={item.href}
                    aria-haspopup="true"
                    className={cn(
                      "relative inline-flex items-center gap-1.5 whitespace-nowrap transition-colors py-1.5 px-1",
                      active ? "font-bold text-brand-500" : "font-semibold text-ink hover:text-brand-500",
                    )}
                  >
                    {item.label}
                    <ChevronDown className="size-4 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" aria-hidden />
                    <PendingBar />
                  </Link>
                  {/* Dropdown Menu */}
                  <div className="invisible absolute right-0 top-full z-40 w-[300px] translate-y-2 pt-3 opacity-0 transition-[opacity,transform] duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    <ul className="rounded-[25.528px] border-[0.912px] border-[#b7b7b7] bg-white p-2 shadow-[0_16px_40px_rgb(0_0_0/0.12)]">
                      {item.children.map((child) => {
                        const childActive = matchesPath(pathname, child.href);
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              aria-current={childActive ? "page" : undefined}
                              className={cn(
                                "relative block rounded-[18px] px-4 py-3 transition-colors hover:bg-[rgb(230_230_230/0.4)]",
                                childActive && "bg-brand-50",
                              )}
                            >
                              <span className={cn("block font-bold", childActive ? "text-brand-600" : "text-black")}>{child.label}</span>
                              <span className="mt-0.5 block font-sans text-[13px] font-medium leading-5 text-muted">{child.description}</span>
                              <PendingBar />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Header Action Button */}
          <div className="hidden items-center gap-3.5 xl:flex">
<ProfileAvatar pathname={pathname} />
            <Link
              href="/homes-and-businesses"
              className="brand-gradient group inline-flex h-[46px] items-center gap-2 rounded-full px-6 text-sm font-bold text-black transition-all hover:brightness-105 shadow-sm active:scale-95"
            >
              <span>Free Consultation</span>
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="inline-flex size-11 items-center justify-center rounded-full text-black hover:bg-slate-100 xl:hidden"
          >
            {mobileOpen ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
          </button>
        </div>
      </header>

      {/* 2. Sleek Fixed Animated Header (Slides down seamlessly after hero section) */}
      <div
        className={cn(
          "fixed top-0 inset-x-0 z-50 bg-white/92 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_12px_36px_rgba(0,0,0,0.08)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isFixedVisible
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "-translate-y-full opacity-0 pointer-events-none",
        )}
      >
        {/* Amber top hairline accent */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#f99f1e] to-transparent opacity-90" />

        <div className="mx-auto flex h-[62px] xl:h-[68px] max-w-[1600px] 2xl:max-w-[1680px] items-center justify-between px-4 sm:px-8 xl:px-12 2xl:px-16">
          {/* Compact Logo */}
          <Link href="/" aria-label={`${siteConfig.name} home`} className="shrink-0 transition-transform hover:scale-[1.02]">
            <Image
              src="/images/home/olitec-logo.png"
              alt={siteConfig.name}
              width={180}
              height={54}
              priority
              className="h-[36px] xl:h-[42px] w-auto"
            />
          </Link>

          {/* Compact Desktop Navigation */}
          <nav ref={fixedNavRef} className="hidden items-center gap-1 font-nav text-[13.5px] leading-6 xl:flex" aria-label="Sticky Navigation">
            {mainNav.map((item) => {
              const active = isActive(pathname, item);
              if (!item.children) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative rounded-full px-3.5 py-1.5 transition-all",
                      active
                        ? "bg-brand-50 font-bold text-brand-600 shadow-xs"
                        : "font-semibold text-slate-700 hover:text-black hover:bg-slate-100/70",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <div key={item.label} className="group relative">
                  <Link
                    href={item.href}
                    aria-haspopup="true"
                    className={cn(
                      "relative inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 transition-all",
                      active
                        ? "bg-brand-50 font-bold text-brand-600"
                        : "font-semibold text-slate-700 hover:text-black hover:bg-slate-100/70",
                    )}
                  >
                    {item.label}
                    <ChevronDown className="size-3.5 transition-transform group-hover:rotate-180" aria-hidden />
                  </Link>
                  {/* Dropdown Menu */}
                  <div className="invisible absolute right-0 top-full z-40 w-[290px] translate-y-2 pt-2 opacity-0 transition-[opacity,transform] duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    <ul className="rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
                      {item.children.map((child) => {
                        const childActive = matchesPath(pathname, child.href);
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              aria-current={childActive ? "page" : undefined}
                              className={cn(
                                "block rounded-[16px] px-3.5 py-2.5 transition-colors hover:bg-slate-50",
                                childActive && "bg-brand-50",
                              )}
                            >
                              <span className={cn("block text-sm font-bold", childActive ? "text-brand-600" : "text-slate-900")}>
                                {child.label}
                              </span>
                              <span className="mt-0.5 block font-sans text-xs text-muted">{child.description}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Quick Consultation CTA */}
          <div className="hidden items-center gap-3 xl:flex">
            <a
              href={`tel:${siteConfig.supportPhone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors px-2 py-1"
            >
              <PhoneCall className="size-3.5 text-brand-500" />
              <span>{siteConfig.supportPhone}</span>
            </a>
<ProfileAvatar pathname={pathname} />            <Link
              href="/homes-and-businesses"
              className="brand-gradient group inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-bold text-black transition-all hover:brightness-105 shadow-sm active:scale-95"
            >
              <Sparkles className="size-3.5" />
              
              <span>Get Consultation</span>
              <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {/* Mobile trigger on fixed header */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="inline-flex size-10 items-center justify-center rounded-full text-black hover:bg-slate-100 xl:hidden"
          >
            {mobileOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {/* 3. Mobile Navigation Drawer */}
      {mobileOpen && (
        <div id="mobile-nav" className="fixed inset-x-0 top-[62px] z-50 border-b border-slate-200 bg-white/98 backdrop-blur-2xl px-5 pb-8 pt-4 shadow-2xl xl:hidden animate-fade-in">
          <nav className="flex flex-col gap-1 font-nav text-base" aria-label="Mobile Navigation">
            {mainNav.map((item) => {
              const active = isActive(pathname, item);
              return (
                <div key={item.label} className="border-b border-slate-100 py-2.5 last:border-none">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn("flex items-center justify-between py-1 font-semibold", active ? "text-brand-600" : "text-ink")}
                  >
                    <span>{item.label}</span>
                  </Link>
                  {item.children && (
                    <div className="mt-1 flex flex-col gap-1.5 pl-3">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="py-1 text-sm font-medium text-muted hover:text-black"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="mt-5 pt-3 flex flex-col gap-3">
              <Link
                href="/homes-and-businesses"
                className="brand-gradient flex h-11 items-center justify-center gap-2 rounded-full font-bold text-black"
              >
                <span>Free Consultation</span>
                <ArrowUpRight className="size-4" />
              </Link>
              <a
                href={`tel:${siteConfig.supportPhone.replace(/\s/g, "")}`}
                className="flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                <PhoneCall className="size-4 text-brand-500" />
                <span>Call {siteConfig.supportPhone}</span>
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
