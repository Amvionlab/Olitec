"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
import { getStoredToken, getStoredUser, logout, type UserProfile } from "@/services/auth";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Product Master", href: "/admin/products", icon: Package },
  { label: "User Management", href: "/admin/users", icon: Users },
  { label: "Warranty Desk", href: "/admin/warranties", icon: ShieldCheck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (!token || storedUser?.role !== "admin") {
      setAuthorized(false);
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
      return;
    }

    setUser(storedUser);
    setAuthorized(true);
  }, [pathname]);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white p-4 font-sans">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-md">
          <div className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4">
            <UserCheck className="size-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Administrator Access Required</h2>
          <p className="mt-2 text-sm text-slate-400">
            You must be signed in with an administrator account to view the Olitec Admin Portal.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/login"
              className="w-full sm:w-auto inline-flex h-10 items-center justify-center rounded-xl bg-amber-500 px-5 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
            >
              Sign In as Admin
            </a>
            <a
              href="/"
              className="w-full sm:w-auto inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Return to Website
            </a>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Desktop Fixed Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-slate-950 text-white lg:flex">
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
            <div className="flex items-center rounded-xl bg-white px-2.5 py-1.5 shadow-xs">
              <Image
                src="/images/home/olitec-logo.png"
                alt="Olitec"
                width={116}
                height={35}
                priority
                className="h-6 w-auto object-contain"
              />
            </div>
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
              ADMIN
            </span>
          </Link>
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
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <ExternalLink size={14} />
              Our Legacy
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
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex items-center rounded-xl bg-white px-2.5 py-1 shadow-xs">
                  <Image
                    src="/images/home/olitec-logo.png"
                    alt="Olitec"
                    width={110}
                    height={32}
                    className="h-5 w-auto object-contain"
                  />
                </div>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                  ADMIN
                </span>
              </Link>
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

            <div className="border-t border-white/10 p-4 space-y-2">
              <Link
                href="/"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
              >
                <ExternalLink size={16} />
                Our Legacy (Website)
              </Link>
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
            <div className="flex items-center lg:hidden">
              <Image
                src="/images/home/olitec-logo.png"
                alt="Olitec"
                width={90}
                height={26}
                className="h-5 w-auto object-contain"
              />
            </div>
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
