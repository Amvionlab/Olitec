
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Package, Barcode } from "lucide-react";

const tabs = [
  {
    label: "Product Master",
    href: "/admin/dashboard/products",
    icon: Package,
    activeColor: "bg-amber-500 text-slate-950",
  },
  {
    label: "Serial Number",
    href: "/admin/dashboard/serial-numbers",
    icon: Barcode,
    activeColor: "bg-amber-500 text-slate-950",
  },
];

export default function ProductManagementTabs() {
  const pathname = usePathname();

  return (
    <div className="flex justify-center sm:justify-start">
      <div className="inline-grid grid-cols-2 gap-1 rounded-xl
        border border-slate-200 bg-white p-1 shadow-sm">

        {tabs.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link key={tab.href} href={tab.href}>
              <motion.div
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className={`
                  flex min-w-[145px] sm:min-w-[175px]
                  h-10 items-center justify-center gap-2
                  rounded-lg px-3 text-xs sm:text-sm
                  font-semibold transition-colors duration-300
                  ${
                    active
                      ? `${tab.activeColor} shadow-sm font-bold`
                      : "bg-transparent text-slate-600 hover:bg-slate-100"
                  }
                `}
              >
                <Icon size={17} strokeWidth={2} />
                {tab.label}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
