/**
 * Warranty registration — public form (no account needed). Submissions are saved to MySQL through
 * POST /api/warranty-registrations together with the invoice and installation document.
 */
import type { Metadata } from "next";
import { warrantyRegistrationHero } from "@/content/pages";
import { getProductById } from "@/services/products";
import { WarrantyRegistrationForm } from "@/components/warranties/WarrantyRegistrationForm";

export const metadata: Metadata = {
  title: "Warranty registration",
  description: warrantyRegistrationHero.lead,
  alternates: { canonical: "/warranties/register" },
};

interface RegisterWarrantyPageProps {
  searchParams: Promise<{ product?: string }>;
}

export default async function RegisterWarrantyPage({ searchParams }: RegisterWarrantyPageProps) {
  const { product } = await searchParams;
  // Product pages link here with ?product=<id>; prefill its model number.
  const defaultProductModel = product ? (getProductById(product)?.model ?? "") : "";

  return (
    <div className="bg-white px-4 py-12 font-sans sm:py-16">
      <header className="reveal-on-scroll mx-auto mb-10 max-w-[848px] text-center">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-brand-600">{warrantyRegistrationHero.eyebrow}</p>
        <h1 className="mb-3 text-[34px] font-semibold leading-tight text-black sm:text-[40px]">{warrantyRegistrationHero.title}</h1>
        <p className="text-base leading-6 text-muted">{warrantyRegistrationHero.lead}</p>
      </header>
      <div className="reveal-on-scroll reveal-delay-1 mx-auto max-w-[848px] rounded-[25.528px] border-[0.912px] border-[#e6e6e6] bg-white px-5 py-8 shadow-[0_8px_32px_rgb(0_0_0/0.04)] sm:px-9 sm:py-10">
        <WarrantyRegistrationForm defaultProductModel={defaultProductModel} />
      </div>
    </div>
  );
}
