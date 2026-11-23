import Link from "next/link";
import { SlimPageBanner } from "./SlimPageBanner";
import { cn } from "@/lib/cn";

export function ConnectBanner({ current }: { current: "/channel-partners" | "/homes-and-businesses" | "/careers" }) {
  const tabs = [
    { href: "/channel-partners", label: "For channel partners" },
    { href: "/homes-and-businesses", label: "For homes and businesses" },
    { href: "/careers", label: "Careers" },
  ] as const;

  return (
    <SlimPageBanner
      title="Connect with Olitec"
      accentWords="Olitec"
      lead="Partner with us, plan a system for your site, or build your career."
    >
      <nav aria-label="Connect tabs" className="inline-flex items-center gap-1 rounded-full bg-white/70 p-1 border border-black/10 shadow-xs backdrop-blur-md">
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
