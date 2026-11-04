"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LifeBuoy, LogOut, MapPin, Package, User } from "lucide-react";
import { Container, Spinner } from "@/components/ui";
import { useStore } from "@/store/StoreProvider";
import { cn } from "@/utils/format";

const links = [
  { href: "/account", label: "Profile", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/support", label: "Support", icon: LifeBuoy },
];

/** Account area. The UI redirects guests to sign in; every account API also requires the session server-side. */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { customer, signOut } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (customer === null) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [customer, pathname, router]);

  if (!customer) return <Spinner label="Checking your account" />;

  return (
    <Container className="py-8">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Account" className="flex gap-1 overflow-x-auto lg:flex-col">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/account" ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium", active ? "bg-brand-50 text-brand-800" : "text-slate-700 hover:bg-white")}>
                <Icon className="size-4" aria-hidden /> {label}
              </Link>
            );
          })}
          <button onClick={() => void signOut()} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-white">
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
