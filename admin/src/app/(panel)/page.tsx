import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Package, ShieldCheck, ShieldOff, Users } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TBody, THead, Td, Th } from "@/components/ui/Table";
import { StatCard } from "@/components/dashboard/StatCard";
import { MonthlyBarChart, StatusBreakdown } from "@/components/dashboard/Charts";
import { getDashboardStats, getMonthlyRegistrations, listWarranties } from "@/services/warranties";
import { MOCK_REFERENCE_DATE } from "@/mock/data";
import { formatDate, formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [stats, monthly, pending] = await Promise.all([
    getDashboardStats(),
    getMonthlyRegistrations(MOCK_REFERENCE_DATE),
    listWarranties({ status: "Pending" }),
  ]);

  return (
    <>
      <PageHeader title="Dashboard" description={`Overview as of ${formatDate(MOCK_REFERENCE_DATE.toISOString())} · sample data`} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Summary">
        <StatCard label="Total customers" value={stats.totalCustomers} icon={Users} tone="brand" href="/customers" />
        <StatCard label="Registered products" value={stats.totalRegisteredProducts} icon={Package} tone="violet" href="/warranties" />
        <StatCard label="Active warranties" value={stats.activeWarranties} icon={ShieldCheck} tone="emerald" href="/warranties?status=Active" />
        <StatCard label="Expired warranties" value={stats.expiredWarranties} icon={ShieldOff} tone="slate" href="/warranties?status=Expired" />
        <StatCard label="Pending requests" value={stats.pendingRequests} icon={Clock} tone="amber" href="/warranties?status=Pending" />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Warranty registrations" description="Requests submitted per month, last 6 months" />
          <MonthlyBarChart data={monthly} />
        </Card>
        <Card>
          <CardHeader title="Warranties by status" description="All registrations" />
          <StatusBreakdown
            data={[
              { status: "Active", count: stats.activeWarranties },
              { status: "Pending", count: stats.pendingRequests },
              { status: "Expired", count: stats.expiredWarranties },
              { status: "Rejected", count: stats.rejectedWarranties },
            ]}
          />
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Pending warranty requests"
          description="Most recent submissions"
          action={
            <Link href="/warranties?status=Pending" className="text-sm font-medium text-brand-700 hover:underline">
              View all
            </Link>
          }
        />
        {pending.items.length === 0 ? (
          <EmptyState title="No pending requests" description="All warranty registrations have been reviewed." />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Warranty no.</Th>
                <Th>Customer</Th>
                <Th>Product</Th>
                <Th>Submitted</Th>
                <Th>Status</Th>
                <Th className="text-right">Action</Th>
              </tr>
            </THead>
            <TBody>
              {pending.items.slice(0, 5).map((w) => (
                <tr key={w.id} className="hover:bg-slate-50">
                  <Td className="font-medium text-slate-900">{w.warrantyNumber}</Td>
                  <Td>{w.customer.name}</Td>
                  <Td className="text-slate-600">{w.product.name}</Td>
                  <Td className="text-slate-500">{formatDateTime(w.submittedAt)}</Td>
                  <Td>
                    <StatusBadge status={w.status} />
                  </Td>
                  <Td className="text-right">
                    <Link href={`/warranties/${w.id}`} className="font-medium text-brand-700 hover:underline">
                      Review
                    </Link>
                  </Td>
                </tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}
