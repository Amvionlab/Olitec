"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Heart, LogOut, Menu, Package, ShoppingCart, User, X } from "lucide-react";
import { useStore } from "@/store/StoreProvider";
import type { Category } from "@/types";
import { SearchBox } from "./SearchBox";

export function Header({ categories }: { categories: Category[] }) {
  const { cart, customer, signOut } = useStore();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const count = cart?.itemCount ?? 0;

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="brand-gradient px-4 py-1.5 text-center text-xs font-medium text-white">Secure payments · GST invoice with every order · Bulk quotations for projects</div>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:gap-6 lg:px-8">
        <button className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <Link href="/" className="shrink-0" aria-label="OLITEC Shop home">
          <Image src="/images/olitec-logo.png" alt="OLITEC" width={202} height={61} priority className="h-9 w-auto sm:h-11" />
        </Link>
        <Suspense fallback={<div className="hidden h-11 flex-1 md:block" />}>
          <SearchBox className="hidden flex-1 md:block" />
        </Suspense>
        <nav className="ml-auto flex items-center gap-1" aria-label="Account">
          <div className="relative">
            {customer ? (
              <button
                onClick={() => setAccountOpen((open) => !open)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
              >
                <User className="size-5" aria-hidden />
                <span className="hidden max-w-28 truncate sm:inline">{customer.name.split(" ")[0]}</span>
                <ChevronDown className="hidden size-4 sm:block" aria-hidden />
              </button>
            ) : (
              <Link href="/login" className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                <User className="size-5" aria-hidden />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            )}
            {accountOpen && customer && (
              <div role="menu" className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                <Link role="menuitem" href="/account" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50">
                  <User className="size-4" aria-hidden /> My account
                </Link>
                <Link role="menuitem" href="/account/orders" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50">
                  <Package className="size-4" aria-hidden /> My orders
                </Link>
                <button role="menuitem" onClick={() => void signOut()} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-slate-50">
                  <LogOut className="size-4" aria-hidden /> Sign out
                </button>
              </div>
            )}
          </div>
          <Link href="/wishlist" className="rounded-lg p-2 text-slate-700 hover:bg-slate-100" aria-label="Wishlist">
            <Heart className="size-5" />
          </Link>
          <Link href="/cart" className="relative rounded-lg p-2 text-slate-700 hover:bg-slate-100" aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}>
            <ShoppingCart className="size-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-white">{count > 99 ? "99+" : count}</span>
            )}
          </Link>
        </nav>
      </div>
      <div className="px-4 pb-3 md:hidden">
        <Suspense fallback={<div className="h-11" />}>
          <SearchBox />
        </Suspense>
      </div>

      <nav className="hidden border-t border-slate-100 lg:block" aria-label="Categories">
        <ul className="mx-auto flex max-w-7xl items-center gap-1 px-8">
          <li>
            <Link href="/products" className="block px-3 py-2.5 text-sm font-semibold text-slate-700 hover:text-brand-600">
              All products
            </Link>
          </li>
          {categories.slice(0, 7).map((category) => (
            <li key={category.id} className="group relative">
              <Link href={`/categories/${category.slug}`} className="flex items-center gap-1 px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-brand-600">
                {category.name}
                {category.children.length > 0 && <ChevronDown className="size-3.5" aria-hidden />}
              </Link>
              {category.children.length > 0 && (
                <ul className="invisible absolute left-0 top-full z-50 min-w-56 rounded-xl border border-slate-200 bg-white py-2 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  {category.children.map((child) => (
                    <li key={child.id}>
                      <Link href={`/categories/${child.slug}`} className="block px-4 py-2 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700">
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
          <li className="ml-auto">
            <Link href="/bulk-purchase" className="block px-3 py-2.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
              Bulk purchase
            </Link>
          </li>
          <li>
            <Link href="/track-order" className="block px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-brand-600">
              Track order
            </Link>
          </li>
        </ul>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-slate-900/50" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
          <div className="relative h-full w-80 max-w-[85%] overflow-y-auto bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <Image src="/images/olitec-logo.png" alt="OLITEC" width={202} height={61} className="h-9 w-auto" />
              <button onClick={() => setMenuOpen(false)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <ul className="space-y-1">
              <li>
                <Link href="/products" className="block rounded-lg px-3 py-2 font-semibold hover:bg-slate-50">
                  All products
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <Link href={`/categories/${category.slug}`} className="block rounded-lg px-3 py-2 font-medium hover:bg-slate-50">
                    {category.name}
                  </Link>
                  {category.children.map((child) => (
                    <Link key={child.id} href={`/categories/${child.slug}`} className="block rounded-lg py-1.5 pl-7 pr-3 text-sm text-slate-600 hover:bg-slate-50">
                      {child.name}
                    </Link>
                  ))}
                </li>
              ))}
              <li className="border-t border-slate-100 pt-2">
                <Link href="/bulk-purchase" className="block rounded-lg px-3 py-2 font-semibold text-brand-700 hover:bg-slate-50">
                  Bulk purchase
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="block rounded-lg px-3 py-2 hover:bg-slate-50">
                  Track order
                </Link>
              </li>
              <li>
                <Link href="/contact" className="block rounded-lg px-3 py-2 hover:bg-slate-50">
                  Contact us
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
