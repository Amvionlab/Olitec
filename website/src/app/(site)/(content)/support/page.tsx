
import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SupportCenter } from "@/components/support/SupportCenter";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Customer Support Desk",
  description: `Contact ${siteConfig.name} customer care (${siteConfig.supportPhone}) for solar hybrid inverter installation, service requests, and warranty help.`,
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  return (
    <Container>
      <div className="reveal-on-scroll">
        <PageHeader
          title="Support"
          description="Installation, repairs, warranty claims and general questions."
        />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {[
          {
            icon: Phone,
            label: "Customer care",
            value: siteConfig.supportPhone,
            href: `tel:${siteConfig.supportPhone.replace(/\s/g, "")}`,
          },
          {
            icon: Mail,
            label: "Email",
            value: siteConfig.supportEmail,
            href: `mailto:${siteConfig.supportEmail}`,
          },
        ].map(({ icon: Icon, label, value, href }, idx) => (
          <div
            key={label}
            className={`reveal-on-scroll reveal-delay-${idx + 1} flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm`}
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Icon className="size-5" aria-hidden />
            </span>

            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <a
                href={href}
                className="text-sm font-medium text-slate-900 hover:text-brand-700"
              >
                {value}
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="reveal-on-scroll reveal-delay-2">
        <SupportCenter
          initialRequests={[]}
          warrantyNumbers={[]}
        />
      </div>
    </Container>
  );
}
