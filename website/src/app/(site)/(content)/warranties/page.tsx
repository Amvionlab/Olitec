import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { WarrantyList } from "@/components/warranties/WarrantyList";
import { getMyWarranties } from "@/services/warranties";
import type { WarrantyStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "My warranties", robots: { index: false } };

const statuses: WarrantyStatus[] = ["Active", "Pending", "Expired", "Rejected"];

interface WarrantiesPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function WarrantiesPage({ searchParams }: WarrantiesPageProps) {
  const { status: statusParam } = await searchParams;
  const status = statuses.find((s) => s === statusParam);
  const [all, filtered] = await Promise.all([getMyWarranties(), getMyWarranties(status)]);

  const counts = Object.fromEntries(statuses.map((s) => [s, all.filter((w) => w.status === s).length]));
  const tabs = [{ label: "All", value: undefined, count: all.length }, ...statuses.map((s) => ({ label: s, value: s, count: counts[s] }))];

  return (
    <Container>
      <PageHeader
        title="My warranties"
        description="Warranty status for every product registered to your account."
        actions={
          <>
            <ButtonLink href="/profile" variant="secondary">
              My profile
            </ButtonLink>
            <ButtonLink href="/warranties/register">
              <Plus className="size-4" aria-hidden /> Register a product
            </ButtonLink>
          </>
        }
      />

      <Card>
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 pt-3" aria-label="Filter by status">
          {tabs.map((tab) => {
            const active = tab.value === status;
            return (
              <Link
                key={tab.label}
                href={tab.value ? `/warranties?status=${tab.value}` : "/warranties"}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-3 pb-3 text-sm font-medium transition-colors",
                  active ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800",
                )}
              >
                {tab.label}
                <span className={cn("rounded-full px-2 text-xs", active ? "bg-brand-50" : "bg-slate-100")}>{tab.count}</span>
              </Link>
            );
          })}
        </nav>

        {filtered.length > 0 ? (
          <WarrantyList warranties={filtered} />
        ) : (
          <EmptyState
            title={status ? `No ${status.toLowerCase()} warranties` : "No registered products yet"}
            description="Register a product with its serial number and invoice to activate warranty cover."
            action={<ButtonLink href="/warranties/register">Register a product</ButtonLink>}
          />
        )}
      </Card>
    </Container>
  );
}
