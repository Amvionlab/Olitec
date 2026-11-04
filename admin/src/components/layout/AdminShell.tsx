"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ChevronDown,
  CreditCard,
  FileClock,
  FolderTree,
  Handshake,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  TicketPercent,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { AdminUser } from "@/lib/types";
import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/warranties", label: "Warranties", icon: ShieldCheck },
];

// E-Commerce module (real backend data, separate shop staff session — see components/ecommerce/EcomSession.tsx).
const ecommerceNavItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/ecommerce", label: "Shop dashboard", icon: ShoppingBag },
  { href: "/ecommerce/orders", label: "Orders", icon: ShoppingCart },
  { href: "/ecommerce/products", label: "Products", icon: Package },
  { href: "/ecommerce/categories", label: "Categories & brands", icon: FolderTree },
  { href: "/ecommerce/inventory", label: "Inventory", icon: Boxes },
  { href: "/ecommerce/customers", label: "Shop customers", icon: Users },
  { href: "/ecommerce/payments", label: "Payments & refunds", icon: CreditCard },
  { href: "/ecommerce/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/ecommerce/enquiries", label: "Bulk enquiries", icon: Handshake },
  { href: "/ecommerce/support", label: "Support tickets", icon: LifeBuoy },
  { href: "/ecommerce/reviews", label: "Reviews", icon: Star },
  { href: "/ecommerce/content", label: "Website content", icon: LayoutTemplate },
  { href: "/ecommerce/reports", label: "Reports", icon: BarChart3 },
  { href: "/ecommerce/users", label: "Shop staff", icon: UserCog },
  { href: "/ecommerce/settings", label: "Store settings", icon: Settings },
  { href: "/ecommerce/audit-logs", label: "Audit log", icon: FileClock },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/ecommerce") return pathname === "/ecommerce";
  return pathname.startsWith(href);
}

function NavLink({ href, label, icon: Icon, pathname }: { href: string; label: string; icon: LucideIcon; pathname: string }) {
  return (
    <Link
      href={href}
      aria-current={isActive(pathname, href) ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive(pathname, href) ? "bg-slate-800 text-white" : "hover:bg-slate-800/60 hover:text-white",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </Link>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      <div className="flex h-16 items-center gap-2 px-5 font-semibold text-white">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        Olitech Admin
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Admin">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} pathname={pathname} />
        ))}
        <p className="px-3 pb-1 pt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">E-Commerce</p>
        {ecommerceNavItems.map((item) => (
          <NavLink key={item.href} {...item} pathname={pathname} />
        ))}
      </nav>
      <p className="px-5 py-4 text-xs text-slate-500">Phase 1 demo · mock data</p>
    </div>
  );
}

export function AdminShell({ admin, children }: { admin: AdminUser; children: ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <Sidebar pathname={pathname} />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button className="absolute inset-0 bg-slate-900/50" onClick={() => setDrawerOpen(false)} aria-label="Close navigation" />
          <div className="relative h-full w-64">
            <Sidebar pathname={pathname} />
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Close navigation"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
        <button
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>
        <div className="ml-auto" ref={menuRef}>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 hover:bg-slate-100"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {initials(admin.name)}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium text-slate-900">{admin.name}</span>
                <span className="block text-xs text-slate-500">{admin.role}</span>
              </span>
              <ChevronDown className="size-4 text-slate-400" aria-hidden />
            </button>
            {menuOpen && (
              <div role="menu" className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">{admin.name}</p>
                  <p className="truncate text-xs text-slate-500">{admin.email}</p>
                </div>
                <Link role="menuitem" href="/login" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                  <LogOut className="size-4" aria-hidden /> Sign out
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
