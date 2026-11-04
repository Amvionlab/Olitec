import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { WarrantyReview } from "@/components/warranties/WarrantyReview";
import { getWarranty } from "@/services/warranties";
import { getCurrentAdmin } from "@/services/session";

export const metadata: Metadata = { title: "Warranty details" };

interface WarrantyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function WarrantyDetailPage({ params }: WarrantyDetailPageProps) {
  const [warranty, admin] = await Promise.all([getWarranty((await params).id), getCurrentAdmin()]);
  if (!warranty) notFound();

  return (
    <>
      <PageHeader
        title={warranty.warrantyNumber}
        description={`${warranty.product.name} · ${warranty.customer.name}`}
        back={{ href: "/warranties", label: "Warranties" }}
      />
      <WarrantyReview key={warranty.id} initialWarranty={warranty} admin={admin} />
    </>
  );
}
