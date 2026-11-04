"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { api, toQuery } from "@/services/api";
import { formatPrice } from "@/utils/format";

interface Suggestions {
  products: { slug: string; name: string; sku: string; image: string | null; sellingPrice: number }[];
  categories: { name: string; slug: string }[];
}

/** Search box with live product/category suggestions (combobox pattern, keyboard accessible). */
export function SearchBox({ className }: { className?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [data, setData] = useState<Suggestions | null>(null);
  const listId = useId();
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setData(null);
      return;
    }
    const timer = setTimeout(() => {
      api.get<Suggestions>(`/products/suggest${toQuery({ q: term })}`).then(setData).catch(() => setData(null));
    }, 200);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const close = (event: MouseEvent) => !wrapper.current?.contains(event.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const options = [
    ...(data?.categories ?? []).map((category) => ({ key: `c-${category.slug}`, href: `/categories/${category.slug}`, label: category.name, kind: "category" as const })),
    ...(data?.products ?? []).map((product) => ({ key: `p-${product.slug}`, href: `/products/${product.slug}`, label: product.name, kind: "product" as const, product })),
  ];

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setOpen(false);
    if (active >= 0 && options[active]) router.push(options[active].href);
    else router.push(`/products${toQuery({ q: q.trim() })}`);
  };

  return (
    <div ref={wrapper} className={`relative ${className ?? ""}`}>
      <form role="search" onSubmit={submit}>
        <label htmlFor={`${listId}-input`} className="sr-only">
          Search products
        </label>
        <input
          id={`${listId}-input`}
          type="search"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => Math.min(index + 1, options.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, -1));
            } else if (event.key === "Escape") setOpen(false);
          }}
          placeholder="Search panels, inverters, batteries…"
          role="combobox"
          aria-expanded={open && options.length > 0}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          maxLength={100}
          className="h-11 w-full rounded-full border border-slate-300 bg-white pl-4 pr-12 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        <button type="submit" className="absolute right-1 top-1 flex size-9 items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-600" aria-label="Search">
          <Search className="size-4" />
        </button>
      </form>
      {open && options.length > 0 && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-12 z-50 max-h-96 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {options.map((option, index) => (
            <li key={option.key} id={`${listId}-${index}`} role="option" aria-selected={index === active}>
              <Link
                href={option.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-sm ${index === active ? "bg-brand-50" : "hover:bg-slate-50"}`}
              >
                {option.kind === "product" ? (
                  <>
                    <span className="relative size-10 shrink-0 overflow-hidden rounded bg-slate-100">
                      {option.product.image && <Image src={option.product.image} alt="" fill sizes="40px" className="object-contain" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-slate-900">{option.label}</span>
                      <span className="text-xs text-slate-500">{option.product.sku}</span>
                    </span>
                    <span className="font-semibold">{formatPrice(option.product.sellingPrice)}</span>
                  </>
                ) : (
                  <span>
                    <span className="text-slate-500">Category: </span>
                    <span className="font-medium text-slate-900">{option.label}</span>
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
