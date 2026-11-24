import type { Metadata } from "next";
import { Suspense } from "react";
import { serviceRequestPage } from "@/content/pages";
import { LegacyPage } from "@/components/legacy/ui";
import { CustomerCareBanner } from "@/components/layout/CustomerCareBanner";
import { ServiceRequestExplorer } from "@/components/customer-care/ServiceRequestExplorer";

export const metadata: Metadata = {
  title: "Raise a service request",
  description: serviceRequestPage.lead,
  alternates: { canonical: "/service-request" },
};

export default function ServiceRequestPage() {
  return (
    <LegacyPage>
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
