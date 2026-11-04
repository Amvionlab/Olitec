/** Raise a service request — from the Olitec HTML design (Olitec-Website/service-request.html). */
import type { Metadata } from "next";
import { companyContact, customerCareNav, serviceRequestPage } from "@/content/pages";
import { EnquiryForm } from "@/components/legacy/EnquiryForm";
import { BulletList, HelpCard, LegacyCard, LegacyPage, PageHero, Section, headingFont } from "@/components/legacy/ui";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Raise a service request",
  description: serviceRequestPage.lead,
  alternates: { canonical: "/service-request" },
};

export default function ServiceRequestPage() {
  return (
    <LegacyPage>
      <PageHero art="turnkey"
        eyebrow={serviceRequestPage.eyebrow}
        title={serviceRequestPage.title}
        lead={serviceRequestPage.lead}
        subnav={customerCareNav}
        current="/service-request"
      />
      <Section>
        <div className="flex flex-wrap items-start gap-12">
          <div className="min-w-0 flex-[1.6_1_520px]">
            <EnquiryForm kind="service" />
          </div>
          <aside className="min-w-0 flex-[1_1_280px] space-y-5">
            <HelpCard phones={companyContact.phones} />
            <LegacyCard>
              <h3 className={cn(headingFont, "mb-2.5 text-[20px] font-semibold")}>What happens next</h3>
              <BulletList items={serviceRequestPage.nextSteps} ordered className="text-base [&>li]:mb-2" />
            </LegacyCard>
          </aside>
        </div>
      </Section>
    </LegacyPage>
  );
}
