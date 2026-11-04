import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Record not found</h1>
      <p className="mt-2 text-sm text-slate-500">The page or record you requested does not exist.</p>
      <ButtonLink href="/" className="mt-6">
        Back to dashboard
      </ButtonLink>
    </div>
  );
}
