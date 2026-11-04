import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-bold text-brand-500">404</p>
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="max-w-md text-slate-600">The page or product you are looking for does not exist or is no longer available.</p>
      <div className="flex gap-3">
        <Link href="/" className="rounded-lg bg-brand-500 px-5 py-2.5 font-semibold text-white hover:bg-brand-600">Go to home</Link>
        <Link href="/products" className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold hover:bg-slate-50">Browse products</Link>
      </div>
    </div>
  );
}
