
"use client";

import { Menu, Bell, UserCircle } from "lucide-react";

export default function AdminHeader({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 md:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Admin Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Manage your OLITEC website
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 hover:bg-slate-100">
          <Bell size={21} />
        </button>

        <div className="flex items-center gap-2">
          <UserCircle size={32} className="text-slate-600" />
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-900">Administrator</p>
            <p className="text-xs text-slate-500">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
