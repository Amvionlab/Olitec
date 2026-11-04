import type { Metadata } from "next";
import { Clock, Mail, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SupportCenter } from "@/components/support/SupportCenter";
import { getCurrentCustomer } from "@/services/customer";
import { getMySupportRequests } from "@/services/support";
import { getMyWarranties } from "@/services/warranties";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Support",
  description: `Contact ${siteConfig.name} for installation, repairs and warranty claims.`,
};

export default async function SupportPage() {
  const [customer, requests, warranties] = await Promise.all([getCurrentCustomer(), getMySupportRequests(), getMyWarranties()]);

  return (
    <Container>
      <PageHeader title="Support" description="Installation, repairs, warranty claims and general questions." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Phone, label: "Toll-free helpline", value: siteConfig.supportPhone, href: `tel:${siteConfig.supportPhone.replace(/\s/g, "")}` },
          { icon: Mail, label: "Email", value: siteConfig.supportEmail, href: `mailto:${siteConfig.supportEmail}` },
          { icon: Clock, label: "Working hours", value: siteConfig.supportHours },
        ].map(({ icon: Icon, label, value, href }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Icon className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              {href ? (
                <a href={href} className="text-sm font-medium text-slate-900 hover:text-brand-700">
                  {value}
                </a>
              ) : (
                <p className="text-sm font-medium text-slate-900">{value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <SupportCenter
        customer={customer}
        initialRequests={requests}
        warrantyNumbers={warranties.filter((w) => w.status === "Active" || w.status === "Pending").map((w) => w.warrantyNumber)}
      />
    </Container>
  );
}
