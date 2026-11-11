import type { Metadata } from "next";
import { Suspense } from "react";
import { warrantyRegistrationHero } from "@/content/pages";
import { WarrantyRegistrationForm } from "@/components/warranties/WarrantyRegistrationForm";
import { WarrantyRegisterFormWrapper } from "@/components/warranties/WarrantyRegisterFormWrapper";

export const metadata: Metadata = {
  title: "Warranty registration",
  description: warrantyRegistrationHero.lead,
  alternates: { canonical: "/warranties/register" },
};

export default function RegisterWarrantyPage() {
  return (
    <div className="bg-white px-4 py-12 font-sans sm:py-16">
      <header className="reveal-on-scroll mx-auto mb-10 max-w-[848px] text-center">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-brand-600">{warrantyRegistrationHero.eyebrow}</p>
        <h1 className="mb-3 text-[34px] font-semibold leading-tight text-black sm:text-[40px]">{warrantyRegistrationHero.title}</h1>
        <p className="text-base leading-6 text-muted">{warrantyRegistrationHero.lead}</p>
      </header>
      <div className="reveal-on-scroll reveal-delay-1 mx-auto max-w-[848px] rounded-[25.528px] border-[0.912px] border-[#e6e6e6] bg-white px-5 py-8 shadow-[0_8px_32px_rgb(0_0_0/0.04)] sm:px-9 sm:py-10">
        <Suspense fallback={<WarrantyRegistrationForm />}>
          <WarrantyRegisterFormWrapper />
        </Suspense>
      </div>
    </div>
  );
}
