"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Phone,
  ChevronDown,
  Menu,
  X,
  UserRound,
  LogOut,
  ArrowRight,
  ShieldCheck,
  Search,
  Wrench,
  Users,
  Home as HomeIcon,
  Briefcase,
} from "lucide-react";
import { mainNav, siteConfig, type NavItem } from "@/lib/site";
import { cn } from "@/lib/cn";
import { getStoredToken, getStoredUser, logout } from "@/services/auth";
import { AuthModal } from "@/components/auth/AuthModal";

function matchesPath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isActive(pathname: string, item: NavItem) {
  const paths = [item.href, ...(item.match ?? []), ...(item.children?.map((child) => child.href) ?? [])];
  return paths.some((href) => matchesPath(pathname, href));
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // User session
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
    setUserDropdownOpen(false);
  }, [pathname]);

  // Track scroll position to adjust frosted glass opacity
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync auth status
  useEffect(() => {
    let isMounted = true;
    const syncAuth = () => {
      const stored = getStoredUser();
      const token = getStoredToken();
      if (!stored || !token) {
        if (isMounted) {
          setCustomerName(null);
          setRole(null);
        }
      } else {
        if (isMounted) {
          setCustomerName(stored.name);
          setRole(stored.role);
        }
      }
    };
    syncAuth();
    window.addEventListener("olitec_auth_change", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      isMounted = false;
      window.removeEventListener("olitec_auth_change", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  const handleSignOut = async () => {
    await logout();
    setUserDropdownOpen(false);
    router.replace("/");
  };

  const handleMouseEnter = (label: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setOpenDropdown(label);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 180);
  };

  const getDropdownIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("register")) return <ShieldCheck className="size-4 text-[#E8962C]" />;
    if (l.includes("status")) return <Search className="size-4 text-[#E8962C]" />;
    if (l.includes("service")) return <Wrench className="size-4 text-[#E8962C]" />;
    if (l.includes("channel") || l.includes("partner")) return <Users className="size-4 text-[#E8962C]" />;
    if (l.includes("home") || l.includes("business")) return <HomeIcon className="size-4 text-[#E8962C]" />;
    if (l.includes("career")) return <Briefcase className="size-4 text-[#E8962C]" />;
    return <ArrowRight className="size-3.5 text-[#E8962C]" />;
  };

  return (
    <>
      {/* Dimmed backdrop when mobile menu is open (Item M18) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#161E2C]/40 backdrop-blur-[3px] transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Floating Glass Bar Container (Item M18) */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none px-3 sm:px-4 pt-3 sm:pt-4">
        <header
          className={cn(
            "pointer-events-auto mx-auto flex h-[62px] sm:h-[68px] max-w-[1480px] items-center justify-between rounded-full px-4 sm:px-6 transition-all duration-300",
            mobileOpen
              ? "bg-[#FFF7EA] shadow-[0_12px_30px_rgba(40,30,10,0.16)] border border-white"
              : scrolled
              ? "bg-[#FFF7EA]/92 md:bg-[#FFF7EA]/85 md:backdrop-blur-[16px] shadow-[0_12px_30px_rgba(40,30,10,0.16)] border border-white/75"
              : "bg-[#FFFAF2]/94 md:bg-[#FFFAF2]/65 md:backdrop-blur-[16px] shadow-[0_12px_30px_rgba(40,30,10,0.12)] border border-white/75",
          )}
        >
          {/* Logo on Left */}
          <Link href="/" aria-label="Olitec Home" className="shrink-0 transition-transform hover:scale-[1.02]">
            <Image
              src="/images/home/olitec-logo.png"
              alt="Olitec"
              width={160}
              height={48}
              className="h-[36px] sm:h-[42px] w-auto"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1 min-[1180px]:flex" aria-label="Main Navigation">
            {mainNav.map((item) => {
              const active = isActive(pathname, item);
              const isDropdown = Boolean(item.children && item.children.length > 0);
              const isCurrentOpen = openDropdown === item.label;

              if (!isDropdown) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative rounded-full px-3.5 py-1.5 text-[14px] font-semibold transition-all duration-200",
                      active
                        ? "bg-[#161E2C]/[0.08] text-[#161E2C] font-bold"
                        : "text-[#161E2C] hover:bg-[#161E2C]/[0.05]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              }

              // Dropdown items (Customer Care & Connect)
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(item.label)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(isCurrentOpen ? null : item.label)}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[14px] font-semibold transition-all duration-200 cursor-pointer",
                      isCurrentOpen
                        ? "bg-[#161E2C] text-white shadow-xs"
                        : active
                        ? "bg-[#161E2C]/[0.08] text-[#161E2C] font-bold"
                        : "text-[#161E2C] hover:bg-[#161E2C]/[0.05]",
                    )}
                  >
                    <span>{item.label}</span>
                    <ChevronDown
                      className={cn(
                        "size-3.5 transition-transform duration-200",
                        isCurrentOpen ? "rotate-180 text-white" : "text-[#161E2C]/70",
                      )}
                    />
                  </button>

                  {/* Dropdown Card */}
                  {isCurrentOpen && (
                    <div className="absolute left-1/2 top-full mt-2.5 w-[310px] -translate-x-1/2 rounded-2xl border border-white/80 bg-[#FFFAF2]/95 p-2 shadow-[0_16px_36px_rgba(40,30,10,0.18)] backdrop-blur-[20px] transition-all">
                      <div className="space-y-1">
                        {item.children?.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setOpenDropdown(null)}
                            className="group flex items-start gap-3 rounded-xl p-2.5 transition-all hover:bg-[#E8962C]/[0.14]"
                          >
                            <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/90 shadow-2xs">
                              {getDropdownIcon(child.label)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13.5px] font-bold text-[#161E2C] group-hover:text-[#C46E0E] transition-colors">
                                {child.label}
                              </p>
                              <p className="text-[11.5px] text-[#6B7280] leading-snug">
                                {child.description}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right End: Caller Number & User Actions */}
          <div className="flex items-center gap-3">
            {/* Caller Number (Item 4 & M18): 8501 800 800 */}
            <a
              href="tel:8501800800"
              className="hidden sm:inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[14px] font-bold text-[#161E2C] transition-all hover:bg-[#161E2C]/[0.07]"
              title="Call Olitec Customer Care"
            >
              <Phone className="size-4 text-[#161E2C]" />
              <span>8501 800 800</span>
            </a>

            {/* User Session Profile / Login */}
            {customerName ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex size-9 items-center justify-center rounded-full bg-[#161E2C] font-bold text-white text-xs shadow-xs transition hover:scale-105 cursor-pointer"
                  title={customerName}
                >
                  {customerName.charAt(0).toUpperCase()}
                </button>
                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-white/80 bg-[#FFFAF2] p-2 shadow-xl backdrop-blur-md">
                    <div className="border-b border-[#E6E2D8] px-2.5 py-2">
                      <p className="truncate text-xs font-bold text-[#161E2C]">{customerName}</p>
                      <p className="text-[10.5px] text-[#C46E0E] capitalize font-semibold">{role || "Customer"}</p>
                    </div>
                    <Link
                      href={role === "admin" ? "/admin/dashboard" : "/warranties"}
                      onClick={() => setUserDropdownOpen(false)}
                      className="mt-1 flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-[#161E2C] hover:bg-[#E8962C]/15"
                    >
                      <span>Dashboard</span>
                      <ArrowRight className="size-3 text-[#161E2C]" />
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="mt-1 flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <span>Sign out</span>
                      <LogOut className="size-3" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="hidden md:inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[#161E2C] hover:bg-[#161E2C]/[0.06] transition cursor-pointer"
              >
                <UserRound className="size-3.5 text-[#161E2C]" />
                <span>Sign in</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle (below 1180px) */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex size-10 items-center justify-center rounded-full text-[#161E2C] hover:bg-[#161E2C]/[0.08] min-[1180px]:hidden cursor-pointer transition-colors"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="size-6 text-[#161E2C]" /> : <Menu className="size-6 text-[#161E2C]" />}
            </button>
          </div>
        </header>

        {/* Mobile Dropdown Menu Card (Item M18) */}
        {mobileOpen && (
          <div className="pointer-events-auto mx-auto mt-2 max-w-[1480px] rounded-3xl border border-white/80 bg-[#FFFAF2]/98 p-5 shadow-[0_20px_45px_rgba(40,30,10,0.2)] backdrop-blur-[20px] transition-all min-[1180px]:hidden">
            <div className="space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto">
              {/* Main Nav Links */}
              <div className="space-y-1">
                {mainNav.map((item) => {
                  const active = isActive(pathname, item);
                  const isDropdown = Boolean(item.children && item.children.length > 0);

                  if (!isDropdown) {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "block rounded-xl px-3.5 py-2.5 text-base font-bold transition",
                          active ? "text-[#C46E0E] bg-[#E8962C]/10" : "text-[#161E2C] hover:bg-[#161E2C]/[0.05]",
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  }

                  // Dropdown categories rendered open directly on mobile (Item M18)
                  return (
                    <div key={item.label} className="pt-2 border-t border-[#E6E2D8]">
                      <p className="px-3.5 text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                        {item.label}
                      </p>
                      <div className="mt-1 space-y-1">
                        {item.children?.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-[#161E2C] hover:bg-[#E8962C]/10 transition"
                          >
                            <span className="size-1.5 rounded-full bg-[#E8962C]" />
                            <span>{child.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions on Mobile: Call Number & Talk to Engineers */}
              <div className="pt-3 border-t border-[#E6E2D8] space-y-2.5">
                <a
                  href="tel:8501800800"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#161E2C]/[0.05] text-sm font-bold text-[#161E2C] hover:bg-[#161E2C]/10 transition"
                >
                  <Phone className="size-4 text-[#161E2C]" />
                  <span>Call 8501 800 800</span>
                </a>

                <Link
                  href="/homes-and-businesses"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#E8962C] to-[#F3BE48] text-sm font-bold text-[#161E2C] shadow-sm hover:brightness-105 transition"
                >
                  Talk to our engineers
                </Link>

                {!customerName && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setAuthModalOpen(true);
                    }}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#E6E2D8] text-xs font-semibold text-[#161E2C]"
                  >
                    <UserRound className="size-3.5 text-[#161E2C]" />
                    <span>Customer / Partner Sign in</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spacer so page content starts cleanly below the floating header */}
      <div className="h-[80px] sm:h-[92px] w-full" aria-hidden />

      {/* Auth Modal for Login/Registration */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
