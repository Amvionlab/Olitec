"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const tabs = [
  {
    label: "Product Master",
    href: "/admin/dashboard/products",
    match: ["/admin/dashboard/products", "/admin/products$"],
  },
  {
    label: "Product Registration History",
    href: "/admin/dashboard/warranties",
    match: ["/admin/dashboard/warranties", "/admin/warranties"],
  },
  {
    label: "Serial Number Report",
    href: "/admin/dashboard/serial-numbers",
    match: ["/admin/dashboard/serial-numbers", "/admin/products/serial-report"],
  },
];

export default function ProductManagementTabs() {
  const pathname = usePathname() || "";

  return (
    <div className="w-full flex items-center justify-start overflow-x-auto py-1">
      <div className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href ||
            tab.match.some((m) => {
              if (m.endsWith("$")) return pathname === m.slice(0, -1);
              return pathname.startsWith(m);
            });

          return (
            <Link key={tab.label} href={tab.href}>
              <motion.div
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className={`
                  flex items-center justify-center
                  rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold
                  whitespace-nowrap transition-all duration-200 cursor-pointer
                  ${
                    active
                      ? "bg-[#111c2e] text-white shadow-sm font-bold"
                      : "bg-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-100/70"
                  }
                `}
              >
                {tab.label}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
