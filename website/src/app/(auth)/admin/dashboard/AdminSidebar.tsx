
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  ShieldCheck,
  ClipboardList,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  X,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "User Management", href: "/admin/dashboard/users", icon: Users },
  { label: "Product Management", href: "/admin/dashboard/products", icon: Package },
  { label: "Warranty Management", href: "/admin/dashboard/warranties", icon: ShieldCheck },
  { label: "Warranty Registrations", href: "/admin/dashboard/registrations", icon: ClipboardList },
  { label: "Enquiries", href: "/admin/dashboard/enquiries", icon: MessageSquare },
  { label: "Reports", href: "/admin/dashboard/reports", icon: BarChart3 },
  { label: "Settings", href: "/admin/dashboard/settings", icon: Settings },
];

export default function AdminSidebar({
  onClose,
}: {
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-72 flex-col bg-slate-950 text-white">
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
        <div>
          <h2 className="text-2xl font-bold tracking-wide">
            <span className="text-amber-400">OLI</span>TEC
          </h2>
          <p className="text-xs text-slate-400">Administration Panel</p>
        </div>

        <button onClick={onClose} className="lg:hidden">
          <X size={20} />
        </button>
      </div>

      <div className="px-5 py-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Main Menu
        </p>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
                  active
                    ? "bg-amber-500 font-semibold text-slate-950"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={19} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-white/10 p-5">
        <button
          onClick={() => {
            window.location.href = "/admin/login";
          }}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-red-400 hover:bg-white/10"
        >
          <LogOut size={19} />
          Logout
        </button>
      </div>
    </aside>
  );
}
