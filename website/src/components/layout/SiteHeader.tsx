"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
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

/** Shows that a menu click registered while the next page loads (instant feedback, mainly in dev mode). */
function PendingBar() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 -bottom-1.5 h-[2px] origin-left rounded-full bg-brand-500 transition-transform duration-300",
        pending ? "scale-x-100 animate-pulse" : "scale-x-0",
      )}
    />
  );
}

const itemClass = (active: boolean) =>
  cn(
    "relative inline-flex items-center gap-1.5 whitespace-nowrap transition-colors",
    active ? "font-bold text-brand-400" : "font-semibold text-ink hover:text-brand-500",
  );

/** Public site header — logo and the Olitec menu (with Customer Care and Connect dropdowns), no account details. */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setOpen(false);
    // A dropdown stays open while it holds focus; release it after navigating.
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && navRef.current?.contains(focused)) focused.blur();
  }, [pathname]);

  return (
    <header className="relative z-30 bg-white">
      <div className="mx-auto flex h-[61px] max-w-[1440px] items-center justify-between mt-6 mb-5 px-4 sm:px-8 xl:mt-[44px] xl:mb-[29px] xl:pl-[102px] xl:pr-[109px]">
        <Link href="/" aria-label={`${siteConfig.name} home`} className="shrink-0">
          <Image src="/images/home/olitec-logo.png" alt={siteConfig.name} width={202} height={61} priority className="h-[44px] w-auto xl:h-[61px]" />
        </Link>

        <nav ref={navRef} className="hidden items-center gap-7 font-nav text-base leading-6 lg:flex xl:gap-[42px]" aria-label="Main">
          {mainNav.map((item) => {
            const active = isActive(pathname, item);
            if (!item.children) {
              return (
                <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={itemClass(active)}>
                  {item.label}
                  <PendingBar />
                </Link>
              );
            }
            return (
              <div key={item.label} className="group relative">
                <Link href={item.href} aria-haspopup="true" className={cn(itemClass(active), "py-2")}>
                  {item.label}
                  <ChevronDown className="size-4 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" aria-hidden />
                  <PendingBar />
                </Link>
                {/* Dropdown opens on hover or keyboard focus, as in the HTML design. */}
                <div className="invisible absolute left-1/2 top-full z-40 w-[300px] -translate-x-1/2 pt-3 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
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

        <button
          type="button"
          className="rounded-lg p-2 text-ink hover:bg-slate-100 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <nav
          className="absolute inset-x-0 top-full max-h-[calc(100vh-6rem)] overflow-y-auto border-t border-slate-100 bg-white px-4 pb-4 shadow-lg sm:px-8 lg:hidden"
          aria-label="Mobile"
        >
          {mainNav.map((item) =>
            item.children ? (
              <div key={item.label} className="py-1">
                <p className={cn("px-3 pb-1 pt-3 font-nav text-base", isActive(pathname, item) ? "font-bold text-brand-400" : "font-semibold text-ink")}>
                  {item.label}
                </p>
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "relative block rounded-lg py-2.5 pl-6 pr-3 font-nav text-[15px]",
                      matchesPath(pathname, child.href) ? "font-bold text-brand-400" : "font-semibold text-ink hover:bg-slate-50",
                    )}
                  >
                    {child.label}
                    <PendingBar />
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative block rounded-lg px-3 py-3 font-nav text-base",
                  isActive(pathname, item) ? "font-bold text-brand-400" : "font-semibold text-ink hover:bg-slate-50",
                )}
              >
                {item.label}
                <PendingBar />
              </Link>
            ),
          )}
        </nav>
      )}
    </header>
  );
}
