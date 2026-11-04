import Image from "next/image";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import type { Category, PublicSettings } from "@/types";

// Same icon files as the main website footer (lucide-react 1.x has no brand icons).
const socialIcons = { facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", youtube: "YouTube" } as const;

/** Footer: contact details and social links come from Admin → Settings; policy links list only published pages. */
export function Footer({ settings, categories, pages }: { settings: PublicSettings | null; categories: Category[]; pages: { slug: string; title: string }[] }) {
  const social = Object.entries(settings?.social ?? {}).filter(([, url]) => url) as [keyof typeof socialIcons, string][];
  return (
    <footer className="mt-16 bg-forest text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          <Image src="/images/olitec-logo.png" alt="OLITEC" width={202} height={61} className="h-12 w-auto rounded bg-white p-1.5" />
          {settings?.store.address && <p className="text-sm text-slate-300">{settings.store.address}</p>}
          <ul className="space-y-2 text-sm">
            {settings?.store.supportPhone && (
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-brand-300" aria-hidden />
                <a href={`tel:${settings.store.supportPhone.replace(/\s/g, "")}`} className="hover:text-white">
                  {settings.store.supportPhone}
                </a>
              </li>
            )}
            {settings?.store.supportEmail && (
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-brand-300" aria-hidden />
                <a href={`mailto:${settings.store.supportEmail}`} className="hover:text-white">
                  {settings.store.supportEmail}
                </a>
              </li>
            )}
          </ul>
          {social.length > 0 && (
            <div className="flex gap-2">
              {social
                .filter(([network]) => network in socialIcons)
                .map(([network, url]) => (
                  <a key={network} href={url} target="_blank" rel="noopener noreferrer" aria-label={socialIcons[network]} className="rounded-full bg-white p-2 hover:bg-brand-50">
                    <Image src={`/images/icons/${network}.svg`} alt="" width={16} height={16} className="size-4" />
                  </a>
                ))}
            </div>
          )}
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Shop</h2>
          <ul className="space-y-2 text-sm">
            {categories.slice(0, 7).map((category) => (
              <li key={category.id}>
                <Link href={`/categories/${category.slug}`} className="hover:text-white">
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/bulk-purchase" className="hover:text-white">
                Bulk purchase
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Help</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/track-order" className="hover:text-white">Track your order</Link></li>
            <li><Link href="/account/orders" className="hover:text-white">My orders</Link></li>
            <li><Link href="/faqs" className="hover:text-white">FAQs</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact us</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">Policies</h2>
          {pages.length ? (
            <ul className="space-y-2 text-sm">
              {pages.map((page) => (
                <li key={page.slug}>
                  <Link href={`/policies/${page.slug}`} className="hover:text-white">
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Policies will be published soon.</p>
          )}
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-400">© {new Date().getFullYear()} {settings?.store.name ?? "OLITEC Shop"}. All rights reserved.</div>
    </footer>
  );
}
