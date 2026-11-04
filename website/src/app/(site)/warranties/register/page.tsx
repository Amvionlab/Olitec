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
    <div className="bg-slate-50 px-4 py-12 font-sans sm:py-16">
      <header className="mb-10 text-center">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-orange-600">{warrantyRegistrationHero.eyebrow}</p>
        <h1 className="mb-3 text-3xl font-bold text-slate-900 sm:text-[32px]">{warrantyRegistrationHero.title}</h1>
        <p className="text-[15px] text-slate-600">{warrantyRegistrationHero.lead}</p>
      </header>
      <div className="mx-auto max-w-[848px] rounded-2xl bg-white px-5 py-8 shadow-[0_1px_3px_rgb(15_23_42/0.06),0_1px_2px_rgb(15_23_42/0.04)] sm:px-9 sm:py-10">
        <WarrantyRegistrationForm defaultProductModel={defaultProductModel} />
      </div>
    </div>
  );
}
