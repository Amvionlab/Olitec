import type { ReactNode } from "react";
import { Container } from "@/components/ui";

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <Container className="flex justify-center py-12">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-6 ring-1 ring-slate-200 sm:p-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
        </div>
        {children}
        {footer && <div className="border-t border-slate-100 pt-4 text-center text-sm text-slate-600">{footer}</div>}
      </div>
    </Container>
  );
}

/** Only same-site relative paths are accepted as post-login destinations (no open redirects). */
export function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/account";
}
