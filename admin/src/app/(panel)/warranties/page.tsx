import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination, buildHref } from "@/components/ui/Pagination";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TBody, THead, Td, Th } from "@/components/ui/Table";
import { getProductOptions, listWarranties, warrantyStatuses } from "@/services/warranties";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Warranties" };

interface WarrantiesPageProps {
  searchParams: Promise<{ q?: string; status?: string; product?: string; page?: string }>;
}

export default async function WarrantiesPage({ searchParams }: WarrantiesPageProps) {
  const params = await searchParams;
  const status = warrantyStatuses.find((s) => s === params.status);
  const products = await getProductOptions();
  const productId = products.find((p) => p.id === params.product)?.id;
  const result = await listWarranties({ q: params.q, status, productId, page: Number(params.page) || 1 });

  return (
    <>
      <PageHeader title="Warranties" description="Review registration requests and manage warranty status." />
      <Card>
        <FilterBar
          action="/warranties"
          query={params.q}
          placeholder="Search warranty no., serial, invoice or customer"
          selects={[
            { name: "status", label: "Status", value: status, options: warrantyStatuses.map((s) => ({ value: s, label: s })) },
            { name: "product", label: "Product", value: productId, options: products.map((p) => ({ value: p.id, label: p.name })) },
          ]}
        />
        {result.items.length === 0 ? (
          <EmptyState title="No warranties found" description="Try removing a filter or searching by serial number." />
        ) : (
          <Table className="min-w-[860px]">
            <THead>
              <tr>
                <Th>Warranty no.</Th>
                <Th>Customer</Th>
                <Th>Product / serial</Th>
                <Th>Purchased</Th>
                <Th>Coverage ends</Th>
                <Th>Status</Th>
                <Th className="text-right">Action</Th>
              </tr>
            </THead>
            <TBody>
              {result.items.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50">
                  <Td className="whitespace-nowrap font-medium text-slate-900">{w.warrantyNumber}</Td>
                  <Td>
                    <Link href={`/customers/${w.customer.id}`} className="text-slate-800 hover:text-brand-700">
                      {w.customer.name}
                    </Link>
                  </Td>
                  <Td>
                    <p className="text-slate-800">{w.product.name}</p>
                    <p className="text-xs text-slate-500">{w.serialNumber}</p>
                  </Td>
                  <Td className="whitespace-nowrap text-slate-500">{formatDate(w.purchaseDate)}</Td>
                  <Td className="whitespace-nowrap text-slate-500">{formatDate(w.endDate)}</Td>
                  <Td>
                    <StatusBadge status={w.status} />
                  </Td>
                  <Td className="text-right">
                    <Link href={`/warranties/${w.id}`} className="font-medium text-brand-700 hover:underline">
                      {w.status === "Pending" ? "Review" : "View"}
                    </Link>
                  </Td>
                </tr>
              ))}
            </TBody>
          </Table>
        )}
        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
          pageSize={result.pageSize}
          hrefForPage={(page) => buildHref("/warranties", { q: params.q, status, product: productId, page })}
        />
      </Card>
    </>
  );
}
