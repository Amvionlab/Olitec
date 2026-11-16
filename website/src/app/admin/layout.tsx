"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Menu,
  X,
  UserCheck,
} from "lucide-react";
import { getStoredToken, getStoredUser, clearStoredSession, type UserProfile } from "@/services/auth";

const navItems = [
  { label: "Dashboard & Analytics", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Product Master", href: "/admin/products", icon: Package },
  { label: "User Management", href: "/admin/users", icon: Users },
  { label: "Warranty Desk", href: "/admin/warranties", icon: ShieldCheck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (pathname === "/admin/login") return;

    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (!token || storedUser?.role !== "admin") {
      router.replace("/admin/login");
    } else {
      setUser(storedUser);
    }
  }, [pathname, router]);

  // If viewing admin login, render cleanly without admin shell
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-400">Loading…</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    clearStoredSession();
    router.replace("/admin/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop Fixed Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-slate-950 text-white lg:flex">
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 font-bold text-slate-950">
            O
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white">OLITEC</span>
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                ADMIN
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Platform Control Center</p>
          </div>
        </div>

        {/* Navigation (scrollable inside sidebar if needed) */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Operations
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href === "/admin/dashboard" && pathname === "/admin");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout (fixed at bottom of sidebar) */}
        <div className="shrink-0 border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-white/5 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
              <UserCheck size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{user?.name || "Administrator"}</p>
              <p className="truncate text-[11px] text-slate-400">{user?.email || "admin@olitec.in"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <ExternalLink size={14} />
              Storefront
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center rounded-lg border border-red-500/30 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative flex w-72 flex-col bg-slate-950 text-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 font-bold text-slate-950">
                  O
                </span>
                <span className="font-bold tracking-tight text-white">OLITEC ADMIN</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-amber-500 text-slate-950"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-white/10 p-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/20 py-2.5 text-xs font-semibold text-red-400"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area (offset left by sidebar width on desktop) */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base font-semibold text-slate-900 md:text-lg">
              {pathname.includes("/products")
                ? "Product Master Management"
                : pathname.includes("/users")
                  ? "User Management"
                  : pathname.includes("/warranties")
                    ? "Warranty Desk & Registrations"
                    : "Administration & Analytics"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-slate-900">{user?.name || "Administrator"}</p>
              <p className="text-[11px] text-slate-500">{user?.email || "admin@olitec.in"}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-xs">
              {(user?.name || "A").slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
