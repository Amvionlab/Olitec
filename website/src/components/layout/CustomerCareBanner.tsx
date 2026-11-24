import Link from "next/link";
import { SlimPageBanner } from "./SlimPageBanner";
import { cn } from "@/lib/cn";

export type CustomerCareTab = "/warranties/register" | "/warranty-status" | "/service-request";

export function CustomerCareBanner({ current }: { current: CustomerCareTab }) {
  const tabs = [
    { href: "/warranties/register", label: "Register warranty" },
    { href: "/warranty-status", label: "Check warranty status" },
    { href: "/service-request", label: "Raise service request" },
  ] as const;

  return (
    <SlimPageBanner
      title="Customer Care & Warranty Desk"
      accentWords="Warranty Desk"
      lead="Activate product protection, look up verified coverage, or book certified field service."
    >
      <nav
        aria-label="Customer Care navigation"
        className="inline-flex items-center gap-1 rounded-full bg-white/70 p-1 border border-black/10 shadow-xs backdrop-blur-md"
      >
        {tabs.map((tab) => {
          const isActive = current === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-bold transition-all sm:px-4",
                isActive
                  ? "bg-[#161E2C] text-white shadow-xs"
                  : "text-[#161E2C] hover:bg-black/5 hover:text-[#D45C0A]"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </SlimPageBanner>
  );
}
