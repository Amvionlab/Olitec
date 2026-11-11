/** Check warranty status — from the Olitec HTML design (Olitec-Website/warranty-status.html). */
import type { Metadata } from "next";
import Link from "next/link";
import { companyContact, customerCareNav, warrantyStatusPage } from "@/content/pages";
import { WarrantyStatusForm } from "@/components/legacy/WarrantyStatusForm";
import { HelpCard, LegacyPage, PageHero, Section, legacyButtonSecondary } from "@/components/legacy/ui";

export const metadata: Metadata = {
  title: "Check warranty status",
  description: warrantyStatusPage.lead,
  alternates: { canonical: "/warranty-status" },
};

export default function WarrantyStatusPage() {
  return (
    <LegacyPage>
      <PageHero art="turnkey"
        eyebrow={warrantyStatusPage.eyebrow}
        title={warrantyStatusPage.title}
        lead={warrantyStatusPage.lead}
        subnav={customerCareNav}
        current="/warranty-status"
      />
      <Section>
        <div className="reveal-on-scroll flex flex-wrap items-start gap-12">
          <div className="min-w-0 flex-[1.6_1_520px]">
            <WarrantyStatusForm />
          </div>
          <aside className="min-w-0 flex-[1_1_280px]">
            <HelpCard phones={companyContact.phones}>
              <Link className={legacyButtonSecondary} href={warrantyStatusPage.notRegistered.href}>
                {warrantyStatusPage.notRegistered.label}
              </Link>
            </HelpCard>
          </aside>
        </div>
      </Section>
    </LegacyPage>
  );
}
