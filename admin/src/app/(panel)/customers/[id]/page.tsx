import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TBody, THead, Td, Th } from "@/components/ui/Table";
import { getCustomerWithWarranties } from "@/services/customers";
import { formatDate, formatMobile, initials } from "@/lib/format";

export const metadata: Metadata = { title: "Customer details" };

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const data = await getCustomerWithWarranties((await params).id);
  if (!data) notFound();
  const { customer, warranties } = data;

  const products = warranties.filter((w) => w.status !== "Rejected");
  const counts = {
    Active: warranties.filter((w) => w.status === "Active").length,
    Pending: warranties.filter((w) => w.status === "Pending").length,
    Expired: warranties.filter((w) => w.status === "Expired").length,
  };

  return (
    <>
      <PageHeader title={customer.name} description={`Customer ID ${customer.id}`} back={{ href: "/customers", label: "Customers" }} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <div className="flex items-center gap-4 border-b border-slate-100 p-5">
            <span className="flex size-12 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
              {initials(customer.name)}
            </span>
            <div>
              <p className="font-semibold text-slate-900">{customer.name}</p>
              <StatusBadge status={customer.status} className="mt-1" />
            </div>
          </div>
          <dl className="divide-y divide-slate-100 text-sm">
            {[
              { label: "Email", value: customer.email },
              { label: "Mobile", value: formatMobile(customer.mobile) },
              { label: "Location", value: `${customer.city}, ${customer.state}` },
              { label: "Registered on", value: formatDate(customer.registeredAt) },
            ].map((item) => (
              <div key={item.label} className="flex justify-between gap-4 px-5 py-3">
                <dt className="text-slate-500">{item.label}</dt>
                <dd className="text-right font-medium text-slate-900">{item.value}</dd>
              </div>
            ))}
          </dl>
          <div className="grid grid-cols-3 border-t border-slate-100 text-center">
            {Object.entries(counts).map(([label, value]) => (
              <div key={label} className="px-2 py-4">
                <p className="text-xl font-semibold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Registered products" description={`${products.length} products`} />
            {products.length === 0 ? (
              <EmptyState title="No registered products" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {products.map((w) => (
                  <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{w.product.name}</p>
                      <p className="text-xs text-slate-500">
                        {w.product.model} · S/N {w.serialNumber} · Purchased {formatDate(w.purchaseDate)}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500">{w.dealerName}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Warranties" description="All registration requests, including rejected ones" />
            {warranties.length === 0 ? (
              <EmptyState title="No warranties" />
            ) : (
              <Table className="min-w-[600px]">
                <THead>
                  <tr>
                    <Th>Warranty no.</Th>
                    <Th>Product</Th>
                    <Th>Coverage</Th>
                    <Th>Status</Th>
                  </tr>
                </THead>
                <TBody>
                  {warranties.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <Td>
                        <Link href={`/warranties/${w.id}`} className="font-medium text-brand-700 hover:underline">
                          {w.warrantyNumber}
                        </Link>
                      </Td>
                      <Td className="text-slate-600">{w.product.name}</Td>
                      <Td className="whitespace-nowrap text-slate-500">
                        {w.startDate ? `${formatDate(w.startDate)} – ${formatDate(w.endDate)}` : "—"}
                      </Td>
                      <Td>
                        <StatusBadge status={w.status} />
                      </Td>
                    </tr>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
