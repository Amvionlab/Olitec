/**
 * Shown the moment a menu link is clicked, while the next page is rendered (header and footer stay in place).
 * Shaped like the page banner so the layout does not jump when the page arrives.
 */
export default function SiteLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-20 sm:px-8 xl:px-[82px]" role="status" aria-live="polite">
      <span className="sr-only">Loading page…</span>
      <div className="h-[360px] animate-pulse rounded-[32px] bg-gradient-to-r from-neutral-800 to-neutral-200 xl:h-[420px] xl:rounded-[57px]" aria-hidden />
      <div className="mt-14 space-y-4 xl:px-[31px]" aria-hidden>
        <div className="h-10 w-2/5 animate-pulse rounded-full bg-[rgb(217_217_217/0.6)]" />
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-[rgb(217_217_217/0.5)]" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-[rgb(217_217_217/0.5)]" />
      </div>
    </div>
  );
}
