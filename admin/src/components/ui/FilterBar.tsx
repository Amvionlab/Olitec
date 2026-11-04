import Link from "next/link";
import { Search } from "lucide-react";
import { buttonClasses } from "./Button";

interface FilterSelect {
  name: string;
  label: string;
  value?: string;
  options: { value: string; label: string }[];
}

interface FilterBarProps {
  action: string;
  query?: string;
  placeholder: string;
  selects?: FilterSelect[];
}

/** GET form for list pages — filters live in the URL, so results are shareable and work without JavaScript. */
export function FilterBar({ action, query, placeholder, selects = [] }: FilterBarProps) {
  const hasFilters = Boolean(query) || selects.some((s) => s.value);
  return (
    <form action={action} className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center" role="search">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>
      {selects.map((select) => (
        <select
          key={select.name}
          name={select.name}
          defaultValue={select.value ?? ""}
          aria-label={select.label}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 lg:w-48"
        >
          <option value="">{select.label}: All</option>
          {select.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
      <div className="flex gap-2">
        <button type="submit" className={buttonClasses("primary", "md")}>
          Apply
        </button>
        {hasFilters && (
          <Link href={action} className={buttonClasses("ghost", "md")}>
            Reset
          </Link>
        )}
      </div>
    </form>
  );
}
