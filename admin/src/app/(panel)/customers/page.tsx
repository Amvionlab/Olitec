import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination, buildHref } from "@/components/ui/Pagination";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TBody, THead, Td, Th } from "@/components/ui/Table";
import { listCustomers } from "@/services/customers";
import type { CustomerStatus } from "@/lib/types";
import { formatDate, formatMobile } from "@/lib/format";

export const metadata: Metadata = { title: "Customers" };

interface CustomersPageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

const customerStatuses: CustomerStatus[] = ["Active", "Inactive"];

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams;
  const status = customerStatuses.find((s) => s === params.status);
  const result = await listCustomers({ q: params.q, status, page: Number(params.page) || 1 });

  return (
    <>
      <PageHeader title="Customers" description="Search registered customers and review their products and warranties." />
      <Card>
        <FilterBar
          action="/customers"
          query={params.q}
          placeholder="Search by name, email or mobile number"
          selects={[{ name: "status", label: "Status", value: status, options: customerStatuses.map((s) => ({ value: s, label: s })) }]}
        />
        {result.items.length === 0 ? (
          <EmptyState title="No customers match your search" description="Check the spelling or try a different email or mobile number." />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Customer</Th>
                <Th>Mobile</Th>
                <Th>City</Th>
                <Th className="text-center">Products</Th>
                <Th className="text-center">Active warranties</Th>
                <Th>Registered</Th>
                <Th>Status</Th>
              </tr>
            </THead>
            <TBody>
              {result.items.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50">
                  <Td>
                    <Link href={`/customers/${customer.id}`} className="font-medium text-slate-900 hover:text-brand-700">
                      {customer.name}
                    </Link>
                    <p className="text-xs text-slate-500">{customer.email}</p>
                  </Td>
                  <Td className="whitespace-nowrap text-slate-600">{formatMobile(customer.mobile)}</Td>
                  <Td className="text-slate-600">{customer.city}</Td>
                  <Td className="text-center">{customer.productCount}</Td>
                  <Td className="text-center">{customer.activeWarranties}</Td>
                  <Td className="whitespace-nowrap text-slate-500">{formatDate(customer.registeredAt)}</Td>
                  <Td>
                    <StatusBadge status={customer.status} />
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
          hrefForPage={(page) => buildHref("/customers", { q: params.q, status, page })}
        />
      </Card>
    </>
  );
}
