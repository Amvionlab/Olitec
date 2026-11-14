import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProductImage } from "@/components/products/ProductImage";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { getCurrentCustomer } from "@/services/customer.server";
import { getMyWarranties } from "@/services/warranties";
import { formatDate, formatDateTime } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My profile", robots: { index: false } };

export default async function ProfilePage() {
  const [customer, warranties] = await Promise.all([getCurrentCustomer(), getMyWarranties()]);
  const registeredProducts = warranties.filter((w) => w.status !== "Rejected");

  return (
    <Container>
      <div className="reveal-on-scroll">
        <PageHeader title="My profile" description="Manage your contact details and view your product history." />
      </div>

      <div className="space-y-6">
        <div className="reveal-on-scroll">
          <ProfileCard initialCustomer={customer} />
        </div>

        <div className="reveal-on-scroll reveal-delay-1">
          <Card>
          <CardHeader title="Registered products" description={`${registeredProducts.length} products linked to your account`} />
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {registeredProducts.map((w) => (
              <Link
                key={w.id}
                href={`/products/${w.product.slug}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
              >
                <ProductImage category={w.product.category} name={w.product.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{w.product.name}</p>
                    <span className="shrink-0 rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">3D CAD</span>
                  </div>
                  <p className="truncate text-xs text-slate-500">S/N {w.serialNumber} · View 3D</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
        </div>

        <div className="reveal-on-scroll reveal-delay-2">
          <Card>
            <CardHeader title="Warranty history" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Warranty no.</th>
                    <th className="px-5 py-3 font-medium">Product</th>
                    <th className="px-5 py-3 font-medium">Submitted</th>
                    <th className="px-5 py-3 font-medium">Coverage</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {warranties.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link href={`/warranties/${w.id}`} className="font-medium text-brand-700 hover:underline">
                          {w.warrantyNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-slate-700">{w.product.name}</td>
                      <td className="px-5 py-3 text-slate-500">{formatDateTime(w.submittedAt)}</td>
                      <td className="px-5 py-3 text-slate-500">
                        {w.startDate ? `${formatDate(w.startDate)} – ${formatDate(w.endDate)}` : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={w.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </Container>
  );
}
