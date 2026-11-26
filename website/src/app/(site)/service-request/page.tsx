import type { Metadata } from "next";
import { Suspense } from "react";
import { serviceRequestPage } from "@/content/pages";
import { LegacyPage } from "@/components/legacy/ui";
import { CustomerCareBanner } from "@/components/layout/CustomerCareBanner";
import { ServiceRequestExplorer } from "@/components/customer-care/ServiceRequestExplorer";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Raise Solar Inverter & Battery Service Request",
  description:
    "Book authorized Olitec field technician support for your hybrid inverter or LFP storage system, or call customer care at 8501 800 800.",
  alternates: { canonical: "/service-request" },
};

export default function ServiceRequestPage() {
  return (
    <LegacyPage>
      <BreadcrumbJsonLd
        items={[
          { name: "Customer Care", path: "/warranties/register" },
          { name: "Service Request", path: "/service-request" },
        ]}
      />
      <CustomerCareBanner current="/service-request" />
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 font-semibold">
            Loading service request desk...
          </div>
        }
      >
        <ServiceRequestExplorer />
      </Suspense>
    </LegacyPage>
  );
}
